const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelSettingsPath = path.join(__dirname, '../level-ayarlar.json');

// Ayarları okumak ve yazmak için yardımcı fonksiyonlar
const readSettings = () => {
    if (fs.existsSync(levelSettingsPath)) {
        try {
            return JSON.parse(fs.readFileSync(levelSettingsPath, 'utf-8'));
        } catch {
            return {}; // JSON bozuksa boş obje döndür
        }
    }
    return {};
};

const writeSettings = (data) => {
    fs.writeFileSync(levelSettingsPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seviye-ayarlari')
        .setDescription('Seviye sistemi ile ilgili ayarları yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('kanal-ayarla')
                .setDescription('Seviye atlama bildirimlerinin gönderileceği kanalı ayarlar.')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Bildirim kanalı (Sıfırlamak için boş bırakın).')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false) // Sıfırlama için zorunlu değil
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mesaj-ayarla')
                .setDescription('Özel seviye atlama mesajını ayarlar. Değişkenler: {user}, {level}')
                .addStringOption(option =>
                    option.setName('mesaj')
                        .setDescription('Örn: 🎉 {user}, {level}. seviyeye ulaştı!')
                        .setRequired(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ayarlari-goster')
                .setDescription('Mevcut seviye ayarlarını gösterir.')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const settings = readSettings();

        // Sunucu için ayarlar yoksa, varsayılanları oluştur
        if (!settings[guildId]) {
            settings[guildId] = {
                notificationChannel: null,
                levelUpMessage: '🎉 Tebrikler, {user}! **Seviye {level}** oldun!'
            };
        }

        switch (subcommand) {
            case 'kanal-ayarla': {
                const channel = interaction.options.getChannel('kanal');
                if (channel) {
                    settings[guildId].notificationChannel = channel.id;
                    writeSettings(settings);
                    await interaction.reply({ content: `✅ Seviye atlama bildirimleri başarıyla ${channel} kanalına ayarlandı.`, ephemeral: true });
                } else {
                    // Kanal belirtilmezse ayarı sıfırla
                    settings[guildId].notificationChannel = null;
                    writeSettings(settings);
                    await interaction.reply({ content: `✅ Seviye atlama bildirim kanalı sıfırlandı. Bildirimler artık seviye atlanan kanala gönderilecek.`, ephemeral: true });
                }
                break;
            }
            case 'mesaj-ayarla': {
                const message = interaction.options.getString('mesaj');
                // Gerekli değişkenlerin olup olmadığını kontrol et
                if (!message.includes('{user}') || !message.includes('{level}')) {
                    return interaction.reply({ content: '❌ Mesajınızda `{user}` ve `{level}` değişkenleri bulunmalıdır.', ephemeral: true });
                }
                settings[guildId].levelUpMessage = message;
                writeSettings(settings);
                await interaction.reply({ content: `✅ Yeni seviye atlama mesajı ayarlandı:\\n\`${message}\``, ephemeral: true });
                break;
            }
            case 'ayarlari-goster': {
                const guildSettings = settings[guildId];
                const channelName = guildSettings.notificationChannel ? `<#${guildSettings.notificationChannel}>` : 'Kullanıcının seviye atladığı kanal.';
                const message = guildSettings.levelUpMessage;

                const embed = new EmbedBuilder()
                    .setTitle('⚙️ Sunucu Seviye Ayarları')
                    .setColor('Blue')
                    .addFields(
                        { name: 'Bildirim Kanalı', value: channelName, inline: false },
                        { name: 'Seviye Atlama Mesajı', value: `\`${message}\``, inline: false }
                    );
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }
        }
    },
};

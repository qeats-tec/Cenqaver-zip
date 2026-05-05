const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const logConfigPath = path.join(__dirname, '..', 'log-config.json');

// Yardımcı fonksiyon: Yapılandırmayı dosyaya yaz
function saveLogConfig(data) {
    try {
        fs.writeFileSync(logConfigPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('log-config.json yazılırken hata:', error);
    }
}

// Yardımcı fonksiyon: Yapılandırmayı dosyadan oku
function getLogConfig() {
    try {
        if (fs.existsSync(logConfigPath)) {
            const data = fs.readFileSync(logConfigPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('log-config.json okunurken hata:', error);
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-kurulum')
        .setDescription('Bot için log kanallarını otomatik olarak kurar.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Sadece yöneticiler kullanabilir
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const config = getLogConfig();
        const guildId = guild.id;

        if (config[guildId] && config[guildId].setupComplete) {
            const existingCategory = guild.channels.cache.get(config[guildId].categoryId);
            if (existingCategory) {
                return interaction.editReply(`Log sistemi bu sunucuda zaten kurulu! Kategori: ${existingCategory.toString()}`);
            }
        }

        try {
            // 1. Kategori Oluştur
            const logCategory = await guild.channels.create({
                name: 'Voltix Logs',
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone, // @everyone rolü
                        deny: [PermissionsBitField.Flags.ViewChannel], // Görmeyi engelle
                    },
                    {
                        id: interaction.client.user.id, // Botun kendisi
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks], // İzinleri ayarla
                    },
                ],
            });

            // 2. Kanalları Oluştur
            const messageLogChannel = await guild.channels.create({ name: 'mesaj-log', type: ChannelType.GuildText, parent: logCategory });
            const punishmentLogChannel = await guild.channels.create({ name: 'ceza-log', type: ChannelType.GuildText, parent: logCategory });
            const ticketLogChannel = await guild.channels.create({ name: 'ticket-log', type: ChannelType.GuildText, parent: logCategory });

            // 3. Kanal ID'lerini kaydet
            config[guildId] = {
                setupComplete: true,
                categoryId: logCategory.id,
                messageLogId: messageLogChannel.id,
                punishmentLogId: punishmentLogChannel.id,
                ticketLogId: ticketLogChannel.id
            };
            saveLogConfig(config);
            
            // 4. Başarı mesajı gönder
            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Log Sistemi Başarıyla Kuruldu!')
                .setDescription(`Log kanalları **${logCategory.name}** kategorisi altında başarıyla oluşturuldu.`)
                .addFields(
                    { name: 'Mesaj Log', value: messageLogChannel.toString(), inline: true },
                    { name: 'Ceza Log', value: punishmentLogChannel.toString(), inline: true },
                    { name: 'Ticket Log', value: ticketLogChannel.toString(), inline: true }
                )
                .setFooter({ text: 'Bu kanallar sadece bot ve yöneticiler tarafından görülebilir.' });

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Log kurulumu sırasında hata:', error);
            await interaction.editReply('Log sistemi kurulurken bir hata oluştu. Lütfen botun \'Kanalları Yönet\' ve \'İzinleri Yönet\' yetkilerine sahip olduğundan emin olun.');
        }
    },
};
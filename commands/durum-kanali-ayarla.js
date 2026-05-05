const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const statusConfigPath = path.join(__dirname, '../status-config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durum-kanalı-ayarla')
        .setDescription('Botun durumunu göstereceği ses kanalını ve formatını ayarlar.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Durumun gösterileceği ses kanalı.')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Kanal adı formatı. Değişkenler: {user}, {members}')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için "Yönetici" yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('kanal');
        const format = interaction.options.getString('format') || 'Üye: {members}'; // Varsayılan format
        const guildId = interaction.guild.id;

        try {
            let config = {};
            if (fs.existsSync(statusConfigPath)) {
                const data = fs.readFileSync(statusConfigPath, 'utf8');
                if (data) {
                    config = JSON.parse(data);
                }
            }

            // Hem kanal ID'sini hem de formatı kaydet
            config[guildId] = { 
                channelId: channel.id,
                format: format
            };

            fs.writeFileSync(statusConfigPath, JSON.stringify(config, null, 2));

            await interaction.reply({ content: `✅ Durum kanalı başarıyla ${channel} olarak ayarlandı.\\nFormat: \`${format}\``, ephemeral: true });

        } catch (error) {
            console.error('Durum kanalı ayarlanırken bir hata oluştu:', error);
            await interaction.reply({ content: '❌ Ayarlar kaydedilirken bir hata oluştu. Lütfen dosya izinlerini kontrol edin.', ephemeral: true });
        }
    },
};

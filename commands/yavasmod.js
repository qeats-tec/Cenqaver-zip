const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yavaşmod')
        .setDescription('Kanal için yavaş modu ayarlar.')
        .addIntegerOption(option =>
            option.setName('süre')
                .setDescription('Saniye cinsinden yavaş mod süresi (0 kapatır).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yavaş modu ayarlama sebebi.')),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Kanalları Yönet` iznine sahip olmalısın.', ephemeral: true });
        }

        const duration = interaction.options.getInteger('süre');
        const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';

        if (duration < 0 || duration > 21600) { // Discord limiti 6 saattir (21600 saniye)
            return interaction.reply({ content: 'Süre 0 ile 21600 saniye arasında olmalıdır.', ephemeral: true });
        }

        try {
            await interaction.channel.setRateLimitPerUser(duration, reason);
            if (duration > 0) {
                await interaction.reply(`Bu kanal için yavaş mod **${duration}** saniye olarak ayarlandı. Sebep: ${reason}`);
            } else {
                await interaction.reply(`Yavaş mod bu kanal için kapatıldı.`);
            }
        } catch (error) {
            console.error('Yavaş mod ayarlanırken bir hata oluştu:', error);
            await interaction.reply({ content: 'Yavaş modu ayarlarken bir hata oluştu. Lütfen botun `Kanalları Yönet` izni olduğundan emin olun.', ephemeral: true });
        }
    },
};

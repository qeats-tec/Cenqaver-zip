const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oylama')
        .setDescription('Bir oylama (anket) başlatır.')
        .addStringOption(option =>
            option.setName('konu')
                .setDescription('Oylama konusu.')
                .setRequired(true)),
    async execute(interaction) {
        const topic = interaction.options.getString('konu');

        const embed = new EmbedBuilder()
            .setColor('#fee75c')
            .setTitle('📊 Oylama')
            .setDescription(topic)
            .setTimestamp()
            .setFooter({ text: `Oylamayı başlatan: ${interaction.user.tag}` });

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        await message.react('✅');
        await message.react('❌');
    },
};
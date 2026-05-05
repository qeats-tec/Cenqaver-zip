const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının yasağını kaldırır.')
        .addStringOption(option =>
            option.setName('kullanici_id')
                .setDescription('Yasağı kaldırılacak kullanıcının ID\'si.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userId = interaction.options.getString('kullanici_id');

        try {
            await interaction.guild.bans.fetch(userId);
        } catch (error) {
            return interaction.reply({ content: 'Bu ID\'ye sahip bir yasaklama bulunamadı.', ephemeral: true });
        }

        await interaction.guild.bans.remove(userId);
        await interaction.reply(`<@${userId}> ID\'li kullanıcının yasağı başarıyla kaldırıldı.`);
    },
};
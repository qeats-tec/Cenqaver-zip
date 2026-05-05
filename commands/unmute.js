const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Bir kullanıcının susturmasını kaldırır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Susturması kaldırılacak kullanıcı.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');

        // Botun yetkisini kontrol et
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: 'Kullanıcıların susturmasını kaldırmak için `Üyelere Zaman Aşımı Uygula` yetkim yok.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }

        if (!targetMember.isCommunicationDisabled()) {
            return interaction.reply({ content: 'Bu kullanıcı zaten susturulmamış.', ephemeral: true });
        }

        try {
            await targetMember.timeout(null); // null süresi zaman aşımını kaldırır
            await interaction.reply(`\`${targetUser.tag}\` kullanıcısının susturması başarıyla kaldırıldı.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Kullanıcının susturmasını kaldırırken bir hata oluştu.', ephemeral: true });
        }
    },
};
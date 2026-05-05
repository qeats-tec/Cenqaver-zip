const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rol-al')
        .setDescription('Bir kullanıcının rolünü alır.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Rolü alınacak kullanıcı.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Alınacak rol.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Rolleri Yönet` iznine sahip olmalısın.', ephemeral: true });
        }

        const targetMember = interaction.options.getMember('kullanıcı');
        const roleToRemove = interaction.options.getRole('rol');

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }

        // Botun rol hiyerarşisini kontrol et
        if (interaction.guild.members.me.roles.highest.position <= roleToRemove.position) {
            return interaction.reply({ content: 'Bu rolü yönetemem çünkü benim rolümden daha yüksek veya aynı seviyede.', ephemeral: true });
        }
        
        // Komutu kullanan kişinin hiyerarşisini kontrol et
        if (interaction.member.roles.highest.position <= roleToRemove.position && interaction.guild.ownerId !== interaction.member.id) {
            return interaction.reply({ content: 'Kendi rolünüzden daha yüksek veya aynı seviyedeki bir rolü alamazsınız.', ephemeral: true });
        }

        try {
            if (!targetMember.roles.cache.has(roleToRemove.id)) {
                return interaction.reply({ content: `Kullanıcının zaten **${roleToRemove.name}** rolü bulunmuyor.`, ephemeral: true });
            }

            await targetMember.roles.remove(roleToRemove);

            const embed = new EmbedBuilder()
                .setColor(0xED4245) // Kırmızı
                .setTitle('Rol Alındı')
                .setDescription(`**${targetMember.user.tag}** adlı kullanıcıdan **${roleToRemove.name}** rolü başarıyla alındı.`)
                .setThumbnail(targetMember.user.displayAvatarURL())
                .addFields(
                    { name: 'Kullanıcı', value: targetMember.toString(), inline: true },
                    { name: 'Rol', value: roleToRemove.toString(), inline: true },
                    { name: 'Moderatör', value: interaction.user.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Rol alma sırasında hata:', error);
            await interaction.reply({ content: 'Rol alınırken bir hata oluştu. Lütfen botun yetkilerini ve rol hiyerarşisini kontrol edin.', ephemeral: true });
        }
    },
};
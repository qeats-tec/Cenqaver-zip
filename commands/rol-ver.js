const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rol-ver')
        .setDescription('Bir kullanıcıya rol verir.')
        .addUserOption(option => 
            option.setName('kullanıcı')
                .setDescription('Rol verilecek kullanıcı.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Verilecek rol.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Rolleri Yönet` iznine sahip olmalısın.', ephemeral: true });
        }

        const targetMember = interaction.options.getMember('kullanıcı');
        const roleToGive = interaction.options.getRole('rol');

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }

        // Botun rol hiyerarşisini ve kendi rolünü kontrol et
        if (interaction.guild.members.me.roles.highest.position <= roleToGive.position) {
            return interaction.reply({ content: 'Bu rolü yönetemem çünkü benim rolümden daha yüksek veya aynı seviyede.', ephemeral: true });
        }
        
        // Komutu kullanan kişinin hiyerarşisini kontrol et
        if (interaction.member.roles.highest.position <= roleToGive.position && interaction.guild.ownerId !== interaction.member.id) {
            return interaction.reply({ content: 'Kendi rolünüzden daha yüksek veya aynı seviyedeki bir rolü veremezsiniz.', ephemeral: true });
        }

        try {
            if (targetMember.roles.cache.has(roleToGive.id)) {
                return interaction.reply({ content: `Kullanıcı zaten **${roleToGive.name}** rolüne sahip.`, ephemeral: true });
            }

            await targetMember.roles.add(roleToGive);

            const embed = new EmbedBuilder()
                .setColor(0x57F287) // Yeşil
                .setTitle('Rol Verildi')
                .setDescription(`**${targetMember.user.tag}** adlı kullanıcıya **${roleToGive.name}** rolü başarıyla verildi.`)
                .setThumbnail(targetMember.user.displayAvatarURL())
                .addFields(
                    { name: 'Kullanıcı', value: targetMember.toString(), inline: true },
                    { name: 'Rol', value: roleToGive.toString(), inline: true },
                    { name: 'Moderatör', value: interaction.user.toString(), inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Rol verme sırasında hata:', error);
            await interaction.reply({ content: 'Rol verilirken bir hata oluştu. Lütfen botun yetkilerini ve rol hiyerarşisini kontrol edin.', ephemeral: true });
        }
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logCeza } = require('../utils/loglama.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Atılacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Atma sebebi.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Üyeleri At` iznine sahip olmalısın.', ephemeral: true });
        }

        const hedef = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep');

        const targetMember = await interaction.guild.members.fetch(hedef.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }
        if (hedef.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendini atamazsın.', ephemeral: true });
        }
        if (hedef.id === interaction.client.user.id) {
            return interaction.reply({ content: 'Beni atamazsın.', ephemeral: true });
        }
        if (!targetMember.kickable) {
            return interaction.reply({ content: 'Bu kullanıcıyı atamam. Rolümün altında olabilir veya özel yetkileri olabilir.', ephemeral: true });
        }
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.member.id) {
            return interaction.reply({ content: 'Kendi rolünüzden daha yüksek veya aynı seviyedeki bir üyeyi atamazsınız.', ephemeral: true });
        }

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('Sunucudan Atıldın')
                .setDescription(`**${interaction.guild.name}** adlı sunucudan **${sebep}** sebebiyle atıldınız.`)
                .setTimestamp();
            await hedef.send({ embeds: [dmEmbed] }).catch(() => 
                console.log(`[BİLGİ] ${hedef.tag} kullanıcısının DM'leri kapalı, atılma bildirimi gönderilemedi.`)
            );

            await targetMember.kick(sebep);

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ **${hedef.tag}** adlı kullanıcı **${sebep}** sebebiyle başarıyla atıldı.`);

            await interaction.reply({ embeds: [successEmbed] });

            // CEZA LOGLAMA
            await logCeza(interaction, hedef, 'Kick', sebep);

        } catch (error) {
            console.error('Atma sırasında bir hata oluştu:', error);
            return interaction.reply({ content: 'Kullanıcı atılırken bir hata oluştu. Lütfen yetkilerimi kontrol edin.', ephemeral: true });
        }
    },
};
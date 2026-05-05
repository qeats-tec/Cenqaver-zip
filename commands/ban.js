const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logCeza } = require('../utils/loglama.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan kalıcı olarak yasaklar.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Yasaklanacak kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Yasaklama sebebi.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('mesaj_silme_süresi')
                .setDescription('Son kaç günlük mesajlarının silineceği (0-7).')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Üyeleri Yasakla` iznine sahip olmalısın.', ephemeral: true });
        }

        const hedef = interaction.options.getUser('kullanıcı');
        const sebep = interaction.options.getString('sebep');
        const deleteDays = interaction.options.getInteger('mesaj_silme_süresi') || 0;
        const deleteSeconds = deleteDays * 24 * 60 * 60;

        const targetMember = await interaction.guild.members.fetch(hedef.id).catch(() => null);

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }
        if (hedef.id === interaction.user.id) {
            return interaction.reply({ content: 'Kendini yasaklayamazsın.', ephemeral: true });
        }
        if (hedef.id === interaction.client.user.id) {
            return interaction.reply({ content: 'Beni yasaklayamazsın.', ephemeral: true });
        }
        if (!targetMember.bannable) {
            return interaction.reply({ content: 'Bu kullanıcıyı yasaklayamam. Rolümün altında olabilir veya özel yetkileri olabilir.', ephemeral: true });
        }
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.guild.ownerId !== interaction.member.id) {
            return interaction.reply({ content: 'Kendi rolünüzden daha yüksek veya aynı seviyedeki bir üyeyi yasaklayamazsınız.', ephemeral: true });
        }

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('Sunucudan Yasaklandın')
                .setDescription(`**${interaction.guild.name}** adlı sunucudan **${sebep}** sebebiyle yasaklandınız.`)
                .setTimestamp();
            await hedef.send({ embeds: [dmEmbed] }).catch(() => 
                console.log(`[BİLGİ] ${hedef.tag} kullanıcısının DM'leri kapalı, yasaklama bildirimi gönderilemedi.`)
            );

            await interaction.guild.members.ban(hedef, { reason: sebep, deleteMessageSeconds: deleteSeconds });

            const successEmbed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(`✅ **${hedef.tag}** adlı kullanıcı **${sebep}** sebebiyle başarıyla yasaklandı.`);

            await interaction.reply({ embeds: [successEmbed] });

            // CEZA LOGLAMA
            await logCeza(interaction, hedef, 'Ban', sebep);

        } catch (error) {
            console.error('Yasaklama sırasında bir hata oluştu:', error);
            return interaction.reply({ content: 'Kullanıcı yasaklanırken bir hata oluştu. Lütfen yetkilerimi kontrol edin.', ephemeral: true });
        }
    },
};
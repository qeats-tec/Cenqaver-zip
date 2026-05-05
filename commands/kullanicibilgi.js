const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kullanıcı-bilgi') // Komut adını standartlara uygun hale getir
        .setDescription('Bir kullanıcı hakkında detaylı bilgi verir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Bilgisi görüntülenecek kullanıcı.')
                .setRequired(false)), // Gerekli değil, belirtilmezse komutu kullananın bilgileri gösterilir

    async execute(interaction) {
        await interaction.deferReply(); // Bilgileri toplamak zaman alabilir

        try {
            const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!member) {
                return interaction.editReply({ content: 'Kullanıcı bu sunucuda bulunamadı.' });
            }
            
            const fetchedUser = await targetUser.fetch({ force: true });

            const roles = member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString());
            const rolesString = roles.length > 0 ? roles.join(', ') : 'Hiç rolü yok';

            const presence = member.presence;
            let activityString = 'Şu an bir şey yapmıyor';
            if (presence && presence.activities && presence.activities.length > 0) {
                 const activity = presence.activities[0];
                 if (activity.type === 0) { // Playing
                    activityString = `Oynuyor: **${activity.name}**`;
                 } else if (activity.type === 2) { // Listening
                    activityString = `Dinliyor: **${activity.details}** - ${activity.state}`;
                 } else if (activity.type === 3) { // Watching
                    activityString = `İzliyor: **${activity.name}**`;
                 }
            }

            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor === '#000000' ? 0x5865F2 : member.displayHexColor)
                .setTitle(`Kullanıcı Bilgisi: ${targetUser.tag}`)
                .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 512 }))
                .setImage(fetchedUser.bannerURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Kullanıcı Adı', value: targetUser.username, inline: true },
                    { name: 'ID', value: targetUser.id, inline: true },
                    { name: 'Bot mu?', value: targetUser.bot ? 'Evet' : 'Hayır', inline: true },
                    { name: 'Sunucuya Katılma Tarihi', value: `<t:${parseInt(member.joinedTimestamp / 1000)}:R>`, inline: false },
                    { name: 'Hesap Oluşturma Tarihi', value: `<t:${parseInt(targetUser.createdTimestamp / 1000)}:R>`, inline: false },
                    { name: 'En Yüksek Rol', value: `${member.roles.highest}`, inline: false },
                    { name: `Roller (${roles.length})`, value: rolesString.length > 1024 ? rolesString.substring(0, 1021) + '...' : rolesString, inline: false },
                    { name: 'Aktivite', value: activityString, inline: false },
                    { name: 'Takviye Tarihi', value: member.premiumSince ? `<t:${parseInt(member.premiumSinceTimestamp / 1000)}:R>` : 'Sunucuyu takviye etmiyor', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({dynamic: true}) });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Kullanıcı bilgi komutunda bir hata oluştu:", error);
            await interaction.editReply({ content: 'Kullanıcı bilgileri alınırken bir hata oluştu.' });
        }
    },
};
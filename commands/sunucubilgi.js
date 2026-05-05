const { SlashCommandBuilder, EmbedBuilder, ChannelType, VerificationLevel } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucu-bilgi') // Komut adını standartlara uygun hale getir
        .setDescription('Bu sunucu hakkında detaylı bilgi verir.')
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guild = interaction.guild;
            const owner = await guild.fetchOwner();

            // Kanal sayılarını ayır
            const channels = guild.channels.cache;
            const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
            const categoryChannels = channels.filter(c => c.type === ChannelType.GuildCategory).size;
            
            // Üye sayılarını ayır
            const members = await guild.members.fetch();
            const humanCount = members.filter(member => !member.user.bot).size;
            const botCount = members.filter(member => member.user.bot).size;

            // Doğrulama seviyesi metni
            const verificationLevels = {
                [VerificationLevel.None]: 'Yok',
                [VerificationLevel.Low]: 'Düşük',
                [VerificationLevel.Medium]: 'Orta',
                [VerificationLevel.High]: 'Yüksek',
                [VerificationLevel.VeryHigh]: 'En Yüksek'
            };

            const embed = new EmbedBuilder()
                .setColor(0x5865F2) // Discord Blurple
                .setTitle(`Sunucu Bilgisi: ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
                .setImage(guild.bannerURL({ size: 512 }))
                .addFields(
                    { name: 'Sunucu Sahibi', value: owner.toString(), inline: true },
                    { name: 'Sunucu ID', value: guild.id, inline: true },
                    { name: 'Oluşturulma Tarihi', value: `<t:${parseInt(guild.createdTimestamp / 1000)}:R>`, inline: false },
                    
                    { name: `Üyeler (${guild.memberCount})`, value: `👤 ${humanCount} İnsan | 🤖 ${botCount} Bot`, inline: false },
                    
                    { name: `Kanallar (${channels.size})`, value: `Metin: ${textChannels} | Ses: ${voiceChannels} | Kategori: ${categoryChannels}`, inline: false },

                    { name: 'Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
                    { name: 'Emoji Sayısı', value: `${guild.emojis.cache.size}`, inline: true },
                    
                    { name: 'Takviye Seviyesi', value: `Seviye ${guild.premiumTier || 0}`, inline: true },
                    { name: 'Takviye Sayısı', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
                    { name: 'Doğrulama Seviyesi', value: verificationLevels[guild.verificationLevel], inline: true },
                )
                .setTimestamp()
                .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({dynamic: true}) });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Sunucu bilgi komutunda bir hata oluştu:", error);
            await interaction.editReply({ content: 'Sunucu bilgileri alınırken bir hata oluştu.' });
        }
    },
};
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, '../levels.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lider-tablosu')
        .setDescription('Sunucunun seviye sıralamasını gösterir.'),

    async execute(interaction) {
        await interaction.deferReply();

        let levels = {};
        if (fs.existsSync(levelsPath)) {
            try { 
                levels = JSON.parse(fs.readFileSync(levelsPath, 'utf-8')); 
            } catch (e) {
                console.error('Lider tablosu verileri okunurken hata:', e);
                return interaction.editReply({ content: '❌ Seviye verileri okunurken bir hata oluştu.', ephemeral: true });
            }
        }

        const guildId = interaction.guild.id;
        const guildLevels = levels[guildId];

        if (!guildLevels || Object.keys(guildLevels).length === 0) {
            return interaction.editReply({ content: 'Bu sunucuda henüz kimse seviye kazanmamış.', ephemeral: true });
        }

        // SIRALAMA: Önce seviyeye, sonra XP'ye göre sırala. Bu zaten doğru.
        const sortedUsers = Object.keys(guildLevels)
            .map(userId => ({ 
                id: userId, 
                xp: guildLevels[userId].xp || 0, 
                level: guildLevels[userId].level || 1 
            }))
            .sort((a, b) => {
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return b.xp - a.xp;
            })
            .slice(0, 10); // En iyi 10 kullanıcıyı göster

        if (sortedUsers.length === 0) {
            return interaction.editReply({ content: 'Liderlik tablosu için yeterli veri bulunmuyor.', ephemeral: true });
        }

        // KULLANICI İSİMLERİNİ GÜVENLİ BİR ŞEKİLDE GETİRME
        const leaderboardEntries = await Promise.all(sortedUsers.map(async (user, index) => {
            try {
                // Kullanıcıyı önbellekten veya API'den çek
                const member = await interaction.guild.members.fetch(user.id);
                // Kullanıcı sunucuda bulunduysa ismini kullan
                return `**${index + 1}.** ${member.user.username} - **Seviye ${user.level}** (${user.xp} XP)`;
            } catch (error) {
                // Kullanıcı sunucudan ayrılmışsa, ID'si ile belirt
                return `**${index + 1}.** *Ayrılmış Kullanıcı (${user.id.slice(0, 5)}...)* - **Seviye ${user.level}** (${user.xp} XP)`;
            }
        }));

        const leaderboardEmbed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle(`🏆 ${interaction.guild.name} Liderlik Tablosu`)
            .setDescription(leaderboardEntries.join('\n'))
            .setTimestamp();

        await interaction.editReply({ embeds: [leaderboardEmbed] });
    },
};
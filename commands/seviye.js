const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, '../levels.json');

// GÜNCELLENMİŞ FORMÜL: messageCreate.js ile aynı olmalı
const getXpNeededForLevel = (level) => 10 * (level ** 2) + 100 * level + 200;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seviye')
        .setDescription('Kendi seviyenizi veya bir kullanıcının seviyesini kontrol edin.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Seviyesini görmek istediğiniz kullanıcı.')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;

        if (targetUser.bot) {
            return interaction.editReply({ content: '🤖 Botların seviyesi yoktur.', ephemeral: true });
        }

        let levelsData = {};
        try {
            if (fs.existsSync(levelsPath)) {
                levelsData = JSON.parse(fs.readFileSync(levelsPath, 'utf-8'));
            }
        } catch (error) {
            console.error('Seviye verileri okunurken hata:', error);
            return interaction.editReply({ content: '❌ Seviye verileri okunurken bir hata oluştu.', ephemeral: true });
        }

        const guildId = interaction.guild.id;
        const userId = targetUser.id;
        const guildLevels = levelsData[guildId] || {};
        
        // YENİ YAPI: Doğrudan level ve xp oku
        const userLevelData = guildLevels[userId] || { level: 1, xp: 0 };
        const { level, xp } = userLevelData;

        const xpNeededForNext = getXpNeededForLevel(level);

        // SIRALAMA GÜNCELLEMESİ: Önce seviyeye, sonra XP'ye göre sırala
        const sortedUsers = Object.keys(guildLevels)
            .map(id => ({
                id,
                level: guildLevels[id].level || 1,
                xp: guildLevels[id].xp || 0
            }))
            .sort((a, b) => {
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return b.xp - a.xp;
            });
        
        const rank = sortedUsers.findIndex(u => u.id === userId) + 1;

        const progressRatio = xp / xpNeededForNext;
        const clampedRatio = Math.max(0, Math.min(progressRatio, 1));
        const greenBarCount = Math.floor(clampedRatio * 20);
        const blackBarCount = 20 - greenBarCount;

        const progressBar = '[' + '🟩'.repeat(greenBarCount) + '⬛'.repeat(blackBarCount) + ']';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({ name: `${targetUser.username} Seviye Bilgileri`, iconURL: targetUser.displayAvatarURL() })
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Seviye', value: `**${level}**`, inline: true },
                { name: 'XP', value: `**${xp} / ${xpNeededForNext}**`, inline: true },
                { name: 'Sıralama', value: `**#${rank || 'N/A'}**`, inline: true },
                { name: 'İlerleme', value: `${progressBar}\n*Sonraki seviye için **${xpNeededForNext - xp}** XP daha kazanmalısın.*` }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
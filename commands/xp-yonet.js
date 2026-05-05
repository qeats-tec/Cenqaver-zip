const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, '../levels.json');

const readLevels = () => {
    if (fs.existsSync(levelsPath)) {
        try { return JSON.parse(fs.readFileSync(levelsPath, 'utf-8')); } catch { return {}; }
    }
    return {};
};

const writeLevels = (data) => {
    fs.writeFileSync(levelsPath, JSON.stringify(data, null, 2));
};

const calculateXpForLevel = (level) => 2 * (level * level) + (25 * level) + 75;

const getLevelFromXp = (xp) => {
    let level = 1;
    while (xp >= calculateXpForLevel(level)) {
        xp -= calculateXpForLevel(level);
        level++;
         if (level > 200) return 200; // Maksimum seviye sınırı
    }
    return level;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-yonet')
        .setDescription('Bir kullanıcının XP ve seviye verilerini yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Bir kullanıcıya XP ekler.')
                .addUserOption(option => option.setName('kullanici').setDescription('XP eklenecek kullanıcı.').setRequired(true))
                .addIntegerOption(option => option.setName('miktar').setDescription('Eklenecek XP miktarı.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('cikar')
                .setDescription('Bir kullanıcıdan XP çıkarır.')
                .addUserOption(option => option.setName('kullanici').setDescription('XP çıkarılacak kullanıcı.').setRequired(true))
                .addIntegerOption(option => option.setName('miktar').setDescription('Çıkarılacak XP miktarı.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('sifirla')
                .setDescription('Bir kullanıcının tüm seviye ve XP verilerini sıfırlar.')
                .addUserOption(option => option.setName('kullanici').setDescription('Verileri sıfırlanacak kullanıcı.').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('kullanici');
        const amount = interaction.options.getInteger('miktar');
        const guildId = interaction.guild.id;

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ Botlara XP ekleyip çıkaramazsınız.', ephemeral: true });
        }

        const levels = readLevels();

        if (!levels[guildId]) levels[guildId] = {};
        if (!levels[guildId][targetUser.id]) levels[guildId][targetUser.id] = { xp: 0, level: 1, totalXp: 0 };

        const userLevelData = levels[guildId][targetUser.id];
        const oldLevel = userLevelData.level;

        // Toplam XP'yi yönetmek daha doğru sonuçlar verir
        if (!userLevelData.totalXp) {
            userLevelData.totalXp = userLevelData.xp; // Eski sistemden geçiş için
        }

        switch (subcommand) {
            case 'ekle': {
                userLevelData.totalXp += amount;
                const newLevel = getLevelFromXp(userLevelData.totalXp);
                userLevelData.level = newLevel;
                
                // Mevcut seviyenin XP'sini de güncelleyelim
                const xpForCurrentLevel = calculateXpForLevel(newLevel -1 );
                userLevelData.xp = userLevelData.totalXp - xpForCurrentLevel;

                writeLevels(levels);
                
                let replyMessage = `✅ **${targetUser.username}** adlı kullanıcıya **${amount}** XP eklendi. Yeni Toplam XP: **${userLevelData.totalXp}**.`;
                if (newLevel > oldLevel) {
                    replyMessage += `\n🎉 Kullanıcı **${newLevel}. seviyeye** yükseldi!`;
                }
                await interaction.reply({ content: replyMessage, ephemeral: true });
                break;
            }
            case 'cikar': {
                userLevelData.totalXp = Math.max(0, userLevelData.totalXp - amount);
                const newLevel = getLevelFromXp(userLevelData.totalXp);
                userLevelData.level = newLevel;

                 // Mevcut seviyenin XP'sini de güncelleyelim
                const xpForCurrentLevel = calculateXpForLevel(newLevel - 1);
                userLevelData.xp = userLevelData.totalXp - xpForCurrentLevel;

                writeLevels(levels);

                let replyMessage = `✅ **${targetUser.username}** adlı kullanıcıdan **${amount}** XP çıkarıldı. Yeni Toplam XP: **${userLevelData.totalXp}**.`;
                 if (newLevel < oldLevel) {
                    replyMessage += `\n📉 Kullanıcı **${newLevel}. seviyeye** düştü.`;
                }
                await interaction.reply({ content: replyMessage, ephemeral: true });
                break;
            }
            case 'sifirla': {
                userLevelData.xp = 0;
                userLevelData.totalXp = 0;
                userLevelData.level = 1;
                writeLevels(levels);
                await interaction.reply({ content: `✅ **${targetUser.username}** adlı kullanıcının seviye ve XP verileri başarıyla sıfırlandı.`, ephemeral: true });
                break;
            }
        }
    },
};
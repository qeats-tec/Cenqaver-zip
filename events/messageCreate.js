const { Events, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const levelsPath = path.join(__dirname, '..', 'levels.json');
const levelSettingsPath = path.join(__dirname, '..', 'level-ayarlar.json');
const levelRewardsPath = path.join(__dirname, '..', 'level-oduller.json');
const tekKelimeSettingsPath = path.join(__dirname, '..', 'tek-kelime-ayarlar.json');
const afkFilePath = path.join(__dirname, '..', 'afk.json'); // AFK dosyası yolu eklendi

const userCooldowns = new Collection();

const readJSON = (filePath) => {
    if (!fs.existsSync(filePath)) return {};
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return {};
    }
};

const writeJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// AFK verisini okuma fonksiyonu (commands/afk-ol.js dosyasından kopyalandı)
const readAfkData = () => {
    if (!fs.existsSync(afkFilePath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(afkFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('afk.json okunurken hata oluştu:', error);
        return {};
    }
};

// AFK verisini yazma fonksiyonu (commands/afk-ol.js dosyasından kopyalandı)
const writeAfkData = (data) => {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
};

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (!message.guild || message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;
        const channelId = message.channel.id;

        const afkData = readAfkData();

        // --- AFK ÇIKIŞ KONTROLÜ ---
        if (afkData[guildId] && afkData[guildId][userId]) {
            const { nickname: originalNickname } = afkData[guildId][userId];
            delete afkData[guildId][userId];
            writeAfkData(afkData);

            try {
                // Takma adını orijinal haline geri döndürme
                if (message.member.manageable && message.member.nickname !== originalNickname) {
                    await message.member.setNickname(originalNickname).catch(err => console.error("AFK çıkışında takma ad sıfırlanamadı:", err));
                }
                message.reply(`Hoş geldin ${message.author}! Artık AFK değilsin.`).catch(() => {});
            } catch (error) {
                console.error("AFK çıkışında bir hata oluştu:", error);
                message.reply(`Hoş geldin ${message.author}! AFK durumundan çıktın ama takma adın sıfırlanamadı.`).catch(() => {});
            }
        }

        // --- AFK KİŞİ ETİKETLEME KONTROLÜ ---
        if (message.mentions.users.size > 0) {
            message.mentions.users.forEach(async (mentionedUser) => {
                if (afkData[guildId] && afkData[guildId][mentionedUser.id]) {
                    const afkInfo = afkData[guildId][mentionedUser.id];
                    const timeAfk = Math.floor((Date.now() - afkInfo.timestamp) / (1000 * 60)); // Dakika cinsinden
                    const afkReason = afkInfo.reason;

                    let replyMessage = `\`${mentionedUser.username}\` şu anda AFK.`;
                    if (afkReason) replyMessage += ` Sebep: \`${afkReason}\``;
                    if (timeAfk > 0) replyMessage += ` (AFK olduğu süre: ${timeAfk} dakika)`;

                    message.reply(replyMessage).catch(() => {});
                }
            });
        }

        // --- TEK-KELİME ---
        const tekKelimeSettings = readJSON(tekKelimeSettingsPath);
        const allowedWord = tekKelimeSettings[channelId];
        if (allowedWord) {
            if (message.author.bot && message.author.id !== client.user.id) {
                await message.delete().catch(() => {});
                return;
            }
            if (!message.author.bot && message.content !== allowedWord) {
                await message.delete().catch(() => {});
                return;
            }
        }

        // --- AI (OPENROUTER) ---
        if (message.mentions.has(client.user)) {
            const prompt = message.content.replace(/<@!?\d+>/g, '').trim();
            if (!prompt) return;

            try {
                await message.channel.sendTyping();
                
                const personality = "Sen Cenqaver'sin; havalı pc başında olan genç ve dc de moderetör olan özellikle de kısaltmaları bilen ve anlayabilen bir chat botsun görevin sana karşı gelen kişiyi kırmamak sohbet etmek ve yardım lazımsa yardım etmek";
                
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: 'google/gemma-3-12b-it:free',
                        messages: [
                            { role: 'user', content: `${personality}\n\nSoru: ${prompt}` }
                        ],
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const reply = response.data.choices[0].message.content;
                message.reply(reply || "Kralın söyleyecek sözü yok şu an.").catch(() => {});
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    message.reply("Kralın bugünlük enerjisi bitti (Günlük limit doldu). Yarın gel.").catch(() => {});
                } else {
                    console.error('OpenRouter Hatası:', error.message);
                    message.reply('Sistemde bir arıza var, kral şu an meşgul.').catch(() => {});
                }
            }
            return;
        }

        // --- SEVİYE SİSTEMİ ---
        const settings = readJSON(levelSettingsPath);
        const guildSettings = settings[guildId];
        if (!guildSettings || !guildSettings.enabled) return;

        const now = Date.now();
        const userKey = `${guildId}-${userId}`;
        if (userCooldowns.has(userKey) && now < userCooldowns.get(userKey) + 60000) return;

        const levels = readJSON(levelsPath);
        if (!levels[guildId]) levels[guildId] = {};
        if (!levels[guildId][userId]) levels[guildId][userId] = { xp: 0, level: 1 };

        const userLevelData = levels[guildId][userId];
        userLevelData.xp += Math.floor(Math.random() * 11) + 5;
        userCooldowns.set(userKey, now);

        const getRequiredXp = (level) => 10 * (level ** 2) + 100 * level + 200;
        let requiredXp = getRequiredXp(userLevelData.level);

        if (userLevelData.xp >= requiredXp) {
            userLevelData.level++;
            userLevelData.xp = 0;
            const targetChannel = message.guild.channels.cache.get(guildSettings.notificationChannel) || message.channel;
            targetChannel.send(`🎉 Tebrikler ${message.author}! **Seviye ${userLevelData.level}** oldun!`).catch(() => {});
        }
        writeJSON(levelsPath, levels);
    },
};

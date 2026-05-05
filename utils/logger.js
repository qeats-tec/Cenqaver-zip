const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const logConfigPath = path.join(__dirname, '..', 'log-config.json');

let logConfig = {};

// Başlangıçta ve dosya değiştikçe yapılandırmayı yükle
function loadLogConfig() {
    try {
        if (fs.existsSync(logConfigPath)) {
            const data = fs.readFileSync(logConfigPath, 'utf-8');
            logConfig = JSON.parse(data);
        } else {
            logConfig = {};
        }
    } catch (error) {
        console.error('[Logger] log-config.json okunurken hata:', error);
        logConfig = {};
    }
}

// Dosyayı izleyerek değişiklikleri anında yansıt (isteğe bağlı ama iyi bir pratik)
fs.watchFile(logConfigPath, { persistent: false }, () => {
    console.log('[Logger] log-config.json değişti, yeniden yükleniyor...');
    loadLogConfig();
});

// İlk yüklemeyi yap
loadLogConfig();

/**
 * Belirtilen log türü için kanala bir embed mesajı gönderir.
 * @param {import('discord.js').Guild} guild - Logun gönderileceği sunucu.
 * @param {'message' | 'punishment' | 'ticket'} logType - Logun türü.
 * @param {EmbedBuilder} embed - Gönderilecek embed mesajı.
 * @returns {Promise<void>}
 */
async function log(guild, logType, embed) {
    if (!guild) return;

    const guildConfig = logConfig[guild.id];
    if (!guildConfig || !guildConfig.setupComplete) {
        // Sunucu için log sistemi kurulmamış.
        return;
    }

    let channelId;
    switch (logType) {
        case 'message':
            channelId = guildConfig.messageLogId;
            break;
        case 'punishment':
            channelId = guildConfig.punishmentLogId;
            break;
        case 'ticket':
            channelId = guildConfig.ticketLogId;
            break;
        default:
            return;
    }

    if (!channelId) return;

    try {
        const channel = await guild.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        // Kanal bulunamadı veya bota erişim izni verilmedi.
        // console.error(`[Logger] Log gönderilirken hata (Sunucu: ${guild.name}, Kanal ID: ${channelId}):`, error.message);
    }
}

module.exports = { log };

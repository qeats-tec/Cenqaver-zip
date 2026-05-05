const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../hosgeldin-ayarlar.json');

// Ayarları okumak için yardımcı fonksiyon (sağlamlaştırılmış)
const readSettings = () => {
    if (!fs.existsSync(settingsPath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(settingsPath, 'utf-8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error(`[HATA] hosgeldin-ayarlar.json dosyası okunurken veya parse edilirken bir hata oluştu:`, error);
        return {}; // Bozuk JSON durumunda boş nesne dön
    }
};

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const settings = readSettings();
        const guildSettings = settings[member.guild.id];

        // Sunucu için ayrılma kanalı ayarlanmamışsa devam etme
        if (!guildSettings || !guildSettings.goodbyeChannelId) {
            return;
        }

        const goodbyeChannel = member.guild.channels.cache.get(guildSettings.goodbyeChannelId);
        if (!goodbyeChannel) {
            console.warn(`[UYARI] Ayrılma kanalı (ID: ${guildSettings.goodbyeChannelId}) ${member.guild.name} sunucusunda bulunamadı.`);
            return;
        }

        // Botun kanalda mesaj gönderme izni olup olmadığını kontrol et
        if (!goodbyeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
            console.warn(`[UYARI] ${goodbyeChannel.name} kanalında mesaj gönderme iznim yok. (Sunucu: ${member.guild.name})`);
            return;
        }

        // Varsayılan mesajı ayarla ve değişkenleri doldur
        const goodbyeMessage = (guildSettings.goodbyeMessage || `**{user}** aramızdan ayrıldı...`)
            .replace('{user}', member.user.username);

        try {
            await goodbyeChannel.send(goodbyeMessage);
        } catch (error) {
            console.error(`[HATA] ${member.guild.name} sunucusundaki ayrılma mesajı gönderilemedi:`, error);
        }
    },
};
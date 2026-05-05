const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Veri dosyasının yolu
const welcomeSettingsPath = path.join(__dirname, '..', 'hosgeldin-ayarlar.json');

// Ayarları okumak için yardımcı fonksiyon (Diğer dosyalardaki ile aynı, sağlamlaştırılmış versiyon)
const readSettings = () => {
    if (!fs.existsSync(welcomeSettingsPath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(welcomeSettingsPath, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[HATA] hosgeldin-ayarlar.json dosyası okunurken bir hata oluştu:', error);
        return {};
    }
};

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const settings = readSettings();
        const guildSettings = settings[member.guild.id];

        // Sunucu için hoş geldin ayarları yoksa veya kanal belirtilmemişse devam etme
        if (!guildSettings || !guildSettings.welcomeChannelId) {
            return;
        }

        // Ayarlanan kanalı bulmaya çalış
        const welcomeChannel = member.guild.channels.cache.get(guildSettings.welcomeChannelId);
        if (!welcomeChannel) {
            console.warn(`[UYARI] Hoş geldin kanalı (ID: ${guildSettings.welcomeChannelId}) ${member.guild.name} sunucusunda bulunamadı.`);
            return;
        }

        // Mesaj ayarlanmamışsa varsayılan bir mesaj kullan
        const welcomeMessage = guildSettings.welcomeMessage || 'Aramıza hoş geldin, {user}!';

        // Değişkenleri doldur ({user} ve {server})
        const finalMessage = welcomeMessage
            .replace('{user}', member.user.toString())
            .replace('{server}', member.guild.name);

        try {
            // Bota kanalda konuşma izni olup olmadığını kontrol et
            if (!welcomeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
                console.warn(`[UYARI] ${welcomeChannel.name} kanalında mesaj gönderme iznim yok. (Sunucu: ${member.guild.name})`);
                return;
            }
            
            // Mesajı gönder
            await welcomeChannel.send(finalMessage);
        } catch (error) {
            console.error('[HATA] Hoş geldin mesajı gönderilemedi:', error);
        }
    },
};
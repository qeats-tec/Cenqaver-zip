
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');
const { token } = require('./config.json'); // config.json dosyasından token'ı alıyoruz

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ]
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

client.once('ready', async () => {
    console.log(`Kurtarma botu olarak ${client.user.tag} adıyla giriş yapıldı!`);

    const backupFilePath = path.join(__dirname, 'sunucu-yedek.json');
    if (!fs.existsSync(backupFilePath)) {
        console.error('HATA: sunucu-yedek.json dosyası bulunamadı! İşlem iptal edildi.');
        client.destroy();
        return;
    }

    const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    const guild = client.guilds.cache.get(backup.guildId);

    if (!guild) {
        console.error(`HATA: Bot, ${backup.guildId} ID'li sunucuda bulunmuyor. Lütfen botu sunucuya ekleyin. İşlem iptal edildi.`);
        client.destroy();
        return;
    }

    console.log(`Sunucu bulundu: ${guild.name}. Kurtarma işlemi başlıyor...`);

    try {
        // ---- YETKİ KONTROLÜ ----
        const botMember = await guild.members.fetch(client.user.id);
        const botHighestRolePosition = botMember.roles.highest.position;
        const undeletableRoles = guild.roles.cache.filter(role => !role.managed && role.position >= botHighestRolePosition);

        if (undeletableRoles.size > 0) {
            console.error(`❌ KRİTİK HATA: Botun rolü, aşağıdaki rolleri silmek için yeterli yetkiye sahip değil: ${undeletableRoles.map(r => r.name).join(', ')}.`);
            console.error('Lütfen botun rolünü Discord sunucu ayarlarında en üste taşıyın ve betiği yeniden çalıştırın. İşlem iptal edildi.');
            client.destroy();
            return;
        }
        console.log('✅ Yetki kontrolü başarılı.');

        // ---- SİLME İŞLEMİ ----
        console.log('🔄 Mevcut kanallar siliniyor...');
        for (const channel of guild.channels.cache.values()) {
            try {
                await channel.delete('Sunucu Kurtarma Operasyonu');
                await delay(400);
            } catch (error) {
                console.warn(`Uyarı: Kanal silinemedi (muhtemelen korumalı): ${channel.name}. Devam ediliyor.`);
            }
        }
        console.log('🔄 Mevcut roller siliniyor...');
        for (const role of guild.roles.cache.values()) {
            if (!role.managed && role.name !== '@everyone' && role.position < botHighestRolePosition) {
                try {
                    await role.delete('Sunucu Kurtarma Operasyonu');
                    await delay(400);
                } catch (error) {
                    console.warn(`Uyarı: Rol silinemedi: ${role.name}. Devam ediliyor.`);
                }
            }
        }
        console.log('✅ Eski yapı başarıyla temizlendi.');
        
        // ---- OLUŞTURMA İŞLEMİ ----
        const roleIdMap = new Map();
        console.log('🔄 Roller yedekten oluşturuluyor...');
        for (const roleData of backup.roles.sort((a,b) => b.position - a.position)) {
            try {
                const newRole = await guild.roles.create({ name: roleData.name, color: roleData.color, hoist: roleData.hoist, permissions: BigInt(roleData.permissions), mentionable: roleData.mentionable, reason: 'Kurtarma' });
                roleIdMap.set(roleData.id, newRole.id);
                await delay(400);
            } catch (error) { console.error(`Hata: Rol oluşturulamadı: ${roleData.name}. Sebep: ${error.message}`); }
        }

        const categoryIdMap = new Map();
        console.log('🔄 Kategoriler ve kanallar oluşturuluyor...');
        for (const categoryData of backup.categories) {
            try {
                const newCategory = await guild.channels.create({ name: categoryData.name, type: ChannelType.GuildCategory, permissionOverwrites: categoryData.permissionOverwrites.map(p => ({ id: p.type === 'role' ? roleIdMap.get(p.id) : p.id, allow: BigInt(p.allow), deny: BigInt(p.deny) })).filter(p => p.id) });
                categoryIdMap.set(categoryData.id, newCategory.id);
                await delay(400);
            } catch (error) { console.error(`Hata: Kategori oluşturulamadı: ${categoryData.name}. Sebep: ${error.message}`); }
        }

        for (const channelData of backup.channels) {
            try {
                const parentId = channelData.parentId ? categoryIdMap.get(channelData.parentId) : null;
                await guild.channels.create({ name: channelData.name, type: channelData.type, parent: parentId, topic: channelData.topic, nsfw: channelData.nsfw, rateLimitPerUser: channelData.rateLimitPerUser, bitrate: channelData.bitrate, userLimit: channelData.userLimit, permissionOverwrites: channelData.permissionOverwrites.map(p => ({ id: p.type === 'role' ? roleIdMap.get(p.id) : p.id, allow: BigInt(p.allow), deny: BigInt(p.deny) })).filter(p => p.id) });
                await delay(400);
            } catch (error) { console.error(`Hata: Kanal oluşturulamadı: ${channelData.name}. Sebep: ${error.message}`); }
        }

        console.log('✅ BAŞARILI! Sunucu kurtarma işlemi tamamlandı.');

    } catch (error) {
        console.error('--- KRİTİK KURTARMA HATASI ---', error);
        console.error('İşlem sırasında beklenmedik bir hata oluştu. Sunucu tutarsız bir durumda olabilir.');
    } finally {
        console.log('İşlem bitti. Bot bağlantısı kesiliyor.');
        client.destroy();
    }
});

client.login(token);

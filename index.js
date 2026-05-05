// .env dosyasındaki değişkenleri yükler
require('dotenv').config();

// --- KRİTİK API ANAHTARI KONTROLÜ ---
if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('[KRİTİK HATA] OPENROUTER_API_KEY bulunamadı veya değiştirilmemiş! Lütfen .env dosyanızı kontrol edin.');
}

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
const { token } = require('./config.json');
const express = require('express');

// Yeni Client (Bot) örneği oluşturuluyor
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const tekKelimeAyarlarPath = path.join(__dirname, 'tek-kelime-ayarlar.json');
const statusConfigPath = path.join(__dirname, 'status-config.json');

// --- BOT İÇİ KOLEKSİYONLAR ---
client.commands = new Collection();

// --- KOMUT YÜKLEYİCİ ---
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[UYARI] ${filePath} dosyasındaki komut, gerekli "data" veya "execute" özelliğini eksik.`);
	}
}

// --- OLAY YÜKLEYİCİ (HATA YAKALAMALI) ---
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    const eventWrapper = async (...args) => {
        try {
            await event.execute(...args, client);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] OLAY YÜRÜTME HATASI (${event.name}):`, error);
        }
    };

    if (event.once) {
        client.once(event.name, eventWrapper);
    } else {
        client.on(event.name, eventWrapper);
    }
}

// --- DURUM GÜNCELLEME FONKSİYONU ---
async function updateStatusChannels() {
    try {
        if (!fs.existsSync(statusConfigPath)) return;
        const data = fs.readFileSync(statusConfigPath, 'utf8');
        if (!data) return;
        const config = JSON.parse(data);

        for (const guildId in config) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) continue;
            const { channelId, format } = config[guildId];
            if (!channelId || !format) continue;
            const channel = guild.channels.cache.get(channelId);
            if (channel && channel.type === 2) {
                const memberCount = guild.memberCount;
                const botUsername = client.user.username;
                const channelName = format.replace('{user}', botUsername).replace('{members}', memberCount);
                await channel.setName(channelName);
            }
        }
    } catch (error) {
        console.error('[DURUM GÜNCELLEME] Hata:', error);
    }
}

// --- TEK KELİME KANALINI AÇMA FONKSİYONU ---
async function openTekKelimeChannels() {
    try {
        if (fs.existsSync(tekKelimeAyarlarPath)) {
            const tekKelimeAyarlar = JSON.parse(fs.readFileSync(tekKelimeAyarlarPath, 'utf-8'));
            for (const sunucuId in tekKelimeAyarlar) {
                const kanalId = tekKelimeAyarlar[sunucuId];
                const sunucu = client.guilds.cache.get(sunucuId);
                if (sunucu) {
                    const kanal = sunucu.channels.cache.get(kanalId);
                    if (kanal) {
                        // Kanalda everyone için SendMessages iznini aç
                        await kanal.permissionOverwrites.edit(sunucu.roles.everyone, { SendMessages: true });
                        console.log(`[Tek Kelime] ${sunucu.name} sunucusundaki ${kanal.name} kanalı başlangıçta açıldı.`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Tek Kelime Başlangıç Hatası] Kanallar açılamadı:', error);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    
    // Durum kanallarını güncelle
    setInterval(updateStatusChannels, 600000); 
    updateStatusChannels();

    // Bot başladığında tek kelime kanallarını aç
    await openTekKelimeChannels();
});

process.on('SIGINT', async () => {
    console.log('Bot kapatılıyor...');
    client.destroy();
    process.exit();
});

client.login(token);

// --- WEB SUNUCUSU (HOSTİNG İÇİN) ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot Aktif!');
});

app.listen(port, () => {
  console.log(`[WEB] Sunucu ${port} portunda başlatıldı.`);
});
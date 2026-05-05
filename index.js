require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');

// Sadece Replit'ten okuyoruz
const token = process.env.token || process.env.DISCORD_TOKEN;

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

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	}
}

// Olayları (Events) Yükle
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    const eventWrapper = async (...args) => {
        try { await event.execute(...args, client); } catch (error) { console.error(error); }
    };
    if (event.once) client.once(event.name, eventWrapper);
    else client.on(event.name, eventWrapper);
}

client.once(Events.ClientReady, async () => {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
});

if (token) {
    client.login(token);
} else {
    console.error('❌ HATA: Token bulunamadı! Replit Secrets kısmını kontrol edin.');
}

// Web Sunucusu (Hosting için)
const app = express();
app.get('/', (req, res) => res.send('Bot Aktif!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web sunucusu hazır.'));

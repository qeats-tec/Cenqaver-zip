const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Replit Secrets/Config üzerinden bilgileri alıyoruz
const token = process.env.token || process.env.DISCORD_TOKEN;
const clientId = process.env.clientid || process.env.CLIENT_ID;
const guildId = process.env.guildid || process.env.GUILD_ID;

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

if (!token || !clientId || !guildId) {
    console.error('[HATA] Eksik bilgi! Lütfen token, clientid ve guildid değerlerini Replit Secrets kısmına ekleyin.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`Komutlar yükleniyor... (${commands.length} adet)`);
        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );
        console.log('Komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error(error);
    }
})();

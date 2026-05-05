const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../hosgeldin-ayarlar.json');

const readSettings = () => {
    if (fs.existsSync(settingsPath)) {
        try { return JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); } catch { return {}; }
    }
    return {};
};

const writeSettings = (data) => {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 4));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayrilma-mesaji')
        .setDescription('Sunucudan bir üye ayrıldığında gösterilecek mesajı ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Mesaj içeriği. Kullanıcı adını eklemek için {user} kullanın. (Sıfırlamak için boş bırakın).')
                .setRequired(false)
        ),
    async execute(interaction) {
        const message = interaction.options.getString('mesaj');
        const settings = readSettings();
        const guildId = interaction.guild.id;

        if (!settings[guildId]) {
            settings[guildId] = {};
        }

        if (message) {
            settings[guildId].goodbyeMessage = message;
            writeSettings(settings);
            await interaction.reply({ content: `Ayrılma mesajı başarıyla ayarlandı: **"${message}"**`, ephemeral: true });
        } else {
            if (settings[guildId] && settings[guildId].goodbyeMessage) {
                delete settings[guildId].goodbyeMessage;
                writeSettings(settings);
                await interaction.reply({ content: `Ayrılma mesajı başarıyla varsayılan mesaja döndürüldü.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Zaten özel bir ayrılma mesajı ayarlanmamış.`, ephemeral: true });
            }
        }
    },
};

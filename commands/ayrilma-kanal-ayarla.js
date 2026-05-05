const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
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
        .setName('ayrilma-kanal-ayarla')
        .setDescription('Ayrılma mesajlarının gönderileceği kanalı ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Ayrılma mesajı kanalı (Sıfırlamak için boş bırakın).')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('kanal');
        const settings = readSettings();
        const guildId = interaction.guild.id;

        if (!settings[guildId]) {
            settings[guildId] = {};
        }

        if (channel) {
            settings[guildId].goodbyeChannelId = channel.id;
            writeSettings(settings);
            await interaction.reply({ content: `Ayrılma mesajı kanalı başarıyla <#${channel.id}> olarak ayarlandı.`, ephemeral: true });
        } else {
            if (settings[guildId] && settings[guildId].goodbyeChannelId) {
                delete settings[guildId].goodbyeChannelId;
                writeSettings(settings);
                await interaction.reply({ content: `Ayrılma mesajı kanalı başarıyla sıfırlandı.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Zaten ayarlı bir ayrılma mesajı kanalı yok.`, ephemeral: true });
            }
        }
    },
};

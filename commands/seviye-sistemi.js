const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelSettingsPath = path.join(__dirname, '../level-ayarlar.json');

const readSettings = () => {
    if (fs.existsSync(levelSettingsPath)) {
        try { return JSON.parse(fs.readFileSync(levelSettingsPath, 'utf-8')); } catch { return {}; }
    }
    return {};
};

const writeSettings = (data) => {
    fs.writeFileSync(levelSettingsPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seviye-sistemi')
        .setDescription('Sunucudaki seviye sistemini açar veya kapatır.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('aç')
                .setDescription('Seviye sistemini aktif eder.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kapat')
                .setDescription('Seviye sistemini devre dışı bırakır.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const settings = readSettings();

        if (!settings[guildId]) {
            settings[guildId] = { enabled: true, notificationChannel: null, levelUpMessage: '🎉 Tebrikler, {user}! **Seviye {level}** oldun!' };
        }

        if (subcommand === 'aç') {
            if (settings[guildId].enabled) {
                return interaction.reply({ content: '✅ Seviye sistemi zaten aktif.', ephemeral: true });
            }
            settings[guildId].enabled = true;
            writeSettings(settings);
            await interaction.reply({ content: '✅ Seviye sistemi başarıyla **açıldı**.', ephemeral: true });
        } else if (subcommand === 'kapat') {
            if (!settings[guildId].enabled) {
                return interaction.reply({ content: '❌ Seviye sistemi zaten devre dışı.', ephemeral: true });
            }
            settings[guildId].enabled = false;
            writeSettings(settings);
            await interaction.reply({ content: '✅ Seviye sistemi başarıyla **kapatıldı**.', ephemeral: true });
        }
    },
};
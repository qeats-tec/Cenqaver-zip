const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, '../levels.json');

const readLevels = () => {
    if (!fs.existsSync(levelsPath)) return {};
    try { return JSON.parse(fs.readFileSync(levelsPath, 'utf-8')); } catch { return {}; }
};

const writeLevels = (data) => {
    fs.writeFileSync(levelsPath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-sıfırla')
        .setDescription('Sunucudaki tüm kullanıcıların seviye ve XP verilerini sıfırlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const levels = readLevels();

        if (!levels[guildId] || Object.keys(levels[guildId]).length === 0) {
            return interaction.reply({ content: '❌ Sunucuda sıfırlanacak seviye verisi bulunmuyor.', ephemeral: true });
        }

        delete levels[guildId];
        writeLevels(levels);

        await interaction.reply({ content: '✅ Sunucudaki tüm seviye ve XP verileri başarıyla sıfırlandı.', ephemeral: true });
    },
};
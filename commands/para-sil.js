const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');

// Helper function to read economy data
function getEconomy() {
    if (fs.existsSync(economyPath)) {
        return JSON.parse(fs.readFileSync(economyPath, 'utf-8'));
    }
    return {};
}

// Helper function to write economy data
function saveEconomy(economy) {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-sil')
        .setDescription('Bir kullanıcının bakiyesinden para siler. (Yönetici Yetkisi Gerekir)')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Parası silinecek kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek para miktarı.')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const kullanici = interaction.options.getUser('kullanici');
        const miktar = interaction.options.getInteger('miktar');
        const guildId = interaction.guild.id;

        const economy = getEconomy();

        if (!economy[guildId] || !economy[guildId][kullanici.id] || economy[guildId][kullanici.id].balance < miktar) {
            return interaction.reply({ content: `❌ <@${kullanici.id}> kullanıcısının bakiyesi yetersiz veya kullanıcı hiç para kazanmamış.`, ephemeral: true });
        }

        economy[guildId][kullanici.id].balance -= miktar;
        saveEconomy(economy);

        return interaction.reply({ content: `✅ <@${kullanici.id}> kullanıcısının bakiyesinden **${miktar}** para silindi. Yeni bakiye: **${economy[guildId][kullanici.id].balance}**` });
    }
};

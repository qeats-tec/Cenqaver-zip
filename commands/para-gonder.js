const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');

// Helper functions
function getEconomy() {
    if (fs.existsSync(economyPath)) {
        return JSON.parse(fs.readFileSync(economyPath, 'utf-8'));
    }
    return {};
}

function saveEconomy(economy) {
    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('para-gonder')
        .setDescription('Başka bir kullanıcıya para gönderir.')
        .addUserOption(option =>
            option.setName('alici')
                .setDescription('Para gönderilecek kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Gönderilecek para miktarı.')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const sender = interaction.user;
        const recipient = interaction.options.getUser('alici');
        const amount = interaction.options.getInteger('miktar');
        const guildId = interaction.guild.id;

        if (recipient.bot || recipient.id === sender.id) {
            return interaction.reply({ content: '❌ Kendine veya bir bota para gönderemezsin.', ephemeral: true });
        }

        const economy = getEconomy();

        // Initialize data if not present
        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][sender.id] || economy[guildId][sender.id].balance < amount) {
            return interaction.reply({ content: `❌ Yetersiz bakiye! Cüzdanında **${amount}** kadar para yok.`, ephemeral: true });
        }
        if (!economy[guildId][recipient.id]) {
            economy[guildId][recipient.id] = { balance: 0, bank: 0 };
        }

        // Perform the transaction
        economy[guildId][sender.id].balance -= amount;
        economy[guildId][recipient.id].balance += amount;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('💸 Para Transferi Başarılı')
            .setDescription(`**<@${recipient.id}>** adlı kullanıcıya **${amount}** para gönderdin.`)
            .addFields(
                { name: 'Senin Yeni Bakiyen', value: `**${economy[guildId][sender.id].balance}**` },
                { name: `Alıcının Yeni Bakiyesi`, value: `**${economy[guildId][recipient.id].balance}**` }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

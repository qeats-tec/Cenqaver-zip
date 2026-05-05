const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');
const DAILY_AMOUNT = 250; // Amount to be given daily
const COOLDOWN = 22 * 60 * 60 * 1000; // 22 hours in milliseconds

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
        .setName('gunluk')
        .setDescription('Günlük para ödülünüzü alın.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const economy = getEconomy();

        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][userId]) {
            economy[guildId][userId] = { balance: 0, bank: 0, lastDaily: 0 };
        }

        const userData = economy[guildId][userId];
        const lastDaily = userData.lastDaily || 0;
        const timeLeft = COOLDOWN - (Date.now() - lastDaily);

        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return interaction.reply({ content: `Günlük ödülünü zaten aldın! Tekrar almak için **${hours} saat ${minutes} dakika** beklemelisin.` });
        }

        // Update balance and timestamp
        userData.balance += DAILY_AMOUNT;
        userData.lastDaily = Date.now();
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🎉 Günlük Ödül!')
            .setDescription(`Günlük ödülün olan **${DAILY_AMOUNT}** parayı aldın!`)
            .addFields({ name: 'Yeni Cüzdan Bakiyen', value: `**${userData.balance}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

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

const WIN_CHANCE = 0.4; // 40% chance to win
const WIN_MULTIPLIER = 2.5; // Win 2.5x the bet amount

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kumar')
        .setDescription('Para ile kumar oynayın. Kazanma şansı %40!')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz para miktarı.')
                .setRequired(true)
                .setMinValue(10)), // Minimum bet

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const betAmount = interaction.options.getInteger('miktar');

        const economy = getEconomy();

        if (!economy[guildId]?.[userId] || economy[guildId][userId].balance < betAmount) {
            const userBalance = economy[guildId]?.[userId]?.balance || 0;
            return interaction.reply({ content: `❌ Yetersiz bakiye! Kumar oynamak için **${betAmount}** paraya ihtiyacın var. Senin bakiyen: **${userBalance}**`, ephemeral: true });
        }

        const userData = economy[guildId][userId];
        const isWin = Math.random() < WIN_CHANCE;

        let resultText;
        let newBalance;
        let color;

        if (isWin) {
            const winnings = Math.floor(betAmount * WIN_MULTIPLIER);
            userData.balance += winnings;
            resultText = `🎉 **Kazandın!** 🎉\\n**${winnings}** para kazandın!`;
            color = '#2ECC71'; // Green
        } else {
            userData.balance -= betAmount;
            resultText = `💔 **Kaybettin!** 💔\\n**${betAmount}** para kaybettin.`;
            color = '#E74C3C'; // Red
        }

        newBalance = userData.balance;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🎰 Kumar Sonucu')
            .setDescription(resultText)
            .addFields({ name: 'Yeni Bakiye', value: `**${newBalance}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
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

// Slot machine settings
const symbols = ['🍒', '🍊', '🍇', '🍓', '🔔', '💎', '💰'];
const payouts = {
    '💰💰💰': 50, // 3x Money Bag
    '💎💎💎': 30, // 3x Diamond
    '🔔🔔🔔': 20, // 3x Bell
    '🍓🍓🍓': 15, // 3x Strawberry
    '🍇🍇🍇': 10, // 3x Grapes
    '🍊🍊🍊': 5,  // 3x Orange
    '🍒🍒🍒': 3,  // 3x Cherry
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Slot makinesinde şansını dene!')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Oynamak istediğiniz para miktarı.')
                .setRequired(true)
                .setMinValue(5)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const betAmount = interaction.options.getInteger('miktar');

        const economy = getEconomy();
        const userData = economy[guildId]?.[userId];

        if (!userData || userData.balance < betAmount) {
            return interaction.reply({ content: `❌ Yetersiz bakiye! Slot oynamak için **${betAmount}** paraya ihtiyacın var.`, ephemeral: true });
        }

        // Spin the reels
        const reels = [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];

        const resultKey = reels.join('');
        const winMultiplier = payouts[resultKey];

        let resultText;
        let finalWinnings = -betAmount; // Start with the loss

        if (winMultiplier) {
            const winnings = betAmount * winMultiplier;
            finalWinnings += winnings; // Add winnings
            resultText = `🎉 **Kazandın!** 🎉\\nÇarpan: **x${winMultiplier}** | Kazanç: **${winnings}**`;
        } else {
            resultText = `💔 **Kaybettin!** 💔\\nDaha sonra tekrar dene.`;
        }

        // Update balance
        userData.balance += finalWinnings;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor(winMultiplier ? '#FFD700' : '#99AAB5')
            .setTitle('🎰 Slot Makinesi Sonucu 🎰')
            .setDescription(`**[ ${reels.join(' | ')} ]**\\n\\n${resultText}`)
            .addFields({ name: 'Yeni Bakiye', value: `**${userData.balance}**` })
            .setFooter({ text: `Bahis: ${betAmount}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
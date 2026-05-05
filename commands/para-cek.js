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
        .setName('para-cek')
        .setDescription('Bankanızdaki parayı cüzdanınıza çeker.')
        .addStringOption(option =>
            option.setName('miktar')
                .setDescription('Çekilecek miktar (veya \'hepsi\').')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const amountStr = interaction.options.getString('miktar');

        const economy = getEconomy();

        if (!economy[guildId]?.[userId]?.bank) {
            return interaction.reply({ content: '❌ Bankada hiç paran yok.', ephemeral: true });
        }

        const userData = economy[guildId][userId];
        const bankBalance = userData.bank || 0;

        let amount;
        if (amountStr.toLowerCase() === 'hepsi') {
            amount = bankBalance;
        } else {
            amount = parseInt(amountStr, 10);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ content: '❌ Geçersiz miktar girdin.', ephemeral: true });
            }
            if (amount > bankBalance) {
                return interaction.reply({ content: `❌ Bankada o kadar para yok! Bakiyen: **${bankBalance}**`, ephemeral: true });
            }
        }

        // Update balances
        userData.bank -= amount;
        userData.balance = (userData.balance || 0) + amount;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Para Çekme Başarılı')
            .setDescription(`**${amount}** para bankadan çekildi.`)
            .addFields(
                { name: 'Yeni Cüzdan Bakiyesi 👛', value: `**${userData.balance}**`, inline: true },
                { name: 'Yeni Banka Bakiyesi 🏦', value: `**${userData.bank}**`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

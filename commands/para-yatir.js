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
        .setName('para-yatir')
        .setDescription('Cüzdanınızdaki parayı bankaya yatırır.')
        .addStringOption(option =>
            option.setName('miktar')
                .setDescription('Yatırılacak miktar (veya \'hepsi\').')
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const amountStr = interaction.options.getString('miktar');

        const economy = getEconomy();

        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][userId]) {
            economy[guildId][userId] = { balance: 0, bank: 0 };
        }

        const userData = economy[guildId][userId];
        const balance = userData.balance || 0;

        if (balance === 0) {
            return interaction.reply({ content: '❌ Yatıracak hiç paran yok.', ephemeral: true });
        }

        let amount;
        if (amountStr.toLowerCase() === 'hepsi') {
            amount = balance;
        } else {
            amount = parseInt(amountStr, 10);
            if (isNaN(amount) || amount <= 0) {
                return interaction.reply({ content: '❌ Geçersiz miktar girdin.', ephemeral: true });
            }
            if (amount > balance) {
                return interaction.reply({ content: `❌ Cüzdanında o kadar para yok! Bakiyen: **${balance}**`, ephemeral: true });
            }
        }

        // Update balances
        userData.balance -= amount;
        userData.bank = (userData.bank || 0) + amount;
        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Para Yatırma Başarılı')
            .setDescription(`**${amount}** para bankaya yatırıldı.`)
            .addFields(
                { name: 'Yeni Cüzdan Bakiyesi 👛', value: `**${userData.balance}**`, inline: true },
                { name: 'Yeni Banka Bakiyesi 🏦', value: `**${userData.bank}**`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

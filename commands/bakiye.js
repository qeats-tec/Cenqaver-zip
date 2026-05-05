const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bakiye')
        .setDescription('Kendi bakiyenizi veya başka bir kullanıcının bakiyesini gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Bakiyesini görmek istediğiniz kullanıcı.')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const guildId = interaction.guild.id;

        const economy = getEconomy();

        const userData = economy[guildId]?.[targetUser.id] || { balance: 0, bank: 0 };
        const balance = userData.balance || 0;
        const bank = userData.bank || 0;
        const netWorth = balance + bank;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${targetUser.username} Adlı Kullanıcının Varlığı`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Cüzdan 👛', value: `**${balance}**`, inline: true },
                { name: 'Banka 🏦', value: `**${bank}**`, inline: true },
                { name: 'Toplam Servet 💰', value: `**${netWorth}**`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
        .setName('para-ver')
        .setDescription('[Admin] Bir kullanıcının ekonomisini yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Parası yönetilecek kullanıcı.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('islem')
                .setDescription('Yapılacak işlem.')
                .setRequired(true)
                .addChoices(
                    { name: 'Ekle', value: 'ekle' },
                    { name: 'Ayarla', value: 'ayarla' },
                    { name: 'Kaldır', value: 'kaldir' }
                ))
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('İşlem için miktar.')
                .setRequired(true)
                .setMinValue(0))
        .addStringOption(option =>
            option.setName('cuzdan_banka')
                .setDescription('Paranın nereye ekleneceği.')
                .setRequired(true)
                .addChoices(
                    { name: 'Cüzdan', value: 'cuzdan' },
                    { name: 'Banka', value: 'banka' }
                )),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const action = interaction.options.getString('islem');
        const amount = interaction.options.getInteger('miktar');
        const location = interaction.options.getString('cuzdan_banka');
        const guildId = interaction.guild.id;

        const economy = getEconomy();

        if (!economy[guildId]) economy[guildId] = {};
        if (!economy[guildId][targetUser.id]) {
            economy[guildId][targetUser.id] = { balance: 0, bank: 0 };
        }

        const userData = economy[guildId][targetUser.id];
        const locationKey = location === 'cuzdan' ? 'balance' : 'bank';

        let finalAmount = 0;
        let description = '';

        switch (action) {
            case 'ekle':
                userData[locationKey] += amount;
                finalAmount = userData[locationKey];
                description = `**<@${targetUser.id}>** kullanıcısının ${location} hesabına **${amount}** eklendi.`;
                break;
            case 'ayarla':
                userData[locationKey] = amount;
                finalAmount = amount;
                description = `**<@${targetUser.id}>** kullanıcısının ${location} hesabı **${amount}** olarak ayarlandı.`;
                break;
            case 'kaldir':
                userData[locationKey] = Math.max(0, userData[locationKey] - amount);
                finalAmount = userData[locationKey];
                description = `**<@${targetUser.id}>** kullanıcısının ${location} hesabından **${amount}** silindi.`;
                break;
        }

        saveEconomy(economy);
        
        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🛠️ Ekonomi Yönetimi')
            .setDescription(description)
            .addFields({ name: `Yeni ${location} Bakiyesi`, value: `**${finalAmount}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

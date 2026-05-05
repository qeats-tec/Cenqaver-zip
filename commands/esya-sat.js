const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', 'economy.json');
const ayarlarPath = path.join(__dirname, '..', 'market-ayarlar.json');

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

function getAyarlar() {
    if (fs.existsSync(ayarlarPath)) {
        return JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('esya-sat')
        .setDescription('Envanterinizdeki bir eşyayı satarsınız.')
        .addStringOption(option =>
            option.setName('esya_id')
                .setDescription('Satmak istediğiniz eşyanın ID\'si.')
                .setRequired(true)),

    async execute(interaction) {
        const itemIdToSell = interaction.options.getString('esya_id');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const economy = getEconomy();
        const ayarlar = getAyarlar();

        if (!ayarlar[guildId] || !ayarlar[guildId].items) {
            return interaction.reply({ content: '❌ Bu sunucuda market ayarları bulunamadı.', ephemeral: true });
        }

        const marketItem = ayarlar[guildId].items.find(item => item.id === itemIdToSell && item.type === 'item');

        if (!marketItem) {
            return interaction.reply({ content: '❌ Bu ID ile markette satılan bir eşya bulunamadı.', ephemeral: true });
        }

        const userInventory = economy[guildId]?.[userId]?.inventory || [];
        const itemIndex = userInventory.findIndex(item => item.id === itemIdToSell);

        if (itemIndex === -1) {
            return interaction.reply({ content: '❌ Satmak istediğin eşyaya sahip değilsin.', ephemeral: true });
        }

        const sellPrice = Math.floor(marketItem.price * 0.75); // Sell for 75% of original price

        // Update user's balance and remove the item from inventory
        economy[guildId][userId].balance += sellPrice;
        userInventory.splice(itemIndex, 1);
        economy[guildId][userId].inventory = userInventory;

        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#1ABC9C')
            .setTitle('✅ Eşya Satışı Başarılı!')
            .setDescription(`**${marketItem.name}** eşyasını **${sellPrice}** paraya sattın.`)
            .addFields({ name: 'Yeni Cüzdan Bakiyen', value: `**${economy[guildId][userId].balance}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
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
        .setName('rol-sat')
        .setDescription('Marketten satın aldığınız bir rolü satarsınız.')
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Satmak istediğiniz rol.')
                .setRequired(true)),

    async execute(interaction) {
        const roleToSell = interaction.options.getRole('rol');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const economy = getEconomy();
        const ayarlar = getAyarlar();

        if (!ayarlar[guildId] || !ayarlar[guildId].items) {
            return interaction.reply({ content: '❌ Bu sunucuda market ayarları bulunamadı.', ephemeral: true });
        }

        const marketItem = ayarlar[guildId].items.find(item => item.type === 'role' && item.roleId === roleToSell.id);

        if (!marketItem) {
            return interaction.reply({ content: '❌ Bu rol markette satılan bir ürün değil.', ephemeral: true });
        }

        if (!interaction.member.roles.cache.has(roleToSell.id)) {
            return interaction.reply({ content: '❌ Satmak istediğin role sahip değilsin.', ephemeral: true });
        }

        const sellPrice = Math.floor(marketItem.price * 0.75); // Sell for 75% of original price

        // Update user's balance and remove the role
        economy[guildId][userId].balance += sellPrice;
        await interaction.member.roles.remove(roleToSell);

        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#1ABC9C')
            .setTitle('✅ Rol Satışı Başarılı!')
            .setDescription(`**${roleToSell.name}** rolünü **${sellPrice}** paraya sattın.`)
            .addFields({ name: 'Yeni Cüzdan Bakiyen', value: `**${economy[guildId][userId].balance}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
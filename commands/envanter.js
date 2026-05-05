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
        .setName('envanter')
        .setDescription('Satın aldığınız ürünleri gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Envanterini görmek istediğiniz kullanıcı.')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const guildId = interaction.guild.id;
        const economy = getEconomy();

        const userData = economy[guildId]?.[targetUser.id] || {};
        const inventory = userData.inventory || [];

        const embed = new EmbedBuilder()
            .setColor('#95A5A6')
            .setTitle(`🎒 ${targetUser.username} Adlı Kullanıcının Envanteri`)
            .setTimestamp();

        if (inventory.length === 0) {
            embed.setDescription('Bu kullanıcının envanteri boş.');
        } else {
            const items = inventory.map(item => `**- ${item.name}** (ID: \`${item.id}\`)`).join('\\n');
            embed.setDescription(items);
        }

        return interaction.reply({ embeds: [embed] });
    }
};
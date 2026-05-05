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
        .setName('satin-al')
        .setDescription('Marketten bir ürün satın al.')
        .addStringOption(option =>
            option.setName('urun_id')
                .setDescription('Satın almak istediğiniz ürünün ID\'si.')
                .setRequired(true)),

    async execute(interaction) {
        const itemIdToBuy = interaction.options.getString('urun_id');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        const economy = getEconomy();
        const ayarlar = getAyarlar();

        if (!ayarlar[guildId] || !ayarlar[guildId].items) {
            return interaction.reply({ content: '❌ Bu sunucuda market ayarları bulunamadı.', ephemeral: true });
        }

        const item = ayarlar[guildId].items.find(i => i.id === itemIdToBuy);

        if (!item) {
            return interaction.reply({ content: '❌ Bu ID ile bir ürün bulunamadı.', ephemeral: true });
        }

        if (!economy[guildId]?.[userId] || economy[guildId][userId].balance < item.price) {
            const userBalance = economy[guildId]?.[userId]?.balance || 0;
            return interaction.reply({ content: `❌ Yetersiz bakiye! Bu ürünü almak için **${item.price}** paraya ihtiyacın var. Senin bakiyen: **${userBalance}**`, ephemeral: true });
        }

        // Process purchase
        economy[guildId][userId].balance -= item.price;

        if (item.type === 'role') {
            const role = interaction.guild.roles.cache.get(item.roleId);
            if (!role) {
                return interaction.reply({ content: '❌ Rol bulunamadı. Lütfen yöneticiyle iletişime geçin.', ephemeral: true });
            }
            if (interaction.member.roles.cache.has(role.id)) {
                 economy[guildId][userId].balance += item.price; // Refund
                 saveEconomy(economy);
                return interaction.reply({ content: '❌ Zaten bu role sahipsin!', ephemeral: true });
            }
            await interaction.member.roles.add(role);
        } else if (item.type === 'item') {
            if (!economy[guildId][userId].inventory) {
                economy[guildId][userId].inventory = [];
            }
            economy[guildId][userId].inventory.push(item);
        }

        saveEconomy(economy);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🛒 Satın Alma Başarılı!')
            .setDescription(`**${item.name}** ürününü **${item.price}** paraya satın aldın!`)
            .addFields({ name: 'Kalan Bakiye', value: `**${economy[guildId][userId].balance}**` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '..', 'market-ayarlar.json');

// Helper functions
function getAyarlar() {
    if (fs.existsSync(ayarlarPath)) {
        try {
            return JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
        } catch (error) {
            console.error("[HATA] market-ayarlar.json okunamadı veya bozuk:", error);
            return {};
        }
    }
    return {};
}

function saveAyarlar(ayarlar) {
    fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 2));
}

// Function to generate a unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 6);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-yonet')
        .setDescription('[Admin] Sunucu marketini yönetir.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('rol-ekle') // Değiştirildi: rol_ekle -> rol-ekle
                .setDescription('Markete satılık bir rol ekler.')
                .addRoleOption(option => option.setName('rol').setDescription('Eklenecek rol.').setRequired(true))
                .addIntegerOption(option => option.setName('fiyat').setDescription('Rolün fiyatı.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('esya-ekle') // Değiştirildi: esya_ekle -> esya-ekle
                .setDescription('Markete bir eşya ekler.')
                .addStringOption(option => option.setName('isim').setDescription('Eşyanın adı.').setRequired(true))
                .addStringOption(option => option.setName('aciklama').setDescription('Eşyanın açıklaması. Yeni satır için \\n kullanabilirsiniz.').setRequired(true))
                .addIntegerOption(option => option.setName('fiyat').setDescription('Eşyanın fiyatı.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kaldir')
                .setDescription('Marketten bir ürünü kaldırır.')
                .addStringOption(option => option.setName('urun_id').setDescription('Kaldırılacak ürünün ID\'si.').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        const ayarlar = getAyarlar();
        if (!ayarlar[guildId]) {
            ayarlar[guildId] = { items: [] };
        }

        let embed;

        if (subcommand === 'rol-ekle') { // Değiştirildi
            const role = interaction.options.getRole('rol');
            const price = interaction.options.getInteger('fiyat');
            const newItem = {
                id: generateId(),
                type: 'role',
                name: role.name,
                roleId: role.id,
                price: price
            };
            ayarlar[guildId].items.push(newItem);
            embed = new EmbedBuilder().setColor('#2ECC71').setTitle('✅ Rol Eklendi').setDescription(`**${role.name}** rolü, **${price}** fiyatıyla markete eklendi. ID: \`${newItem.id}\``);
        } else if (subcommand === 'esya-ekle') { // Değiştirildi
            const name = interaction.options.getString('isim');
            const description = interaction.options.getString('aciklama');
            const price = interaction.options.getInteger('fiyat');
            const newItem = {
                id: generateId(),
                type: 'item',
                name: name,
                description: description,
                price: price
            };
            ayarlar[guildId].items.push(newItem);
            embed = new EmbedBuilder().setColor('#2ECC71').setTitle('✅ Eşya Eklendi').setDescription(`**${name}** eşyası, **${price}** fiyatıyla markete eklendi. ID: \`${newItem.id}\``);
        } else if (subcommand === 'kaldir') {
            const itemId = interaction.options.getString('urun_id');
            const itemIndex = ayarlar[guildId].items.findIndex(item => item.id === itemId);

            if (itemIndex === -1) {
                return interaction.reply({ content: '❌ Bu ID ile bir ürün bulunamadı.', ephemeral: true });
            }

            const removedItem = ayarlar[guildId].items.splice(itemIndex, 1)[0];
            embed = new EmbedBuilder().setColor('#E74C3C').setTitle('🗑️ Ürün Kaldırıldı').setDescription(`**${removedItem.name}** (ID: \`${removedItem.id}\`) marketten kaldırıldı.`);
        }

        saveAyarlar(ayarlar);
        return interaction.reply({ embeds: [embed] });
    }
};
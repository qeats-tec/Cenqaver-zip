const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '..', 'market-ayarlar.json');

// Helper function to read ayarlar data
function getAyarlar() {
    if (fs.existsSync(ayarlarPath)) {
        try {
            return JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
        } catch (error) {
            console.error("market-ayarlar.json okunamadı veya bozuk:", error);
            return {};
        }
    }
    return {};
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Sunucudaki satılık ürünleri listeler.'),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const ayarlar = getAyarlar();

        if (!ayarlar[guildId] || !ayarlar[guildId].items || ayarlar[guildId].items.length === 0) {
            return interaction.reply({ content: '✨ Markette henüz satılan bir ürün yok. `\/esya-ekle` komutu ile yeni ürünler ekleyebilirsiniz.' });
        }

        const items = ayarlar[guildId].items;

        const roles = items.filter(item => item.type === 'role');
        const otherItems = items.filter(item => item.type === 'item');

        const embed = new EmbedBuilder()
            .setColor('#E67E22')
            .setTitle(`🛍️ ${interaction.guild.name} Sunucu Marketi`)
            .setTimestamp();

        if (roles.length > 0) {
            // Düzeltildi: join('\n') -> join('\n')
            const roleList = roles.map(item => `**${item.name}** - \`$${item.price}\` para (ID: \`${item.id}\`)`).join('\n');
            embed.addFields({ name: 'Satılık Roller 🎭', value: roleList });
        }

        if (otherItems.length > 0) {
            // Düzeltildi: join('\n\n') -> join('\n\n')
            const itemList = otherItems.map(item => {
                // Açıklamadaki \n karakterlerini gerçek yeni satıra çevir
                const description = item.description.replace(/\\n/g, '\n');
                return `**${item.name}** - \`$${item.price}\` para (ID: \`${item.id}\`)\n*${description}*`;
            }).join('\n\n');
            embed.addFields({ name: 'Satılık Eşyalar 🏷️', value: itemList });
        }
        
        if (roles.length === 0 && otherItems.length === 0) {
             embed.setDescription('✨ Markette henüz satılan bir ürün yok. `\/esya-ekle` komutu ile yeni ürünler ekleyebilirsiniz.');
        }

        embed.setFooter({ text: 'Bir ürünü satın almak için /satin-al komutunu kullanın.' });

        return interaction.reply({ embeds: [embed] });
    }
};
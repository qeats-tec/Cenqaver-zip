const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Diğer komutlarla tutarlılık için doğru ayarlar dosyası kullanılıyor.
const ayarlarPath = path.join(__dirname, '..', 'market-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market-menusu-kur')
        .setDescription('[Admin] Belirtilen kanalda kalıcı market menüsünü kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Market menüsünün gönderileceği kanal.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const channel = interaction.options.getChannel('kanal');
        const guildId = interaction.guild.id;

        let ayarlar;
        try {
            if (fs.existsSync(ayarlarPath)) {
                const rawData = fs.readFileSync(ayarlarPath, 'utf-8');
                ayarlar = JSON.parse(rawData);
            } else {
                return interaction.editReply({ content: '❌ Market ayar dosyası (`market-ayarlar.json`) bulunamadı. Lütfen önce `/market-kur` komutu ile marketi kurun.' });
            }
        } catch (error) {
            console.error('Market ayarları okunurken bir hata oluştu:', error);
            return interaction.editReply({ content: '❌ Market ayarları okunurken bir hata oluştu.' });
        }

        const sunucuAyarlari = ayarlar[guildId];

        if (!sunucuAyarlari) {
            return interaction.editReply({ content: '❌ Bu sunucu için market sistemi kurulmamış. Lütfen önce `/market-kur` komutunu kullanın.' });
        }

        if (!sunucuAyarlari.items || sunucuAyarlari.items.length === 0) {
            return interaction.editReply({ content: 'ℹ️ Markette hiç ürün yok. Lütfen önce `/market-yonet` komutları ile ürün ekleyin.' });
        }

        // Discord en fazla 25 seçenek kabul eder.
        const options = sunucuAyarlari.items.slice(0, 25).map(item => ({
            label: item.name,
            // Rol ise açıklaması olmayacağı için varsayılan bir metin ekleniyor.
            description: `Fiyat: ${item.price} 🪙 - ${item.description || 'Satın alınabilir bir rol.'}`.substring(0, 100),
            value: `market_item_${item.id}`
        }));

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('market_select_menu')
                    .setPlaceholder('Görüntülemek veya satın almak için bir ürün seçin')
                    .addOptions(options),
            );

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🛒 Sunucu Marketi')
            .setDescription('Aşağıdaki menüden satın almak istediğiniz ürünü seçebilirsiniz.')
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed], components: [selectMenu] });
            await interaction.editReply({ content: `✅ Market menüsü başarıyla ${channel} kanalına gönderildi.` });
        } catch (error) {
            console.error('Market menüsü gönderilirken hata oluştu:', error);
            await interaction.editReply({ content: '❌ Market menüsünü o kanala gönderirken bir hata oluştu. Botun o kanalda gerekli izinlere sahip olduğundan emin olun.'});
        }
    },
};

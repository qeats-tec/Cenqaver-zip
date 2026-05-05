const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');

// Komutları daha detaylı ve mantıklı kategorilere ayıralım (Toplam 81 Komut)
const commandData = {
    "Moderasyon": [
        { name: '/ban', description: 'Bir kullanıcıyı sunucudan yasaklar.' },
        { name: '/unban', description: 'Bir kullanıcının yasağını kaldırır.' },
        { name: '/kick', description: 'Bir kullanıcıyı sunucudan atar.' },
        { name: '/mute', description: 'Bir kullanıcıyı susturur.' },
        { name: '/unmute', description: 'Bir kullanıcının susturmasını kaldırır.' },
        { name: '/temizle', description: 'Belirtilen miktarda mesajı siler.' },
        { name: '/kilit', description: 'Kanalı kilitler.' },
        { name: '/kilit-ac', description: 'Kanalın kilidini açar.' },
        { name: '/yavasmod', description: 'Kanala yavaş mod uygular.' },
        { name: '/uyar', description: 'Bir kullanıcıyı uyarır.' },
        { name: '/uyari-listele', description: 'Bir kullanıcının uyarılarını listeler.' },
        { name: '/uyari-kaldir', description: 'Bir kullanıcının uyarısını kaldırır.' },
        { name: '/sicil', description: 'Bir kullanıcının moderasyon geçmişini gösterir.' },
        { name: '/rol-ver', description: 'Bir kullanıcıya rol verir.' },
        { name: '/rol-al', description: 'Bir kullanıcıdan rol alır.' }
    ],
    "Kullanıcı & Bilgi": [
        { name: '/avatar', description: 'Bir kullanıcının avatarını gösterir.' },
        { name: '/banner', description: 'Bir kullanıcının bannerını gösterir.' },
        { name: '/kullanicibilgi', description: 'Bir kullanıcı hakkında bilgi verir.' },
        { name: '/sunucubilgi', description: 'Sunucu hakkında bilgi verir.' },
        { name: '/ping', description: 'Botun gecikme süresini gösterir.' },
        { name: '/afk-ol', description: 'AFK moduna geçmenizi sağlar.' },
        { name: '/pfp', description: 'Bir kullanıcının profil fotoğrafını gösterir.' }
    ],
    "Ekonomi": [
        { name: '/bakiye', description: 'Bakiyenizi gösterir.' },
        { name: '/gunluk', description: 'Günlük ödülünüzü alırsınız.' },
        { name: '/para-yatir', description: 'Bankaya para yatırırsınız.' },
        { name: '/para-cek', description: 'Bankadan para çekersiniz.' },
        { name: '/para-gonder', description: 'Başka bir kullanıcıya para gönderirsiniz.' },
        { name: '/lider-tablosu', description: 'Ekonomi liderlik tablosunu gösterir.' },
        { name: '/kumar', description: 'Kumar oynayarak para kazanmaya çalışırsınız.' },
        { name: '/slot', description: 'Slot makinesinde şansınızı denersiniz.' },
        { name: '/suc-isle', description: 'Suç işleyerek para kazanmaya çalışırsınız.' },
        { name: '/soygun', description: 'Soygun yaparak para kazanmaya çalışırsınız.' },
        { name: '/market', description: 'Marketten eşya satın alırsınız.' },
        { name: '/satin-al', description: 'Marketten bir eşya satın alırsınız.' },
        { name: '/envanter', description: 'Envanterinizi görüntülersiniz.' },
        { name: '/esya-sat', description: 'Envanterinizdeki bir eşyayı satarsınız.' },
        { name: '/rol-sat', description: 'Satın alınabilir bir rolü satarsınız.' }
    ],
    "Ekonomi (Yönetim)": [
        { name: '/para-ekle', description: 'Bir kullanıcıya para ekler.' },
        { name: '/para-sil', description: 'Bir kullanıcıdan para siler.' },
        { name: '/para-ver', description: 'Bir kullanıcıya para verir.' },
        { name: '/ekonomiyi-sifirla', description: 'Sunucunun ekonomisini sıfırlar.' },
        { name: '/market-kur', description: 'Sunucu marketini kurar.' },
        { name: '/market-yonet', description: 'Marketi yönetir (eşya ekle/çıkar).' },
        { name: '/market-menusu-kur', description: 'Market için bir menü oluşturur.' }
    ],
    "Seviye Sistemi": [
        { name: '/seviye', description: 'Seviyenizi ve XP\'nizi gösterir.' },
        { name: '/liderlik-tablosu', description: 'Seviye liderlik tablosunu gösterir.' },
        { name: '/seviye-ayarlari', description: 'Seviye sisteminin ayarlarını yönetir.' },
        { name: '/seviye-sistemi', description: 'Seviye sistemini açar veya kapatır.' },
        { name: '/seviye-odul', description: 'Belirli bir seviyeye ulaşanlara rol ödülü verir.' },
        { name: '/xp-yonet', description: 'Bir kullanıcının XP\'sini yönetir (Yönetici).' },
        { name: '/xp-sifirla', description: 'Bir kullanıcının XP\'sini sıfırlar (Yönetici).' }
    ],
    "Sunucu Yönetimi": [
        { name: '/hosgeldin-kanal-ayarla', description: 'Hoş geldin mesajlarının gönderileceği kanalı ayarlar.' },
        { name: '/hosgeldin-mesaji', description: 'Hoş geldin mesajını özelleştirir.' },
        { name: '/ayrilma-kanal-ayarla', description: 'Ayrılma mesajlarının gönderileceği kanalı ayarlar.' },
        { name: '/ayrilma-mesaji', description: 'Ayrılma mesajını özelleştirir.' },
        { name: '/log-kurulum', description: 'Sunucu için log sistemini kurar.' },
        { name: '/otocevap', description: 'Otomatik cevaplar ekler veya kaldırır.' },
        { name: '/tepki-rol-kur', description: 'Bir tepki-rol mesajı oluşturur.' },
        { name: '/tepki-rol-ekle', description: 'Mevcut bir mesaja tepki-rol ekler.' },
        { name: '/durum-kanali-ayarla', description: 'Sunucu istatistiklerinin gösterileceği bir kanal ayarlar.' }
    ],
    "Sunucu Yedekleme": [
        { name: '/kaydet', description: 'Sunucunun rollerini ve kanallarını yedekler.' },
        { name: '/yükle', description: 'Sunucuyu daha önce alınan bir yedekten geri yükler.' }
    ],
    "Bilet & Destek": [
        { name: '/ticket-olustur', description: 'Bilet oluşturma mesajını gönderir.' },
        { name: '/ticket-ayarlar', description: 'Bilet sistemi ayarlarını yönetir.' },
        { name: '/ticket-ac', description: 'Yeni bir bilet açar.' },
        { name: '/ticket-kapat', description: 'Mevcut bir bileti kapatır.' }
    ],
    "Başvuru Sistemi": [
        { name: '/başvuru-sistemi-kur', description: 'Yetkili başvuru sistemini kurar.' },
        { name: '/başvuru-soru-ekle', description: 'Başvuruya yeni bir soru ekler.' },
        { name: '/başvuru-soru-kaldır', description: 'Başvurudan bir soruyu kaldırır.' },
        { name: '/başvuru-soru-listele', description: 'Başvuru sorularını listeler.' },
        { name: '/yetkili-başvuru', description: 'Yetkili başvurusunda bulunursunuz.' }
    ],
    "Müzik": [
        { name: '/oynat', description: 'Bir şarkıyı çalar veya sıraya ekler.' },
        { name: '/atla', description: 'Sıradaki şarkıya geçer.' },
        { name: '/durdur', description: 'Çalan şarkıyı durdurur ve bot kanaldan ayrılır.' }
    ],
    "Oyunlar": [
        { name: '/vampir-koylu', description: 'Vampir Köylü oyununu başlatır.' },
        { name: '/tek-kelime', description: 'Tek kelime türetmece oyununu yönetir.' }
    ],
    "Eğlence & Araçlar": [
        { name: '/saka', description: 'Rastgele bir şaka yapar.' },
        { name: '/oylama', description: 'Bir oylama başlatır.' },
        { name: '/söyle', description: 'Bota istediğiniz bir mesajı söyletirsiniz.' },
        { name: '/embed-olustur', description: 'Özelleştirilmiş bir embed mesajı oluşturur.' },
        { name: '/yapistir', description: 'Komik bir "yapıştır" metni gönderir.' }
    ]
};

// Ana Embed: Kategori seçim ekranı
const createInitialEmbed = (client) => new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('Cenqaver | Yardım Menüsü')
    .setDescription('Merhaba! Ben Cenqaver. Sunucunuzu yönetmek, eğlence katmak ve daha fazlası için buradayım.\n\nAşağıdaki menüden komutları görmek istediğiniz kategoriyi seçebilirsiniz.')
    .setThumbnail(client.user.displayAvatarURL())
    .setTimestamp()
    .setFooter({ text: 'Bir kategori seçin', iconURL: client.user.displayAvatarURL() });

// Kategoriye özel Embed oluşturan fonksiyon
const createCategoryEmbed = (category, client) => {
    const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📜 ${category} Komutları (${commandData[category].length} adet)`)
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: `Cenqaver | ${category}`, iconURL: client.user.displayAvatarURL() });

    const commands = commandData[category];
    const fields = commands.map(cmd => ({ name: cmd.name, value: cmd.description, inline: false }));
    
    embed.addFields(fields.slice(0, 25)); // Discord limiti (25)

    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Tüm komutları kategorize edilmiş bir şekilde gösterir.'),

    async execute(interaction) {
        const { client } = interaction;

        const initialEmbed = createInitialEmbed(client);

        const options = Object.keys(commandData).map(category => ({
            label: `${category} (${commandData[category].length})`,
            description: `${category} kategorisindeki komutları gösterir.`,
            value: category,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('yardim_kategori_sec')
            .setPlaceholder('Kategori seçmek için tıkla!')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const message = await interaction.reply({
            embeds: [initialEmbed],
            components: [row],
            ephemeral: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000 // 2 dakika
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'Bu menüyü sadece komutu başlatan kişi kullanabilir.', ephemeral: true });
                return;
            }

            const selectedCategory = i.values[0];
            const categoryEmbed = createCategoryEmbed(selectedCategory, client);

            await i.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', () => {
             const disabledRow = new ActionRowBuilder().addComponents(
                selectMenu.setDisabled(true)
            );
            interaction.editReply({ components: [disabledRow] }).catch(console.error);
        });
    },
};
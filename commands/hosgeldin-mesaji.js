const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Veri dosyasının yolu
const welcomeSettingsPath = path.join(__dirname, '..', 'hosgeldin-ayarlar.json');

// Ayarları okumak için yardımcı fonksiyon
const readSettings = () => {
    // Dosya yoksa veya boşsa, boş bir nesne döndür
    if (!fs.existsSync(welcomeSettingsPath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(welcomeSettingsPath, 'utf8');
        // Dosya boşsa yine boş nesne döndür
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('[HATA] hosgeldin-ayarlar.json dosyası okunurken bir hata oluştu:', error);
        return {}; // Hata durumunda da boş bir nesne ile devam et
    }
};

// Ayarları yazmak için yardımcı fonksiyon
const writeSettings = (data) => {
    try {
        fs.writeFileSync(welcomeSettingsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[HATA] hosgeldin-ayarlar.json dosyasına yazılırken bir hata oluştu:', error);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hosgeldin-mesaji-ayarla')
        .setDescription('Yeni üyelere gönderilecek hoş geldin mesajını ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Mesaj içeriği. Üyeden bahsetmek için {user}, sunucu için {server} kullanın.')
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const message = interaction.options.getString('mesaj');
            const guildId = interaction.guild.id;
            
            const settings = readSettings();

            // Sunucu için ayar nesnesi yoksa oluştur
            if (!settings[guildId]) {
                settings[guildId] = {};
            }
            
            // Kanal ayarlanmış mı diye kontrol et. Değilse, kullanıcıyı uyar.
            if (!settings[guildId].welcomeChannelId) {
                return interaction.editReply({ 
                    content: '❌ Hoş geldin mesajını ayarlamadan önce `/hosgeldin-kanal-ayarla` komutu ile bir kanal belirlemelisiniz.' 
                });
            }

            settings[guildId].welcomeMessage = message;
            writeSettings(settings);

            await interaction.editReply({ 
                content: `✅ Hoş geldin mesajı başarıyla ayarlandı.`,
                embeds: [{
                    color: 0x0099ff,
                    title: 'Mesaj Önizlemesi',
                    description: message.replace('{user}', interaction.user).replace('{server}', interaction.guild.name),
                    footer: { text: 'Bu sadece bir önizlemedir.' }
                }]
            });
        } catch (error) {
            console.error('[HATA] hosgeldin-mesaji-ayarla komutunda hata:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Komutu çalıştırırken beklenmedik bir hata oluştu.' });
            }
        }
    },
};
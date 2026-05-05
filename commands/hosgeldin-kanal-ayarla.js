const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
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
    // Komut tanımını daha anlaşılır hale getiriyoruz
    data: new SlashCommandBuilder()
        .setName('hosgeldin-kanal-ayarla')
        .setDescription('Hoş geldin mesajının gönderileceği kanalı ayarlar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Hoş geldin mesajının gönderileceği metin kanalı')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('kanal');
            const guildId = interaction.guild.id;

            // Botun o kanalda mesaj gönderme izni var mı kontrol et
            if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
                return interaction.editReply({ content: `❌ ${channel} kanalında mesaj gönderme iznim yok. Lütfen izinleri kontrol et.` });
            }

            const settings = readSettings();

            // Sunucu için ayar nesnesi yoksa oluştur
            if (!settings[guildId]) {
                settings[guildId] = {};
            }

            settings[guildId].welcomeChannelId = channel.id;
            writeSettings(settings);

            await interaction.editReply({ content: `✅ Hoş geldin mesajı kanalı başarıyla ${channel} olarak ayarlandı.` });
        } catch (error) {
            console.error('[HATA] hosgeldin-kanal-ayarla komutunda hata:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: '❌ Komutu çalıştırırken beklenmedik bir hata oluştu.' });
            }
        }
    },
};
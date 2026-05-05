const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Ayarlar dosyasının yolu
const settingsPath = path.join(__dirname, '..', 'tek-kelime-ayarlar.json');

// Ayarlar dosyasını okuyan veya oluşturan yardımcı fonksiyon
function getSettings() {
    if (!fs.existsSync(settingsPath)) {
        fs.writeFileSync(settingsPath, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
}

// Ayarları dosyaya yazan yardımcı fonksiyon
function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tek-kelime')
        .setDescription('Kanalda sadece tek bir kelimenin veya komutun kullanılmasına izin verir.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Sadece yöneticiler kullanabilir
        .addStringOption(option =>
            option.setName('ifade')
                .setDescription('İzin verilecek kelime/komut. Kaldırmak için bu alanı boş bırakın.')
                .setRequired(false)),
    async execute(interaction) {
        const allowedWord = interaction.options.getString('ifade');
        const channelId = interaction.channel.id;

        const settings = getSettings();

        if (allowedWord) {
            // Kuralı ayarla veya güncelle
            settings[channelId] = allowedWord;
            saveSettings(settings);
            await interaction.reply({ 
                content: `✅ Bu kanalda artık sadece \`${allowedWord}\` ifadesinin kullanılmasına izin verilecek.`, 
                ephemeral: true 
            });
        } else {
            // Kuralı kaldır
            if (settings[channelId]) {
                delete settings[channelId];
                saveSettings(settings);
                await interaction.reply({ 
                    content: '✅ Bu kanaldaki tek kelime kullanma kısıtlaması başarıyla kaldırıldı.', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'ℹ️ Bu kanalda zaten bir kısıtlama bulunmuyor.', 
                    ephemeral: true 
                });
            }
        }
    },
};

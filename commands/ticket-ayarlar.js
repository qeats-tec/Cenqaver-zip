
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const settingsFilePath = path.join(__dirname, '..', 'ticket-settings.json');

// Yardımcı fonksiyon: Ayarları dosyadan oku
function getSettings() {
    try {
        if (fs.existsSync(settingsFilePath)) {
            const data = fs.readFileSync(settingsFilePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('ticket-settings.json okunurken hata:', error);
    }
    return { settings: {} }; // Hata veya dosya yoksa varsayılan boş obje döner
}

// Yardımcı fonksiyon: Ayarları dosyaya yaz
function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('ticket-settings.json yazılırken hata:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-ayarlar')
        .setDescription('Ticket sistemi ayarlarını yapılandırır. (Yönetici Yetkisi Gerekli)')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Sadece adminler görebilir
        .addRoleOption(option =>
            option.setName('destek-rol')
                .setDescription('Ticketları görebilecek destek ekibi rolü.')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('ping-rol')
                .setDescription('Ticket oluşturulduğunda etiketlenecek rol.')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('kategori')
                .setDescription('Ticket kanallarının oluşturulacağı kategori.')
                .setRequired(false)),

    async execute(interaction) {
        // Yönetici yetkisi kontrolü zaten setDefaultMemberPermissions ile yapılıyor.
        // Bu yüzden ek bir kontrole gerek yok.

        const destekRol = interaction.options.getRole('destek-rol');
        const pingRol = interaction.options.getRole('ping-rol');
        const kategori = interaction.options.getChannel('kategori');

        const allSettings = getSettings();
        const guildId = interaction.guild.id;

        // Sunucuya özel ayarları al veya oluştur
        if (!allSettings.settings[guildId]) {
            allSettings.settings[guildId] = {};
        }

        const guildSettings = allSettings.settings[guildId];

        let replyMessage = 'Ayarlar güncellendi:\n';

        if (destekRol) {
            guildSettings.destekRolId = destekRol.id;
            replyMessage += `- Destek Rolü: ${destekRol}\n`;
        }
        if (pingRol) {
            guildSettings.pingRolId = pingRol.id;
            replyMessage += `- Ping Rolü: ${pingRol}\n`;
        }
        if (kategori) {
            if (kategori.type === 4) { // Kategori tipi 4'tür
                guildSettings.kategoriId = kategori.id;
                replyMessage += `- Kategori: ${kategori.name}\n`;
            } else {
                return interaction.reply({ content: 'Lütfen geçerli bir kategori seçin.', ephemeral: true });
            }
        }

        if (!destekRol && !pingRol && !kategori) {
            // Eğer hiçbir seçenek verilmediyse, mevcut ayarları göster
            const currentDestekRol = guildSettings.destekRolId ? `<@&${guildSettings.destekRolId}>` : 'Ayarlanmamış';
            const currentPingRol = guildSettings.pingRolId ? `<@&${guildSettings.pingRolId}>` : 'Ayarlanmamış';
            const currentKategori = guildSettings.kategoriId ? `<#${guildSettings.kategoriId}>` : 'Ayarlanmamış';

            replyMessage = `**Mevcut Ticket Ayarları:**\n- Destek Rolü: ${currentDestekRol}\n- Ping Rolü: ${currentPingRol}\n- Kategori: ${currentKategori}`;
        }

        saveSettings(allSettings);

        await interaction.reply({ content: replyMessage, ephemeral: true });
    },
};

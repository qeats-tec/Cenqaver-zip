const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Kullanılacak JSON dosyasının yolu (afk.json olarak değiştirdim)
const afkFilePath = path.join(__dirname, '..', 'afk.json');

// AFK verisini okuma fonksiyonu
const readAfkData = () => {
    if (!fs.existsSync(afkFilePath)) {
        return {};
    }
    try {
        const data = fs.readFileSync(afkFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('afk.json okunurken hata oluştu:', error);
        return {};
    }
};

// AFK verisini yazma fonksiyonu
const writeAfkData = (data) => {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk-ol')
        .setDescription('AFK moduna girersiniz ve sizi etiketleyenlere bilgi verilir.')
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('AFK olma sebebiniz.')
                .setRequired(false)),
    async execute(interaction) {
        const reason = interaction.options.getString('sebep') || 'Belirtilmedi';
        const user = interaction.user;
        const member = interaction.member;
        const guild = interaction.guild;

        const afkData = readAfkData();

        // Sunucu için veri yoksa oluştur
        if (!afkData[guild.id]) {
            afkData[guild.id] = {};
        }

        // Kullanıcı zaten AFK ise
        if (afkData[guild.id][user.id]) {
            return interaction.reply({ content: 'Zaten AFK modundasınız.', ephemeral: true });
        }

        const originalNickname = member.nickname || user.username;

        // Veriyi sunucu ve kullanıcı ID'si bazında kaydet
        afkData[guild.id][user.id] = {
            reason: reason,
            timestamp: Date.now(),
            nickname: originalNickname // İsim tutarlılığı için "nickname" olarak değiştirdim
        };

        writeAfkData(afkData);

        // Takma adını değiştirmeyi dene
        try {
            // Sunucu sahibinin takma adı değiştirilemez
            if (member.id === guild.ownerId) {
                return interaction.reply({ content: `Başarıyla AFK moduna girdiniz. (Sunucu sahibi olduğunuz için takma adınız değiştirilemedi) Sebep: ${reason}` });
            }

            // Botun yetkisini kontrol et
            if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
                return interaction.reply({ content: `Başarıyla AFK moduna girdiniz. (Takma adınızı değiştirmek için yetkim yok) Sebep: ${reason}` });
            }
            
            // Yönetilebiliyorsa takma adı ayarla
            if (member.manageable) {
                const newNickname = `[AFK] ${originalNickname}`;
                await member.setNickname(newNickname.slice(0, 32)); // 32 karakter sınırını aşmamak için
                await interaction.reply({ content: `Başarıyla AFK moduna girdiniz. Sebep: ${reason}` });
            } else {
                 await interaction.reply({ content: `Başarıyla AFK moduna girdiniz. (Rolünüz daha yüksek olduğu için takma adınız değiştirilemedi) Sebep: ${reason}` });
            }

        } catch (error) {
            console.error(`AFK takma adı ayarlanamadı: ${error.message}`);
            await interaction.reply({ content: `Başarıyla AFK moduna girdiniz, ancak takma adınız bir hata nedeniyle değiştirilemedi. Sebep: ${reason}` });
        }
    },
};
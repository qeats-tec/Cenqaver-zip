const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '../başvuru-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('başvuru-sistemi-kur')
        .setDescription('Yetkili başvuru sistemini kurar veya sıfırlar.')
        .addChannelOption(option =>
            option.setName('log_kanalı')
                .setDescription('Başvuruların gönderileceği kanal.')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const logKanali = interaction.options.getChannel('log_kanalı');

        try {
            let ayarlar = {};
            if (fs.existsSync(ayarlarPath)) {
                ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
            }

            // Sunucu için ayarları oluştur veya sıfırla
            ayarlar[interaction.guild.id] = {
                logChannelId: logKanali.id,
                questions: [] // Soruları boş bir dizi olarak başlat
            };

            fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 2));

            await interaction.reply({ 
                content: `✅ Yetkili başvuru sistemi başarıyla kuruldu ve sıfırlandı. Başvurular artık ${logKanali} kanalına gönderilecek. Lütfen soruları eklemek için \`/başvuru-soru-ekle\` komutunu kullanın.`,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Başvuru sistemi kurulurken hata oluştu:', error);
            await interaction.reply({ 
                content: '❌ Ayarlar kaydedilirken bir hata oluştu. Lütfen dosya izinlerini kontrol edin.',
                ephemeral: true 
            });
        }
    },
};
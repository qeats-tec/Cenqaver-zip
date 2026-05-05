const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '../başvuru-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('başvuru-soru-ekle')
        .setDescription('Yetkili başvuru formuna yeni bir soru ekler.')
        .addStringOption(option =>
            option.setName('soru')
                .setDescription('Forma eklenecek soru metni.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const yeniSoru = interaction.options.getString('soru');

        try {
            let ayarlar = {};
            if (fs.existsSync(ayarlarPath)) {
                ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
            } else {
                return interaction.reply({ content: '❌ Başvuru sistemi kurulu değil. Lütfen önce `/başvuru-sistemi-kur` komutunu kullanın.', ephemeral: true });
            }

            const guildAyarlari = ayarlar[interaction.guild.id];
            if (!guildAyarlari) {
                return interaction.reply({ content: '❌ Başvuru sistemi bu sunucuda kurulu değil. Lütfen önce `/başvuru-sistemi-kur` komutunu kullanın.', ephemeral: true });
            }

            if (guildAyarlari.questions.length >= 5) {
                return interaction.reply({ content: '❌ Başvuru formuna en fazla 5 soru ekleyebilirsiniz. Bu, Discord API sınırlamasıdır.', ephemeral: true });
            }

            // Soruyu ekle
            guildAyarlari.questions.push(yeniSoru);

            fs.writeFileSync(ayarlarPath, JSON.stringify(ayarlar, null, 2));

            await interaction.reply({ 
                content: `✅ Soru başarıyla eklendi. Mevcut soru sayısı: **${guildAyarlari.questions.length}/5**`,
                ephemeral: true 
            });

        } catch (error) {
            console.error('Başvuru sorusu eklenirken hata oluştu:', error);
            await interaction.reply({ 
                content: '❌ Soru eklenirken bir hata oluştu.',
                ephemeral: true 
            });
        }
    },
};
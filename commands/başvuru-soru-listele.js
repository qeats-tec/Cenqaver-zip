const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '../başvuru-ayarlar.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('başvuru-soru-listele')
        .setDescription('Başvuru formundaki tüm mevcut soruları listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            let ayarlar = {};
            if (fs.existsSync(ayarlarPath)) {
                ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
            }

            const guildAyarlari = ayarlar[interaction.guild.id];
            if (!guildAyarlari || !guildAyarlari.questions || guildAyarlari.questions.length === 0) {
                return interaction.reply({ content: 'ℹ️ Başvuru formunda hiç soru bulunmuyor. Eklemek için `/başvuru-soru-ekle` komutunu kullanın.', ephemeral: true });
            }

            const sorular = guildAyarlari.questions;
            const description = sorular.map((soru, index) => `**${index + 1}.** ${soru}`).join('\n');

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('📋 Yetkili Başvuru Formu Soruları')
                .setDescription(description)
                .setFooter({ text: `Toplam ${sorular.length}/5 soru mevcut.` });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Başvuru soruları listelenirken hata oluştu:', error);
            await interaction.reply({ 
                content: '❌ Sorular listelenirken bir hata oluştu.',
                ephemeral: true 
            });
        }
    },
};
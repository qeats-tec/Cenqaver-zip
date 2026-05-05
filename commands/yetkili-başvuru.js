const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ayarlarPath = path.join(__dirname, '../başvuru-ayarlar.json');

// Her soru için benzersiz bir customId oluşturmak için basit bir fonksiyon
const generateCustomId = (base, index) => `${base}_${index}`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yetkili-başvuru')
        .setDescription('Sunucu için yetkili başvurusunda bulunur.'),

    async execute(interaction) {
        let ayarlar = {};
        if (fs.existsSync(ayarlarPath)) {
            ayarlar = JSON.parse(fs.readFileSync(ayarlarPath, 'utf-8'));
        }

        const guildAyarlari = ayarlar[interaction.guild.id];
        if (!guildAyarlari || !guildAyarlari.logChannelId) {
            return interaction.reply({ content: '❌ Bu sunucuda başvuru sistemi ayarlanmamış.', ephemeral: true });
        }

        if (!guildAyarlari.questions || guildAyarlari.questions.length === 0) {
            return interaction.reply({ content: 'ℹ️ Başvuru formu için henüz soru eklenmemiş. Lütfen bir yetkiliye bildirin.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(`yetkiliBasvuruModal_${interaction.guild.id}`)
            .setTitle('Yetkili Başvuru Formu');

        // Ayarlardan gelen sorularla modalı dinamik olarak oluştur
        const actionRows = guildAyarlari.questions.map((soru, index) => {
            const textInput = new TextInputBuilder()
                .setCustomId(generateCustomId('soru', index))
                .setLabel(soru) // Sorunun kendisi label
                .setStyle(TextInputStyle.Paragraph) // Uzun cevaplar için
                .setRequired(true);
            return new ActionRowBuilder().addComponents(textInput);
        });

        modal.addComponents(actionRows);

        await interaction.showModal(modal);
        
        const filter = (i) => i.customId === `yetkiliBasvuruModal_${interaction.guild.id}` && i.user.id === interaction.user.id;
        
        try {
            const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 600_000 }); // 10 dakika

            const logChannel = await interaction.guild.channels.fetch(guildAyarlari.logChannelId).catch(() => null);
            if (!logChannel) {
                return modalInteraction.reply({ content: '❌ Başvuru log kanalı bulunamadı, lütfen yöneticiye bildirin.', ephemeral: true });
            }

            // Cevapları topla
            const cevaplar = guildAyarlari.questions.map((_, index) => {
                const customId = generateCustomId('soru', index);
                return modalInteraction.fields.getTextInputValue(customId);
            });

            const basvuruEmbed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✨ Yeni Yetkili Başvurusu')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .setFooter({ text: `Kullanıcı ID: ${interaction.user.id}` })
                .setTimestamp();

            // Başvuran bilgisi
            basvuruEmbed.addFields({ name: 'Başvuran', value: `${interaction.user} (||${interaction.user.id}||)`, inline: false });

            // Soruları ve Cevapları ekle
            guildAyarlari.questions.forEach((soru, index) => {
                basvuruEmbed.addFields({ name: `❓ ${soru}`, value: `💬 ${cevaplar[index]}`, inline: false });
            });

            await logChannel.send({ embeds: [basvuruEmbed] });
            await modalInteraction.reply({ content: '✅ Başvurunuz başarıyla alındı ve yetkililere iletildi!', ephemeral: true });

        } catch (error) {
            if (error.code !== 'InteractionCollectorError') {
                 console.error('Başvuru modal işlenirken hata:', error);
            }
        }
    },
};
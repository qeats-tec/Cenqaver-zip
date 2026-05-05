const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const stickyMessagesPath = path.join(__dirname, '..', 'sticky-messages.json');

// Yardımcı fonksiyon: Ayarları dosyadan oku
function getStickyMessages() {
    try {
        if (fs.existsSync(stickyMessagesPath)) {
            const data = fs.readFileSync(stickyMessagesPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('sticky-messages.json okunurken hata:', error);
    }
    return { stickyMessages: {} };
}

// Yardımcı fonksiyon: Ayarları dosyaya yaz
function saveStickyMessages(data) {
    try {
        fs.writeFileSync(stickyMessagesPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('sticky-messages.json yazılırken hata:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yapistir')
        .setDescription('Bu kanala yapışkan bir mesaj ekler veya kaldırır. (Yönetici Yetkisi Gerekir)')
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Kanala sabitlenecek yapışkan mesajın içeriği.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('kaldir')
                .setDescription('Bu kanaldaki yapışkan mesajı kaldırır.')
                .setRequired(false)),

    async execute(interaction) {
        // Yetki kontrolünü "Yönetici" olarak güncelle
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için "Yönetici" yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const channelId = interaction.channel.id;
        const messageContent = interaction.options.getString('mesaj');
        const shouldRemove = interaction.options.getBoolean('kaldir');

        const stickyData = getStickyMessages();

        await interaction.deferReply({ ephemeral: true });

        // Önceki yapışkan mesajı (varsa) sil
        if (stickyData.stickyMessages[channelId] && stickyData.stickyMessages[channelId].botMessageId) {
            try {
                const oldMessage = await interaction.channel.messages.fetch(stickyData.stickyMessages[channelId].botMessageId);
                await oldMessage.delete();
            } catch (error) {
                console.log('Eski yapışkan mesaj silinemedi (muhtemelen zaten silinmiş).');
            }
        }

        if (shouldRemove) {
            if (stickyData.stickyMessages[channelId]) {
                delete stickyData.stickyMessages[channelId];
                saveStickyMessages(stickyData);
                // client.stickyMessages cache'ini de temizle
                interaction.client.stickyMessages.delete(channelId);
                await interaction.editReply('Bu kanaldaki yapışkan mesaj başarıyla kaldırıldı.');
            } else {
                await interaction.editReply('Bu kanalda zaten ayarlı bir yapışkan mesaj yok.');
            }
            return;
        }

        if (messageContent) {
            const sentMessage = await interaction.channel.send(messageContent);
            const newSticky = {
                messageContent: messageContent,
                botMessageId: sentMessage.id,
            };
            stickyData.stickyMessages[channelId] = newSticky;
            saveStickyMessages(stickyData);
            // client.stickyMessages cache'ini de güncelle
            interaction.client.stickyMessages.set(channelId, newSticky);
            await interaction.editReply('Yapışkan mesaj başarıyla ayarlandı!');
        } else {
            if (stickyData.stickyMessages[channelId]) {
                 await interaction.editReply(`Bu kanalda zaten bir yapışkan mesaj ayarlı. İçerik: "${stickyData.stickyMessages[channelId].messageContent}"`);
            } else {
                 await interaction.editReply('Yeni bir mesaj ayarlamak için `mesaj` seçeneğini kullanın veya kaldırmak için `kaldir` seçeneğini `true` yapın.');
            }
        }
    },
};

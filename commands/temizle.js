const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('temizle')
        .setDescription('Kanaldan belirtilen sayıda mesajı siler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100).')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Sadece belirli bir kullanıcının mesajlarını sil.')
                .setRequired(false)),

    async execute(interaction) {
        // Yetki kontrolleri (ekstra güvenlik)
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için `Mesajları Yönet` iznine sahip olmalısın.', ephemeral: true });
        }
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: 'Mesajları silmek için `Mesajları Yönet` iznim yok.', ephemeral: true });
        }

        const amount = interaction.options.getInteger('miktar');
        const targetUser = interaction.options.getUser('kullanıcı');

        await interaction.deferReply({ ephemeral: true }); // İşlemin uzun sürebileceğini belirt

        try {
            let messagesToDelete;
            const messages = await interaction.channel.messages.fetch({ limit: amount });

            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            } else {
                messagesToDelete = messages;
            }
            
            // 14 günden eski mesajları filtrele (bulkDelete bunları silemez)
            const oldMessages = messagesToDelete.filter(msg => (Date.now() - msg.createdTimestamp) > 1209600000); // 14 gün (ms cinsinden)
            if (oldMessages.size > 0) {
                 return interaction.editReply({ content: `Hata: 14 günden eski mesajları toplu olarak silemem. Lütfen daha küçük bir miktar deneyin veya daha yeni mesajları hedefleyin.`, ephemeral: true });
            }
            
            if (messagesToDelete.size === 0) {
                let response = `Son ${amount} mesaj içinde silinecek mesaj bulunamadı.`;
                if(targetUser) response = `Son ${amount} mesaj içinde **${targetUser.tag}** adlı kullanıcıya ait mesaj bulunamadı.`;
                return interaction.editReply({ content: response, ephemeral: true });
            }

            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            const successEmbed = new EmbedBuilder()
                .setColor(0x57F287) // Yeşil
                .setTitle('✅ Mesajlar Silindi')
                .setDescription(`**${deletedMessages.size}** adet mesaj başarıyla silindi.`)
                .addFields(
                    { name: 'Kanal', value: interaction.channel.toString(), inline: true },
                    { name: 'Moderatör', value: interaction.user.toString(), inline: true },
                )
                .setTimestamp();

            if (targetUser) {
                successEmbed.addFields({ name: 'Hedef Kullanıcı', value: targetUser.toString(), inline: true });
            }

            // Onay mesajını gönder ve 5 saniye sonra sil
            const replyMessage = await interaction.channel.send({ embeds: [successEmbed] });
            setTimeout(() => replyMessage.delete().catch(console.error), 5000);
            
            // Ephemeral yanıtı da onayla
            await interaction.editReply({ content: 'İşlem tamamlandı.', ephemeral: true });

        } catch (error) {
            console.error('Mesaj silme sırasında hata:', error);
            await interaction.editReply({ content: 'Mesajlar silinirken bir hata oluştu. Genellikle bu, 14 günden eski mesajları silmeye çalışmaktan kaynaklanır.', ephemeral: true });
        }
    },
};
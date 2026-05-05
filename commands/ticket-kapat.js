const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ticketInfo } = require('../state.js');
const { logTicket } = require('../utils/loglama.js'); // Loglama fonksiyonunu import et

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-kapat')
        .setDescription('Mevcut destek talebini (ticket) bir sebep belirterek kapatır.')
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Ticket\'ı kapatma sebebiniz.')
                .setRequired(true)),

    async execute(interaction) {
        const channel = interaction.channel;
        const sebep = interaction.options.getString('sebep');

        if (!channel.name.startsWith('ticket-') || !ticketInfo.has(channel.id)) {
            return interaction.reply({ content: 'Bu komut sadece bir destek kanalında kullanılabilir.', ephemeral: true });
        }

        try {
            // Önce logla, sonra işlemi yap
            await logTicket(interaction, 'Kapatıldı', channel, sebep);

            const ticketCreatorId = ticketInfo.get(channel.id)?.ownerId;
            if (ticketCreatorId) {
                const ticketCreator = await interaction.client.users.fetch(ticketCreatorId).catch(() => null);
                if (ticketCreator) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle('Destek Talebiniz Kapatıldı')
                        .setDescription(`**${interaction.guild.name}** sunucusundaki destek talebiniz bir yetkili tarafından kapatıldı.`)
                        .addFields(
                            { name: 'Kapatan Yetkili', value: interaction.user.tag, inline: true },
                            { name: 'Kapatma Sebebi', value: sebep, inline: true }
                        )
                        .setTimestamp();
                    await ticketCreator.send({ embeds: [dmEmbed] }).catch(() => 
                        console.log(`[BİLGİ] Ticket sahibi ${ticketCreator.tag} DM gönderilemedi.`)
                    );
                }
            }

            await interaction.reply({ content: 'Destek kanalı 5 saniye içinde güvenli bir şekilde silinecek...', ephemeral: true });

            // State'den bilgiyi sil
            ticketInfo.delete(channel.id);

            // 5 saniye sonra kanalı sil
            setTimeout(() => {
                channel.delete().catch(e => console.error(`Ticket kanalı silinemedi (ID: ${channel.id}). Sebep:`, e));
            }, 5000);

        } catch (error) {
            console.error('Ticket kapatma işlemi sırasında bir hata oluştu:', error);
            await interaction.followUp({ content: 'Kanal kapatılırken beklenmedik bir hata oluştu.', ephemeral: true }).catch(() => {});
        }
    },
};
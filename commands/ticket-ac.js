
const { SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ticketInfo } = require('../state.js');

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
    return { settings: {} };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-ac')
        .setDescription('Yeni bir destek talebi (ticket) oluşturur.')
        .addStringOption(option =>
            option.setName('konu')
                .setDescription('Destek talebinizin konusu')
                .setRequired(true)),

    async execute(interaction) {
        const konu = interaction.options.getString('konu');
        const guild = interaction.guild;
        const user = interaction.user;

        // Ayarları yükle
        const allSettings = getSettings();
        const guildSettings = allSettings.settings[guild.id] || {}; // Sunucuya özel ayarları al veya boş obje kullan

        const channelName = `ticket-${user.username}`.toLowerCase().replace(/\s+/g, '-');

        try {
            await interaction.reply({ content: 'Destek talebiniz oluşturuluyor...', ephemeral: true });

            // İzinleri dinamik olarak ayarla
            const permissionOverwrites = [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: user.id, // Ticket sahibi
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles],
                },
                {
                    id: interaction.client.user.id, // Bot
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.EmbedLinks],
                },
            ];

            // Ayarlanan destek rolüne izin ver
            if (guildSettings.destekRolId) {
                permissionOverwrites.push({
                    id: guildSettings.destekRolId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AttachFiles],
                });
            } else {
                 // Destek rolü ayarlı değilse, en azından adminlere izin ver
                 guild.roles.cache.filter(r => r.permissions.has(PermissionsBitField.Flags.Administrator)).forEach(r => {
                    permissionOverwrites.push({
                        id: r.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                    });
                });
            }

            // Kanal oluşturma seçenekleri
            const channelOptions = {
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites,
            };

            // Ayarlanan kategoriyi kullan
            if (guildSettings.kategoriId) {
                const category = guild.channels.cache.get(guildSettings.kategoriId);
                if (category && category.type === ChannelType.GuildCategory) {
                    channelOptions.parent = category.id;
                }
            }

            // Yeni kanalı oluştur
            const channel = await guild.channels.create(channelOptions);

            // Hoşgeldin mesajını ve pingleme işlemini yap
            let pingMessage = '';
            if (guildSettings.pingRolId) {
                pingMessage = `<@&${guildSettings.pingRolId}>, yeni bir destek talebi var!`;
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Destek Talebi: ${konu}`)
                .setDescription(`Merhaba ${user}, destek ekibimiz en kısa sürede sizinle ilgilenecektir.`)
                .setTimestamp();

            // Önce embed ve pingleme mesajını gönder
            await channel.send({ content: pingMessage, embeds: [embed] });

            // Sonra sabitlenecek mesajı gönder ve ID'sini kaydet
            const infoMsg = await channel.send('**Bu destek talebini kapatmak için `/ticket-kapat` yazabilirsiniz.**');
            ticketInfo.set(channel.id, infoMsg.id);

            await interaction.editReply({ content: `Destek talebiniz başarıyla oluşturuldu: ${channel}` });

        } catch (error) {
            console.error('Ticket oluşturma hatası:', error);
            await interaction.editReply({ content: 'Destek talebi oluşturulurken bir hata oluştu. Lütfen botun roller ve kanallar için gerekli izinlere sahip olduğundan emin olun.' });
        }
    },
};

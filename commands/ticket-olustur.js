const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { log } = require('../utils/logger.js'); // Log modülünü dahil et

const ticketsPath = path.join(__dirname, '..', 'tickets.json');

function getTickets() {
    if (!fs.existsSync(ticketsPath)) return {};
    const data = fs.readFileSync(ticketsPath, 'utf-8');
    return JSON.parse(data);
}

function saveTickets(data) {
    fs.writeFileSync(ticketsPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-olustur')
        .setDescription('Destek talebi oluşturmak için bir panel gönderir.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator) // Sadece yöneticiler kullanabilir
        .setDMPermission(false),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('Destek Talebi')
            .setDescription('Bir destek talebi oluşturmak için aşağıdaki butona tıklayın.')
            .setFooter({ text: `${interaction.guild.name} | Destek Sistemi` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Ticket Oluştur')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎫')
            );

        await interaction.reply({ 
            content: 'Ticket paneli başarıyla gönderildi!', 
            ephemeral: true 
        });

        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row] 
        });

        const filter = (i) => i.customId === 'create_ticket';
        const collector = interaction.channel.createMessageComponentCollector({ filter });

        collector.on('collect', async i => {
            await i.deferUpdate();
            const user = i.user;
            const guild = i.guild;

            const tickets = getTickets();
            const userTicket = Object.values(tickets).find(t => t.userId === user.id && t.status === 'open');

            if (userTicket) {
                try {
                    await user.send('Zaten açık bir destek talebiniz bulunuyor.');
                } catch (error) {
                    console.log(`${user.tag} adlı kullanıcıya DM gönderilemedi.`);
                }
                return;
            }
            
            const ticketId = `ticket-${Date.now()}`;
            const channel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles],
                    },
                    {
                        id: i.client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.EmbedLinks],
                    }
                ],
            });

            tickets[channel.id] = {
                channelId: channel.id,
                userId: user.id,
                status: 'open',
                createdAt: new Date().toISOString()
            };
            saveTickets(tickets);

            const ticketEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`Destek Talebi #${channel.name}`)
                .setDescription(`Hoş geldin ${user.toString()}! Lütfen sorununuzu detaylı bir şekilde açıklayın. En kısa sürede bir yetkili size yardımcı olacaktır.`)
                .setTimestamp();

            const closeButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close_ticket_${channel.id}`)
                        .setLabel('Talebi Kapat')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            await channel.send({ embeds: [ticketEmbed], components: [closeButton] });
            try {
                await user.send(`Destek talebiniz başarıyla oluşturuldu: ${channel.toString()}`);
            } catch (error) { 
                console.log(`${user.tag} adlı kullanıcıya DM gönderilemedi.`);
            }

            // --- YENİ LOGLAMA KISMI ---
            const logEmbed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('Ticket Oluşturuldu')
                .setDescription('Bir kullanıcı yeni bir destek talebi oluşturdu.')
                .addFields(
                    { name: 'Kullanıcı', value: `${user.tag} (${user.id})`, inline: false },
                    { name: 'Ticket Kanalı', value: channel.toString(), inline: false },
                    { name: 'Oluşturulma Zamanı', value: `<t:${parseInt(Date.now() / 1000)}:R>`, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await log(guild, 'ticket', logEmbed);
        });
    },
};
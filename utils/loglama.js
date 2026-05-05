const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

const logConfigPath = './log-ayarlar.json';

async function logCeza(interaction, hedef, ceza, sebep) {
    if (!fs.existsSync(logConfigPath)) return;
    const logConfig = JSON.parse(fs.readFileSync(logConfigPath, 'utf-8'));
    const guildLogConfig = logConfig[interaction.guild.id];
    if (!guildLogConfig || !guildLogConfig.cezaLogChannel) return;

    const logChannel = await interaction.guild.channels.fetch(guildLogConfig.cezaLogChannel).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Yeni Ceza Uygulandı')
        .setDescription(`**Yetkili:** <@${interaction.user.id}> (${interaction.user.tag})`) 
        .addFields(
            { name: 'Cezalandırılan Kullanıcı', value: `<@${hedef.id}> (${hedef.tag})`, inline: true },
            { name: 'Uygulanan Ceza', value: ceza, inline: true },
            { name: 'Sebep', value: sebep }
        )
        .setThumbnail(hedef.displayAvatarURL())
        .setTimestamp()
        .setFooter({ text: `Kullanıcı ID: ${hedef.id}` });

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Ceza logu gönderilemedi (Sunucu: ${interaction.guild.id}):`, error);
    }
}

/**
 * Bir ticket eylemini log kanalına gönderir.
 * @param {import('discord.js').Interaction} interaction - Etkileşim.
 * @param {string} action - Yapılan eylem (örn: Kapatıldı, Açıldı).
 * @param {import('discord.js').TextChannel} ticketChannel - Ticket kanalı.
 * @param {string} reason - Eylemin sebebi.
 */
async function logTicket(interaction, action, ticketChannel, reason) {
    if (!fs.existsSync(logConfigPath)) return;
    const logConfig = JSON.parse(fs.readFileSync(logConfigPath, 'utf-8'));
    const guildLogConfig = logConfig[interaction.guild.id];
    if (!guildLogConfig || !guildLogConfig.ticketLogChannel) return;

    const logChannel = await interaction.guild.channels.fetch(guildLogConfig.ticketLogChannel).catch(() => null);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(action === 'Kapatıldı' ? 'Yellow' : 'Green')
        .setTitle('Ticket Durumu Güncellendi')
        .addFields(
            { name: 'Ticket Kanalı', value: ticketChannel.name, inline: true },
            { name: 'Eylem', value: action, inline: true },
            { name: 'Yetkili', value: `<@${interaction.user.id}> (${interaction.user.tag})` },
            { name: 'Sebep', value: reason }
        )
        .setTimestamp()
        .setFooter({ text: `Ticket ID: ${ticketChannel.id}` });

     try {
        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Ticket logu gönderilemedi (Sunucu: ${interaction.guild.id}):`, error);
    }
}

module.exports = { logCeza, logTicket };

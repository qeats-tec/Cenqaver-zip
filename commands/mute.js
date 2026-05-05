const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Bir kullanıcıyı belirli bir süre susturur.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Susturulacak kullanıcı.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('sure')
                .setDescription('Susturma süresi (dakika cinsinden).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj-içeriği')
                .setDescription('Susturma mesajının içeriği.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('kullanici');
        const duration = interaction.options.getInteger('sure'); // Dakika
        const reason = interaction.options.getString('mesaj-içeriği') || 'Sebep belirtilmedi.';

        // Botun yetkisini kontrol et
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: 'Kullanıcıları susturmak için `Üyelere Zaman Aşımı Uygula` yetkim yok.', ephemeral: true });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id);

        if (!targetMember) {
            return interaction.reply({ content: 'Kullanıcı bu sunucuda bulunamadı.', ephemeral: true });
        }
        
        // Hedef kullanıcının susturulabilir olup olmadığını kontrol et
        if (!targetMember.moderatable) {
            return interaction.reply({ content: 'Bu kullanıcıyı susturamam. Rolü benden yüksek veya sahip olduğum yetkilerin dışında.', ephemeral: true });
        }

        const durationInMs = duration * 60 * 1000;
        // Discord API limiti 28 gün
        if(durationInMs > 2419200000) {
             return interaction.reply({ content: 'Susturma süresi 28 günden fazla olamaz.', ephemeral: true });
        }

        try {
            await targetMember.timeout(durationInMs, reason);
            await interaction.reply(`\`${targetUser.tag}\` kullanıcısı ${duration} dakika boyunca \`${reason}\` sebebiyle susturuldu.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Kullanıcıyı sustururken bir hata oluştu.', ephemeral: true });
        }
    },
};
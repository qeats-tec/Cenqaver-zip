const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilit')
        .setDescription('Bulunduğunuz kanalı @everyone için kilitler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),

    async execute(interaction) {
        const channel = interaction.channel;

        // Sadece metin kanallarında çalışmasını sağla
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Bu komut sadece metin kanallarında kullanılabilir.', ephemeral: true });
        }

        // Botun yetkisini kontrol et
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'Kanalları yönetmek için `Kanalları Yönet` iznim yok.', ephemeral: true });
        }

        try {
            // @everyone rolünün mevcut izinlerini al
            const everyoneRole = interaction.guild.roles.everyone;
            const currentPermissions = channel.permissionsFor(everyoneRole);

            // Zaten mesaj gönderemiyorlarsa bir şey yapma (yani kilitliyse)
            if (!currentPermissions.has(PermissionFlagsBits.SendMessages)) {
                const alreadyLockedEmbed = new EmbedBuilder()
                    .setColor(0xFFA500) // Turuncu
                    .setTitle('Kanal Zaten Kilitli')
                    .setDescription(`**${channel.name}** kanalı zaten kilitli durumda.`);
                return interaction.reply({ embeds: [alreadyLockedEmbed], ephemeral: true });
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            });

            const successEmbed = new EmbedBuilder()
                .setColor(0xED4245) // Kırmızı
                .setTitle('🔒 Kanal Kilitlendi')
                .setDescription(`**${channel.name}** kanalı **${interaction.user.tag}** tarafından kilitlendi. Artık @everyone rolüne sahip kimse mesaj gönderemez.`)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Kanal kilitlenirken bir hata oluştu:', error);
            await interaction.reply({ content: 'Kanal kilitlenirken bir hata oluştu. Lütfen yetkilerimi kontrol edin.', ephemeral: true });
        }
    },
};
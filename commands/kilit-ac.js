const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilit-aç')
        .setDescription('Bulunduğunuz kanalın kilidini açar ve herkesin mesaj göndermesine izin verir.')
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

            // Zaten mesaj gönderebiliyorlarsa bir şey yapma
            if (currentPermissions.has(PermissionFlagsBits.SendMessages)) {
                const alreadyUnlockedEmbed = new EmbedBuilder()
                    .setColor(0xFFA500) // Turuncu
                    .setTitle('Kanal Zaten Açık')
                    .setDescription(`**${channel.name}** kanalı zaten herkesin kullanımına açık.`);
                return interaction.reply({ embeds: [alreadyUnlockedEmbed], ephemeral: true });
            }

            await channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: true
            });

            const successEmbed = new EmbedBuilder()
                .setColor(0x57F287) // Yeşil
                .setTitle('🔓 Kanal Kilidi Açıldı')
                .setDescription(`**${channel.name}** kanalının kilidi **${interaction.user.tag}** tarafından açıldı. Artık herkes mesaj gönderebilir.`)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Kanal kilidi açılırken bir hata oluştu:', error);
            await interaction.reply({ content: 'Kanalın kilidini açarken bir hata oluştu. Lütfen yetkilerimi kontrol edin.', ephemeral: true });
        }
    },
};
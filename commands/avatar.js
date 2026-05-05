const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Bir kullanıcının avatarını veya sunucu profil resmini gösterir.')
        .addUserOption(option =>
            option.setName('kullanıcı')
                .setDescription('Avatarı gösterilecek kullanıcı.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('sunucu_avatarı')
                .setDescription('Kullanıcının sunucuya özel avatarını gösterir.')
                .setRequired(false)),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getUser('kullanıcı') || interaction.user;
            const showServerAvatar = interaction.options.getBoolean('sunucu_avatarı');

            let avatarUrl;
            let avatarTypeTitle;
            
            if (showServerAvatar) {
                const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
                avatarUrl = member ? member.displayAvatarURL({ dynamic: true, size: 512 }) : targetUser.displayAvatarURL({ dynamic: true, size: 512 });
                avatarTypeTitle = `${targetUser.username} adlı kullanıcının sunucu avatarı`;
            } else {
                avatarUrl = targetUser.displayAvatarURL({ dynamic: true, size: 512 });
                avatarTypeTitle = `${targetUser.username} adlı kullanıcının avatarı`;
            }
            
            const fullSizeUrl = avatarUrl.replace('size=512', 'size=4096');

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(avatarTypeTitle)
                .setImage(avatarUrl)
                .setTimestamp()
                .setFooter({ text: `İsteyen: ${interaction.user.tag}` });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Tam Boyut')
                        .setStyle(ButtonStyle.Link)
                        .setURL(fullSizeUrl),
                );

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error("Avatar komutunda bir hata oluştu:", error);
            await interaction.reply({ content: 'Avatar gösterilirken bir hata oluştu.' });
        }
    },
};
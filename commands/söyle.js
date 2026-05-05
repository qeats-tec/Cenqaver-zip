const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('söyle')
        .setDescription('Bota istediğiniz mesajı söyletir. (Yönetici Yetkisi Gerekir)')
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Botun kanala göndereceği mesaj.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // Sadece yöneticiler kullanabilir

    async execute(interaction) {
        // Yetkiyi tekrar kontrol et (isteğe bağlı ama iyi bir pratik)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için "Yönetici" yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const messageToSend = interaction.options.getString('mesaj');

        // Komutu kullanan kişiye gizli bir onay mesajı gönder
        await interaction.reply({ content: 'Mesajın gönderildi!', ephemeral: true });

        // Botun asıl mesajı kanala göndermesini sağla
        await interaction.channel.send(messageToSend);
    },
};

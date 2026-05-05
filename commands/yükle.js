const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Gecikme fonksiyonu
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yükle')
        .setDescription('Sunucu yapısını yedekten geri yükler. DİKKAT: Tüm kanalları siler! (Sadece Sunucu Sahibi)')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ content: 'Bu komutu yalnızca sunucu sahibi kullanabilir.', ephemeral: true });
        }

        const backupFilePath = path.join(__dirname, '..', 'sunucu-yedek.json');

        if (!fs.existsSync(backupFilePath)) {
            return interaction.reply({ content: '❌ Geri yüklenecek bir yedek dosyası (`sunucu-yedek.json`) bulunamadı. Lütfen önce `/kaydet` komutunu kullanın.', ephemeral: true });
        }

        await interaction.reply({ content: '⚠️ **DİKKAT!** Bu işlem sunucudaki **tüm** kanalları ve rolleri silecek ve yedekten geri yükleyecektir. Bu işlem geri alınamaz. Devam etmek istediğinizden eminseniz 5 saniye içinde işlem başlayacak.', ephemeral: true });

        await delay(5000); // Kullanıcının mesajı okuması için kısa bir bekleme
        await interaction.editReply({ content: '⏳ Sunucu geri yükleme işlemi başlatılıyor...' });

        try {
            const backup = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
            const guild = interaction.guild;

            // 1. Mevcut tüm kanalları sil
            await interaction.followUp({ content: '🔄 Mevcut kanallar siliniyor...', ephemeral: true });
            for (const channel of guild.channels.cache.values()) {
                try {
                    await channel.delete('Sunucu yedekten geri yükleniyor.');
                    await delay(250); // Rate limit yememek için küçük bir gecikme
                } catch (error) {
                    console.error(`Kanal silinemedi: ${channel.name}`, error);
                }
            }

            // 2. Mevcut tüm rolleri sil (yönetilenler ve @everyone hariç)
            await interaction.followUp({ content: '🔄 Mevcut roller siliniyor...', ephemeral: true });
            for (const role of guild.roles.cache.values()) {
                if (!role.managed && role.name !== '@everyone') {
                    try {
                        await role.delete('Sunucu yedekten geri yükleniyor.');
                        await delay(250);
                    } catch (error) {
                        console.error(`Rol silinemedi: ${role.name}`, error);
                    }
                }
            }
            
            await interaction.followUp({ content: '✅ Eski yapı temizlendi. Şimdi yedekten oluşturuluyor...', ephemeral: true });

            const roleIdMap = new Map();

            // 3. Rolleri geri yükle
            await interaction.followUp({ content: '🔄 Roller oluşturuluyor...', ephemeral: true });
            for (const roleData of backup.roles) {
                try {
                    const newRole = await guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        permissions: BigInt(roleData.permissions),
                        mentionable: roleData.mentionable,
                        reason: 'Yedekten geri yükleme'
                    });
                    roleIdMap.set(roleData.id, newRole.id);
                    await delay(250);
                } catch (error) {
                    console.error(`Rol oluşturulamadı: ${roleData.name}`, error);
                }
            }

            // 4. Kategorileri ve kanalları geri yükle
            await interaction.followUp({ content: '🔄 Kanallar ve kategoriler oluşturuluyor...', ephemeral: true });
            const categoryIdMap = new Map();

            for (const categoryData of backup.categories) {
                try {
                    const newCategory = await guild.channels.create({
                        name: categoryData.name,
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: categoryData.permissionOverwrites.map(perm => ({
                            id: perm.type === 'role' ? roleIdMap.get(perm.id) : perm.id,
                            allow: BigInt(perm.allow),
                            deny: BigInt(perm.deny)
                        })).filter(p => p.id) // Eksik ID'leri filtrele
                    });
                    categoryIdMap.set(categoryData.id, newCategory.id);
                    await delay(250);
                } catch (error) {
                    console.error(`Kategori oluşturulamadı: ${categoryData.name}`, error);
                }
            }

            for (const channelData of backup.channels) {
                try {
                    const newChannel = await guild.channels.create({
                        name: channelData.name,
                        type: channelData.type,
                        parent: channelData.parentId ? categoryIdMap.get(channelData.parentId) : null,
                        topic: channelData.topic,
                        nsfw: channelData.nsfw,
                        rateLimitPerUser: channelData.rateLimitPerUser,
                        bitrate: channelData.bitrate,
                        userLimit: channelData.userLimit,
                        permissionOverwrites: channelData.permissionOverwrites.map(perm => ({
                            id: perm.type === 'role' ? roleIdMap.get(perm.id) : perm.id,
                            allow: BigInt(perm.allow),
                            deny: BigInt(perm.deny)
                        })).filter(p => p.id)
                    });
                    await delay(250);
                } catch (error) {
                    console.error(`Kanal oluşturulamadı: ${channelData.name}`, error);
                }
            }

            await interaction.followUp({ content: '✅ Sunucu başarıyla yedekten geri yüklendi!', ephemeral: true });

        } catch (error) {
            console.error('Geri yükleme hatası:', error);
            await interaction.followUp({ content: '❌ Geri yükleme sırasında kritik bir hata oluştu. Sunucu istenmeyen bir durumda olabilir. Lütfen konsol loglarını kontrol edin.', ephemeral: true });
        }
    },
};
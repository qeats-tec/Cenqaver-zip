const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// --- Veritabanı ve Ayar Dosyası Yolları ---
const dbPath = path.join(__dirname, '..', 'economy.sqlite');
const marketAyarPath = path.join(__dirname, '..', 'market-ayarlar.json');

// --- Ekonomi Veritabanı İşlemleri için Yardımcı Fonksiyonlar ---
const getBalance = (userId) => {
    const db = new sqlite3.Database(dbPath);
    return new Promise((resolve, reject) => {
        db.get('SELECT balance FROM users WHERE user_id = ?', [userId], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.balance : 0);
        });
        db.close();
    });
};

const updateBalance = (userId, newBalance) => {
    const db = new sqlite3.Database(dbPath);
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET balance = ? WHERE user_id = ?', [newBalance, userId], function(err) {
            if (err) return reject(err);
            // Eğer kullanıcı yoksa yeni kayıt oluştur
            if (this.changes === 0) {
                db.run('INSERT INTO users (user_id, balance) VALUES (?, ?)', [userId, newBalance], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            } else {
                resolve();
            }
        });
        db.close();
    });
};


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // --- 1. Slash Komutu İşleyicisi ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`${interaction.commandName} adında bir komut bulunamadı.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`KOMUT YÜRÜTME HATASI (${interaction.commandName}):`, error);
                const errorMessage = { content: 'Bu komutu yürütürken bir hata oluştu!', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
            return; // Komut işlendikten sonra fonksiyonu sonlandır
        }

        // --- 2. Market Menüsü İşleyicisi ---
        if (interaction.isStringSelectMenu() && interaction.customId === 'market_select_menu') {
            await interaction.deferReply({ ephemeral: true });

            const selectedItemId = interaction.values[0].replace('market_item_', '');
            const guildId = interaction.guild.id;
            const userId = interaction.user.id;

            // Ayarları ve ürünü bul
            const ayarlar = JSON.parse(fs.readFileSync(marketAyarPath, 'utf-8'));
            const sunucuMarket = ayarlar[guildId];
            if (!sunucuMarket) {
                return interaction.editReply('Bu sunucunun market ayarları bulunamadı.');
            }

            const item = sunucuMarket.items.find(i => i.id === selectedItemId);
            if (!item) {
                return interaction.editReply('Seçtiğiniz ürün artık markette mevcut değil.');
            }

            // Satın alma onayı için embed ve düğmeler oluştur
            const confirmEmbed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('Satın Alma Onayı')
                .setDescription(`**${item.name}** adlı ürünü **${item.price} 🪙** karşılığında satın almak istediğinizden emin misiniz?`)
                .addFields({ name: 'Mevcut Bakiyeniz', value: `${await getBalance(userId)} 🪙` })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm_purchase_${item.id}`)
                        .setLabel('Evet, Onayla')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_purchase')
                        .setLabel('Hayır, İptal Et')
                        .setStyle(ButtonStyle.Danger),
                );

            await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
        }

        // --- 3. Satın Alma Onay/İptal Düğmesi İşleyicisi ---
        if (interaction.isButton()) {
            const [action, ...args] = interaction.customId.split('_');

            // İptal düğmesi
            if (action === 'cancel' && args[0] === 'purchase') {
                await interaction.update({ content: 'Satın alma işlemi iptal edildi.', embeds: [], components: [] });
                return;
            }

            // Onay düğmesi
            if (action === 'confirm' && args[0] === 'purchase') {
                await interaction.deferUpdate(); // Butona basıldığını Discord'a bildir

                const itemId = args[1];
                const guildId = interaction.guild.id;
                const userId = interaction.user.id;
                const member = interaction.member;

                const ayarlar = JSON.parse(fs.readFileSync(marketAyarPath, 'utf-8'));
                const item = ayarlar[guildId]?.items.find(i => i.id === itemId);

                if (!item) {
                    return interaction.editReply({ content: 'Bu ürün artık mevcut değil.', embeds: [], components: [] });
                }

                const userBalance = await getBalance(userId);

                if (userBalance < item.price) {
                    return interaction.editReply({ content: `Yetersiz bakiye! Bu ürünü almak için **${item.price - userBalance}** 🪙 daha biriktirmelisiniz.`, embeds: [], components: [] });
                }

                // --- Satın Alma Mantığı ---
                try {
                    // 1. Rol satın alma
                    if (item.type === 'role') {
                        const role = await interaction.guild.roles.fetch(item.roleId);
                        if (role) {
                            if (member.roles.cache.has(role.id)) {
                                return interaction.editReply({ content: 'Bu role zaten sahipsiniz!', embeds: [], components: [] });
                            }
                            await member.roles.add(role);
                        } else {
                           throw new Error(`Rol (ID: ${item.roleId}) sunucuda bulunamadı.`);
                        }
                    }
                    
                    // 2. Bakiye Güncelleme
                    await updateBalance(userId, userBalance - item.price);

                    // 3. Başarı Mesajı
                    const successEmbed = new EmbedBuilder()
                        .setColor('#2ecc71')
                        .setTitle('✅ Satın Alma Başarılı!')
                        .setDescription(`**${item.name}** ürününü başarıyla satın aldınız.`)
                        .addFields({ name: 'Yeni Bakiyeniz', value: `${userBalance - item.price} 🪙` })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [successEmbed], components: [] });

                    // 4. Log Kanalına Bildirim (varsa)
                    const logChannelId = ayarlar[guildId]?.logChannelId;
                    if (logChannelId) {
                        const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setColor('#3498db')
                                .setTitle('🛒 Market Alışveriş Logu')
                                .setDescription(`**${interaction.user.tag}** adlı kullanıcı bir ürün satın aldı.`)
                                .addFields(
                                    { name: 'Kullanıcı', value: `<@${userId}>`, inline: true },
                                    { name: 'Ürün', value: item.name, inline: true },
                                    { name: 'Fiyat', value: `${item.price} 🪙`, inline: true }
                                )
                                .setTimestamp();
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                } catch (error) {
                    console.error('SATIN ALMA İŞLEMİ HATASI:', error);
                    await interaction.editReply({ content: `Satın alma sırasında bir hata oluştu: ${error.message}`, embeds: [], components: [] });
                }
            }
        }
    },
};

const Discord = require('discord.js');


module.exports.run = (client, sql, serverInfo, inDevelopment) => {
    client.user.setActivity("music", {type: "LISTENING"})
    console.log("Music Maistro online & ready to serve!")
    
    sql.all(`select * from guilds`).then(rows => {
        rows.forEach(row => {

            serverInfo[row.guildID] = {
                guildId: row.guildID,
                prefix: row.prefix,
                textChannel: row.musicChannelID,
                voiceChannel: row.vchannel,
                maxTime: row.maxtime,
                modRole: row.musicModRole,
                playlistsAllowed: row.playlists,
                voteSkips: [],
                banned: []
            };

            if (!client.guilds.get(row.guildID)) {
                console.log("Server not found")
                return sql.run(`delete from guilds where guildID = '${row.guildID}'`);
            }

            if (!client.guilds.get(row.guildID).channels.get(row.musicChannelID)) {
                console.log("Music Channel Not Found")
                return sql.run(`delete from guilds where guildID = '${row.guildID}'`);
            }

            if(!client.guilds.get(row.guildID).me.permissionsIn(row.musicChannelID).has("VIEW_CHANNEL")) {
                console.log("No permission to read channel")
                return sql.run(`delete from guilds where guildID = '${row.guildID}'`);
            }

            sql.all(`select * from banned where ServerID = '${row.guildID}'`).then(rows => {
                for (let i = 0; i < rows.length; i++) {
                    serverInfo[row.guildID].banned.push(rows[i].DiscordID);
                }
            })

            client.guilds.get(row.guildID).channels.get(row.musicChannelID).messages.fetch().then(messages => {
                client.guilds.get(row.guildID).channels.get(row.musicChannelID).bulkDelete(messages)

                if (inDevelopment && row.guildID != "307576323776446465") {
                    //If in development mode let's make a notice to the user
                    client.guilds.get(row.guildID).channels.get(row.musicChannelID).send("**__The bot is currently in maintenance. It will be back online soon!__**")
                
                } else {
                    //Otherwise load the bot as usual
                    client.guilds.get(row.guildID).channels.get(row.musicChannelID).send('', new Discord.MessageAttachment("http://polliedev.com/assets/img/banner.png", "banner.png")).then(m => {
                        const embed = new Discord.MessageEmbed()
                        .setColor([255,0,0])
                        .setImage('https://i.ytimg.com/vi/l1aNN9FzbFg/maxresdefault.jpg')
                        .setTitle('No song playing currently')
                        .setFooter(`Prefix for this server is ` + "`" + row.prefix +"`")
                        client.guilds.get(row.guildID).channels.get(row.musicChannelID).send(embed).then(playingMessage => {
                            serverInfo[row.guildID].playingMessage = playingMessage;
                            client.guilds.get(row.guildID).channels.get(row.musicChannelID).send('', new Discord.MessageAttachment("http://polliedev.com/assets/img/line.png")).then(mm => {
                                client.guilds.get(row.guildID).channels.get(row.musicChannelID).send("**__Queue list:__**").then(queueMessage => {
                                    serverInfo[row.guildID].queueMessage = queueMessage;
                                })
                            })
                        });
                    })
                }
            });
        });
    })
}
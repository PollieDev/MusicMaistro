module.exports.run = (client, message, serverInfo, servers, sql, dev) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.author.id == dev) {
        message.channel.send(`Please provide me a prefix you would like to for use my commands, ${message.member}`).then(m => {
            const filter = m => m.author.id == message.author.id;
            message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                .then(async collected1 => {

                    message.delete();
                    m.delete();
                    collected1.first().delete();

                    var chosenPrefix = collected1.first().content;
                    var chosenChannel;
                    var chosenRole;

                    var fault = false;
                    var channelMSG;
                    var roleMSG;

                    if (message.guild.me.hasPermission('MANAGE_CHANNELS')) {
                        channelMSG = ":white_check_mark: I have the permission to create the music channel"
                    } else {
                        channelMSG = ":x: I do not have the permission to create the music channel"
                        fault = true;
                    }

                    if (message.guild.me.hasPermission('MANAGE_ROLES')) {
                        roleMSG = ":white_check_mark: I have the permission to create the music mod role"
                    } else {
                        roleMSG = ":x: I do not have the permission to create the music mod role"
                        fault = true;
                    }

                    if (fault) {
                        message.channel.send(`I have not been able to set it up:\n\n${channelMSG}\n${roleMSG}`)
                    } else {
                        
                        try {
                            if (serverInfo[message.guild.id] && serverInfo[message.guild.id].textChannel) {
                                if (message.guild.channels.get(serverInfo[message.guild.id].textChannel)) chosenChannel = message.guild.channels.get(serverInfo[message.guild.id].textChannel).id;
                                else await message.guild.createChannel("music_maistro").then(c => chosenChannel = c.id);    
                            } else {
                                await message.guild.createChannel("music_maistro").then(c => chosenChannel = c.id);    
                            }

                            if (serverInfo[message.guild.id] && serverInfo[message.guild.id].modRole) {
                                if (message.guild.roles.get(serverInfo[message.guild.id].modRole)) chosenRole = message.guild.roles.get(serverInfo[message.guild.id].modRole).id;
                                else await message.guild.createRole({name: "Music Maistro Mod"}).then(r => chosenRole = r.id);    
                            } else {
                                await message.guild.createRole({name: "Music Maistro Mod"}).then(r => chosenRole = r.id);    
                            }

                            sql.get(`select * from guilds where guildID = '${message.guild.id}'`).then(async row => {
                                if (row) {
                                    sql.run(`update guilds set prefix = '${mysql_real_escape_string(chosenPrefix)}', musicChannelID = '${chosenChannel}', musicModRole = '${chosenRole}' where guildID = '${message.guild.id}'`)
                                } else {
                                    sql.run(`insert into guilds(guildID, prefix, musicChannelID, musicModRole) VALUES ('${message.guild.id}', '${mysql_real_escape_string(chosenPrefix)}', '${chosenChannel}', '${chosenRole}')`)
                                }
                                await message.channel.send("__Core configuration has been setup!__\nPrefix: **" + chosenPrefix + "** (More info on "+ chosenPrefix +"help)\nChannel: **<#" + chosenChannel + ">** (You can move this to wherever you would like!)\nRole: **" + message.guild.roles.get(chosenRole).name + "**\n\n__Further configurations you can do (These commands only work in <#" + chosenChannel + "> & by a Music Maistro Mod or Administrator):__\n- `" + chosenPrefix + "setvc <?off>` -- Do " + chosenPrefix + "setvc when being in a voicechannel to restrict the use only to that channel. `" + chosenPrefix + "setvc off` to disable that again.\n- `" + chosenPrefix + "setTime <minutes>:<seconds>` -- To set a max length on requested songs of members. (`" + chosenPrefix + "setTime off`) to disable again. Music Maistro Mod & Administrators ignore the limit")

                                if (!serverInfo[message.guild.id]) serverInfo[message.guild.id] = {}
                                serverInfo[message.guild.id].prefix = chosenPrefix
                                serverInfo[message.guild.id].textChannel = chosenChannel
                                serverInfo[message.guild.id].modRole = chosenRole
                                serverInfo[message.guild.id].voteSkips = []

                                if (!client.guilds.get(message.guild.id).channels.get(chosenChannel))
                                    return
                    
                                client.guilds.get(message.guild.id).channels.get(chosenChannel).fetchMessages().then(messages => {
                                    messages.forEach(message => {
                                        message.delete();
                                    });
                                    client.guilds.get(message.guild.id).channels.get(chosenChannel).send('', new Discord.Attachment("http://polliedev.com/assets/img/banner.png", "banner.png")).then(m => {
                                        const embed = new Discord.RichEmbed()
                                        .setColor([255,0,0])
                                        .setImage('https://i.ytimg.com/vi/l1aNN9FzbFg/maxresdefault.jpg')
                                        .setTitle('No song playing currently')
                                        client.guilds.get(message.guild.id).channels.get(chosenChannel).send(embed).then(message => {
                                        serverInfo[message.guild.id].playingMessage = message;
                                        client.guilds.get(message.guild.id).channels.get(chosenChannel).send('', new Discord.Attachment("http://polliedev.com/assets/img/line.png")).then(mm => {
                                            client.guilds.get(message.guild.id).channels.get(chosenChannel).send("**__Queue list:__**").then(mmm => {
                                                serverInfo[message.guild.id].queueMessage = mmm;
                                            })
                                        })
                                        });
                                
                                    })
                                });
                            })

                        } catch (error) {
                            console.error(error)
                        }

                    }
                })
                .catch(collected1 => {
                    if (collected1.size == 0) {
                        message.channel.send(`You did not repond within 30 seconds. I have shut down the setup process, ${message.member}`);
                    }
                })
        })


    }
}
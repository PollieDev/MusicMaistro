//config
var inDevelopment = false;
const config = require("./tokens.js")
var dev = config.devId;

//Node Packages
const Discord = require('discord.js');
const client = new Discord.Client();
const YTDL = require("ytdl-core");
const sql = require("sqlite");
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(config.youtubeToken);
sql.open("src/sqlite/db.sqlite");


//Config Vars
var serverInfo = []; //This includes all info for functionalities
var servers = []; //This includes all info for the musicplayer (like queue, voiceConnection, etc...)
var lockdown = false;
if (inDevelopment) lockdown = true;
var lastMessage = [];
var lockIDs = [];


//The moment the bot connect it displays & message and sets the game of the bot
client.on('ready', () => {
    require("./events/ready.js").run(client, sql, serverInfo, inDevelopment)
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
    require("./events/voiceStateUpdate.js").run(client, servers,newMember)
})

client.on('guildCreate', guild => {
    sendInfo(guild.owner)
})

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

//All commands
client.on('message', async message => {
    if (message.author.id == client.user.id) return;
    var args = message.content.split(/[ ]+/);

    //Temporary until this stupid bot is fixed
    if (args[0].toLowerCase() == "//restart" && message.author.id == dev) process.exit(0);
 
    if (message.channel.type == "text") {
        //if the server is not setup and neither does it start with default prefix then we don't need them to continue
        if (!serverInfo[message.guild.id] && !message.content.startsWith("->")) return;

        //Setting up command vars
        var prefix = serverInfo[message.guild.id] ? serverInfo[message.guild.id].prefix : undefined;
        var command = args[0].startsWith(prefix) ? args[0].substring(prefix.length).toLowerCase() : undefined;

        //All messages sent in the desired Music Channel
        if (serverInfo[message.guild.id] && message.channel.id == serverInfo[message.guild.id].textChannel) {
            message.delete();
            if (message.author.bot) return;

            if (command) {
                const userVoiceChannel = message.member.voiceChannel;
                
                switch (command) {
                    case "voteskip":
                        require("./cmds/voteskip.js").run(client, message, servers, userVoiceChannel, serverInfo, prefix);
                        break;

                    case "skip":
                        require("./cmds/skip.js").run(client, message, serverInfo, servers, () => {
                            addToStats("skip", message.guild.id)
                        });
                        break;

                    case "setvc":
                        require("./cmds/setvc.js").run(client, message, serverInfo, sql, args);
                        break;

                    case "settime":
                        require("./cmds/settime.js").run(client, message, serverInfo, sql, args);
                        break;
                    
                    case "remove":
                        require("./cmds/remove.js").run(client, message, servers, serverInfo, args, () => {
                            updateQueue(message.guild.id);
                            addToStats("remove", message.guild.id)    
                        })
                        break;
                    case "reload":
                        require("./cmds/reload.js").run(client, message, servers, serverInfo, args, () => {
                            updateQueue(message.guild.id)
                            addToStats("reload", message.guild.id) 
                        })
                        break;

                    case "playlists":
                        require("./cmds/playlists.js").run(client, message, serverInfo, sql, args);
                        break;

                    case "playlist":
                        loadPlaylist(message, args);
                        break;

                    case "ytpl":
                        loadYtpl(message, args);
                        break;

                    case "ban":
                        require("./cmds/ban.js").run(client, message, serverInfo, sql, args);
                        break;
                        
                    case "unban":
                        require("./cmds/unban.js").run(client, message, serverInfo, sql, args);
                        break;    
                    
                    default:
                        break;
                }
            } else {
                loadSong(message, args);
            }
        } else {
            if (args[0].toLowerCase() == "->setup") {
                require("./cmds/setup.js").run(client, message, serverInfo, servers, sql, dev)
            }

            if (args[0].toLowerCase() == "->info") {
                sendInfo(message.author)
                addToStats("info", message.guild.id)
            }
        }

        if (command == "help") {
            require("./cmds/help.js").run(message, () => {
                addToStats("help", message.guild.id)
            })
        }


    } else {
        require("./cmds/dm.js").run(client, message, args, sql);
        require("./cmds/devmds.js").run(client, message, process, args, sql, dev, lockdown, lockIDs)
    }
})


client.login(config.botToken);










////////////////////////////////////////////////////
//////// SONG FUNCTON HANDLES
////////////////////////////////////////////////////

//
function loadPlaylist(message, args) {
    if (serverInfo[message.guild.id].playlistsAllowed == 0) {
        return message.author.send("Playlists are disabled on this server by the staff.\nContact them to enable it.")
    }


    if (lockdown && message.guild.id != "307576323776446465") return;
    var vc = message.member.voiceChannel;
    if (!vc) {
        return message.member.send("You must be in a voice channel for me to join.")
    }

    if (serverInfo[message.guild.id].voiceChannel && serverInfo[message.guild.id].voiceChannel != vc.id) {
        return message.member.send("The music bot is restricted to\n**" + message.guild.channels.get(serverInfo[message.guild.id].voiceChannel).name + "**")
    }

    if (args.length != 2) return message.author.send("You have to include your playlist name like: `" + prefix + "playlist pop`")

    if (lastMessage[message.author.id] + 5000 > new Date().getTime()) return message.member.send("Oh oh, calm down. Only 1 request every 5 seconds");
    lastMessage[message.author.id] = new Date().getTime()


    if (!servers[message.guild.id]) servers[message.guild.id] = {
        queue:[],
        isPlaying: false
    }
    var server = servers[message.guild.id];


    sql.all(`select * from songs where playlistName = '${mysql_real_escape_string(args[1])}' and discordID = '${message.author.id}'`).then(async rows => {
        if (rows.length == 0) {
            message.channel.send(":x: I could not find your playlist or your playlist is empty!").then(m => m.delete( 5000))
        } else {

            joined = false;
            addToStats("playlist", message.guild.id);

            for (let index = 0; index < rows.length; index++) {
                await YTDL.getInfo(rows[index].url, (err, info) => {
                    if (err) return console.log(err);
                    if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.has(serverInfo[message.guild.id].modRole)) {
                        
                        var time = serverInfo[message.guild.id].maxTime ? serverInfo[message.guild.id].maxTime : 0;

                        if (parseInt(info.length_seconds) < time) {
                            server.queue.push({
                                url: info.video_url,
                                thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                                title: info.title,
                                length: fancyTimeFormat(info.length_seconds),
                                requestedBy: message.author,
                                afk: undefined
                            });
        
                            updateQueue(message.guild.id);
        
                            if (!message.guild.voiceConnection && !joined) {
                                vc.join().then(connection => {
                                    play(connection, message);
                                })
                                joined = true;
                            } 
                        }
                    } else {
                        server.queue.push({
                            url: info.video_url,
                            thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                            title: info.title,
                            length: fancyTimeFormat(info.length_seconds),
                            requestedBy: message.author,
                            afk: undefined
                        });
    
                        updateQueue(message.guild.id);
    
                        if (!message.guild.voiceConnection && !joined) {
                            vc.join().then(connection => {
                                play(connection, message);
                            })
                            joined = true;
                        } 
                    }
    
                })
                
            }

        }
    })
}


//
async function loadYtpl(message, args) {
    if (serverInfo[message.guild.id].playlistsAllowed == 0) {
        return message.author.send("Playlists are disabled on this server by the staff.\nContact them to enable it.")
    }


    if (lockdown && message.guild.id != "307576323776446465") return;
    var vc = message.member.voiceChannel;
    if (!vc) {
        return message.member.send("You must be in a voice channel for me to join.")
    }

    if (serverInfo[message.guild.id].voiceChannel && serverInfo[message.guild.id].voiceChannel != vc.id) {
        return message.member.send("The music bot is restricted to\n**" + message.guild.channels.get(serverInfo[message.guild.id].voiceChannel).name + "**")
    }

    if (args.length != 2) return message.author.send("You have to include the playlist link: `" + prefix + "ytpl <link>`")

    if (lastMessage[message.author.id] + 5000 > new Date().getTime()) return message.member.send("Oh oh, calm down. Only 1 request every 5 seconds");
    lastMessage[message.author.id] = new Date().getTime()


    if (!servers[message.guild.id]) servers[message.guild.id] = {
        queue:[],
        isPlaying: false
    }
    var server = servers[message.guild.id];

    addToStats("playlist", message.guild.id);

    await youtube.getPlaylist(args[1]).then(async playlist => {
        await playlist.getVideos().then(async videos => {
            var failed = 0;
            var joined = false;
            await videos.forEach(async video => {
                await YTDL.getInfo(`https://www.youtube.com/watch?v=${video.id}`, (err, info) => {
                    if (err) return failed++;

                    if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.has(serverInfo[message.guild.id].modRole)) {
                        
                        var time = serverInfo[message.guild.id].maxTime ? serverInfo[message.guild.id].maxTime : 0;
                        
                        if (parseInt(info.length_seconds) < time) {
                            server.queue.push({
                                url: info.video_url,
                                thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                                title: info.title,
                                length: fancyTimeFormat(info.length_seconds),
                                requestedBy: message.author,
                                afk: undefined
                            });
                                                        
                            if (!message.guild.voiceConnection && !joined) {
                                vc.join().then(connection => {
                                    play(connection, message);
                                })
                                joined = true;
                            } 
                        } else {
                            failed++;
                        }
                    } else {
                        server.queue.push({
                            url: info.video_url,
                            thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                            title: info.title,
                            length: fancyTimeFormat(info.length_seconds),
                            requestedBy: message.author,
                            afk: undefined
                        });
    
                        updateQueue(message.guild.id);
    
                        if (!message.guild.voiceConnection && !joined) {
                            vc.join().then(connection => {
                                play(connection, message);
                            })
                            joined = true;
                        } 
                    }


                })
            });
        })
    })
    .catch(err => {
        console.log(err);
    })

    updateQueue(message.guild.id);

}



//
async function loadSong(message, args) {
    if (lockdown && message.guild.id != "307576323776446465") return;
    var vc = message.member.voiceChannel;
    if (!vc) {
        return message.member.send("You must be in a voice channel for me to join.")
    }
    
    if (serverInfo[message.guild.id].voiceChannel && serverInfo[message.guild.id].voiceChannel != vc.id) {
        return message.member.send("The music bot is restricted to\n**" + message.guild.channels.get(serverInfo[message.guild.id].voiceChannel).name + "**")
    }


    if (lastMessage[message.author.id] + 5000 > new Date().getTime()) return message.member.send("Oh oh, calm down. Only 1 request every 5 seconds");
    lastMessage[message.author.id] = new Date().getTime()


    if (!servers[message.guild.id]) servers[message.guild.id] = {
        queue:[],
        isPlaying: false
    }
    var server = servers[message.guild.id];
    
    await YTDL.getInfo(message.content, (err, info) => {
        if (err) {
            youtube.searchVideos(message.content, 1)
                .then(async videos => {
                    await YTDL.getInfo(`https://www.youtube.com/watch?v=${videos[0].id}`, (err, info) => {
                        if (err) return message.channel.send("Something went wrong. Please contact the developer!").then(m => m.delete( 5000))

                        if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.has(serverInfo[message.guild.id].modRole)) {
                            if (serverInfo[message.guild.id].maxTime && parseInt(info.length_seconds) > serverInfo[message.guild.id].maxTime) return message.author.send("There is a timelimit of `" + fancyTimeFormat(serverInfo[message.guild.id].maxTime) + "` in this server.\nYour song has been denied.")
                        }

                        addToStats("song", message.guild.id)

                        server.queue.push({
                            url: info.video_url,
                            thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                            title: info.title,
                            length: fancyTimeFormat(info.length_seconds),
                            requestedBy: message.author,
                            afk: undefined
                        });
    
                        updateQueue(message.guild.id);
    
                        if (!message.guild.voiceConnection) vc.join().then(connection => {
                            play(connection, message);
                        })
        
                    })
                })
                .catch(err => {
                    console.log(err)
                    return message.channel.send("Something went wrong. Please contact the developer!").then(m => m.delete( 5000))
                });
        } else {

            if (!message.member.hasPermission("ADMINISTRATOR") && !message.member.roles.has(serverInfo[message.guild.id].modRole)) {
                if (serverInfo[message.guild.id].maxTime && parseInt(info.length_seconds) > serverInfo[message.guild.id].maxTime) return message.author.send("There is a timelimit of `" + fancyTimeFormat(serverInfo[message.guild.id].maxTime) + "` in this server.\nYour song has been denied.")
            }

            addToStats("song", message.guild.id)
            server.queue.push({
                url: info.video_url,
                thumbnail: `https://i.ytimg.com/vi/${info.video_id}/hqdefault.jpg`,
                title: info.title,
                length: fancyTimeFormat(info.length_seconds),
                requestedBy: message.author,
                afk: undefined
            });

            updateQueue(message.guild.id);

            if (!message.guild.voiceConnection) vc.join().then(connection => {
                play(connection, message);
            })
        }

    })
}

//
function play(connection, message) {
    try {
        
        var server = servers[message.guild.id];

        server.dispatcher = connection.playStream(YTDL(server.queue[0].url, {filter: "audioonly"}));
        server.isPlaying = true;
        server.dispatcher.setVolume(0.2)

        server.currentSong = {
            url: server.queue[0].url,
            thumbnail: server.queue[0].thumbnail,
            title: server.queue[0].title,
            length: server.queue[0].length,
            requestedBy: server.queue[0].requestedBy
        }

        const embed = new Discord.RichEmbed()
        .setColor([255,177,0])
        .setImage(server.currentSong.thumbnail)
        .setAuthor(`${server.currentSong.title} [${server.currentSong.length}]`, 'http://polliedev.com/assets/images/Logo.png', server.currentSong.url)
        .setDescription(`Requested by ${server.currentSong.requestedBy}`)
        .setFooter(`Prefix for this server is ` + "`" + serverInfo[message.guild.id].prefix +"`")
        serverInfo[message.guild.id].playingMessage.edit(embed);
        server.queue.shift();

        updateQueue(message.guild.id);

        server.dispatcher.on("end", () => {
            if (server.queue[0]) {
                play(connection, message);
            } else  {
                server.isPlaying = false;
                connection.disconnect(); 
                const embed = new Discord.RichEmbed()
                .setColor([255,0,0])
                .setImage('https://i.ytimg.com/vi/l1aNN9FzbFg/maxresdefault.jpg')
                .setTitle('No song playing currently')
                .setFooter(`Prefix for this server is ` + "`" + serverInfo[message.guild.id].prefix +"`")
                serverInfo[message.guild.id].playingMessage.edit(embed);
            }
        })
    } catch (error) {
        console.error(error)
    }
}












////////////////////////////////////////////////////
//////// BOT SHORTCUT FUNCTIONS
////////////////////////////////////////////////////

function updateQueue(guildId) {
    var msg = "**__Queue list:__**";
    var andMore = false;
    var more = "";
    var counterToStop = 0;

    for (let i = 0; i < servers[guildId].queue.length; i++) {
        var q = servers[guildId].queue
        var element = servers[guildId].queue[i]

        if (msg.length < 1900) {
            msg += `\n${i + 1}. ${element.title} [${element.length}] ~ *Requested by* ***${element.requestedBy.tag}***`
            counterToStop = i
        } else {
            andMore = true;
            more = `\nAnd **${q.length - counterToStop}** more...`
        }
        
    }

    if (andMore) msg += more;

    serverInfo[guildId].queueMessage.edit(msg);
}

function sendInfo(user) {
    var embed = new Discord.RichEmbed()
    .setAuthor("Music Maistro Bot - developed by Pollie", 'http://polliedev.com/assets/images/Logo.png', "http://PollieDev.com/")
    .setColor([255,177,0])
    .setThumbnail(client.user.avatarURL)
    .setDescription("Uh oh, hey! Thank you for inviting me :D Little information about myself")
    .addField("What do I do?", "I play music! And I show them in a fancy list like no other bot does c:")
    .addField("What's special about it?", "You'll see once setup how it looks, also I have a build in playlist system that can be activated or disabled at any moment. Check more about it with <your prefix>help")
    .addField("How do I work?", "At first I won't listen to you until you've set me up. You can do that by doing `->Setup` anywhere but you'll need the Administrator permission.")
    .addField("Who is behind this machine?", "It's developed by Pollie (**Pollie#8264**) and will keep updating it to make something even more special! Bugs & ideas always welcome to report :)")
    .addField("Invite link:", "http://polliedev.com/MusicMaistro")
    user.send(embed)
}

function addToStats(action, guild) {
    sql.get(`select * from currentStats where action = '${action}' and guild = '${guild}'`).then(row => {
        if (row) {
            sql.run(`update currentStats set value = '${parseInt(row.value) + 1}' where action = '${action}' and guild = '${guild}'`)
        } else {
            sql.run(`Insert into currentStats(action, guild, value) VALUES ('${action}', '${guild}', '1')`)
        }
    })
}















////////////////////////////////////////////////////
//////// PLANNED EVENTS
////////////////////////////////////////////////////
var schedule = require('node-schedule');

var d = schedule.scheduleJob({hour: 23, minute: 55}, function(){
    sql.all("select * from currentStats").then(rows => {
        rows.forEach(row => {
            sql.run(`Insert into stats(action, guild, value, time) VALUES ('${row.action}', '${row.guild}', '${row.value}', '${convertDate(new Date())}')`);
        });
        sql.run("delete from sqlite_sequence where name='currentStats'")
    })
});

var m = schedule.scheduleJob({second: 1}, function() {
    for (var guildID in servers) {
        if (servers[guildID].afk && servers[guildID].afk + 900000 < new Date().getTime()) {
            servers[guildID].queue = [];
            servers[guildID].dispatcher.end();
            updateQueue(guildID)
            addToStats("inactive", guildID)
        }
    }
})




















////////////////////////////////////////////////////
//////// INDIRECT BOT RELATED FUNCTIONS
////////////////////////////////////////////////////
function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return char+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}

function fancyTimeFormat(time)
{   
    // Hours, minutes and seconds
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = time % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

function convertDate(dateString) {
    var date = new Date(dateString);
    var msg = "/"+date.getDate()+ (date.getMonth() + 1) +date.getFullYear();
    return msg.substring(1)
}

//Simple function to check if they are numbers
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

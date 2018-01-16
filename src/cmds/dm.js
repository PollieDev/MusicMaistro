//Too lazy for now to split it. These are all DM commands. This is a build in playlist functionality but
//I feel that there is a lack of motivation for it. So dropping here but might be removed soon

module.exports.run = async (client, message, args, sql) => {
    var prefix = "!"
    if (args[0].startsWith(prefix)) var command = args[0].substring(prefix.length).toLowerCase()
    else var command = undefined;


    //PLAYLIST SUPPORT
    if (command == "playlists") {
        var msg = `==         YOUR PLAYLISTS          ==   TOTAL SONGS`
        await sql.all(`select * from playlists where Owner = '${message.author.id}'`).then(async rows => {

            for (let index = 0; index < rows.length; index++) {
                name = rows[index].Name;

                for (let index = 32 - name.length; index > 0; index--) {
                    name += " ";
                }
                await sql.all(`select * from songs where playlistName = '${rows[index].Name}' and discordID = '${message.author.id}'`).then(rowss => {
                    msg += `\n• ${name} ::   ${rowss.length}`
                });                        
            }
            message.channel.send(msg, {code: "asciidoc"});
        })
    }

    if (command == "playlist") {
        if (args.length == 1) {
            message.channel.send(`**__Help on Playlist command__**
            
!Playlist <playlistname>  --  Show you all the songs in that playlist
!Playlist add <playlistname>  --  Creates a playlist
!Playlist remove <playlistname>  --  Removes the playlist`)
        } else if (args.length == 3) {
            if (args[1].toLowerCase() == "add") {
                playlistName = args[2];
                newAllowed = true;
                var totalPL;

                sql.all(`select * from playlists where Owner = '${message.author.id}'`).then(async rows => {
                    await sql.get(`select * from users where discordID = '${message.author.id}'`).then(row => {
                        if (row) {
                            totalPL = row.playlists
                        } else {
                            totalPL = 2;
                        }
                    })

                    if (rows.length >= totalPL) {
                        return message.channel.send("You can only have " + totalPL +" playlists and you have reached that already.\nPlease remove a playlist to create a new one.")
                    }
                    await rows.forEach(element => {
                        if (element.Name.toLowerCase() == playlistName.toLowerCase()) {
                            message.channel.send("You already have a playlist with this name.")
                            return newAllowed = false;
                        }
                    });
                    if (newAllowed) {
                        sql.run(`Insert into playlists(Name, Owner) VALUES('${mysql_real_escape_string(playlistName)}', '${message.author.id}')`)
                        message.channel.send("Your playlist has been added!")    
                    }

                })
            } else if (args[1].toLowerCase() == "remove") {
                sql.get(`select * from Playlists where Name = '${mysql_real_escape_string(args[2])}' and Owner = '${message.author.id}'`).then(row => {
                    if (row) {
                        sql.run(`delete from playlists where Name = '${mysql_real_escape_string(args[2])}' and Owner = '${message.author.id}'`)
                        sql.run(`delete from songs where playlistName = '${mysql_real_escape_string(args[2])}' and discordID = '${message.author.id}'`)
                        message.channel.send("Playlist successfully removed!")
                    } else {
                        message.channel.send("Playlist not found. Check at `!Playlists` if you typed it correctly!")
                    }
                })
            }
        } else if (args.length == 2) {
            sql.get(`select * from Playlists where Name = '${mysql_real_escape_string(args[1])}' and Owner = '${message.author.id}'`).then(async row => {
                if (row) {
                    var msg = `==   SONGS IN PLAYLIST: ${row.Name.toUpperCase()}   ==`
                    sql.all(`select * from songs where playlistName = '${mysql_real_escape_string(args[1])}' and discordID = '${message.author.id}'`)
                    .then(async rows => {
                        for (let index = 0; index < rows.length; index++) {
                                songName = rows[index].ID.toString();
                                if (index > 2) {
                                    for (let index = 2 - songName.length; index > 0; index--) {
                                        songName += " ";
                                    }    
                                }
                                msg += `\n• ${songName} ::  ${rows[index].title}`
            
                        }
                        await message.channel.send(msg, {code: "asciidoc"});
                    });
                } else {
                    message.channel.send("Playlist not found. Check at `!Playlists` if you typed it correctly!")
                }
            });
        } else {
            message.channel.send("Please specify your playlistname in 1 word:\n`!Playlist add/remove Top_Music` for example");
        }
    }

    if (command == "song") {
        if (args.length == 1) {
            message.channel.send(`**__Help on song command__**
            
!song add <playlistname> <youtube url>  --  Adds the song to your chosen playlist
!song remove <playlistname> <song ID>  --  Removes the song from your chosen playlist. SongID can be found through: !Playlist <playlistname>`)
        } else if (args.length == 4) {
            sql.get(`select * from Playlists where Name = '${mysql_real_escape_string(args[2])}' and Owner = '${message.author.id}'`).then(async row => {
                if (row) {
                    if (args[1].toLowerCase() == "add") {
                        await YTDL.getInfo(args[3], (err, info) => {
                            if (err) return message.channel.send("Only long Youtube links are supported: `https://www.youtube.com/watch?v=xXxXxXxX` as example").then(m => m.delete( 5000))

                            message.channel.send(`Is this the song you want to add:\n**${info.title}**\n\nIf so please typ *Yes*. If not, typ *No*`)

                            const filter = m => m.content.toLowerCase() == "yes" || m.content.toLowerCase() == "no";
                            message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                            .then(collected => {
                                if(collected.first().content.toLowerCase() == "no") {
                                    message.channel.send("Alright, I won't add it! You can try it again now.")
                                } else if(collected.first().content.toLowerCase() == "yes") {
                                    sql.run(`Insert into songs (playlistName, discordID, url, title) VALUES ('${mysql_real_escape_string(args[2])}', '${message.author.id}', '${args[3]}', '${mysql_real_escape_string(info.title)}')`)
                                    message.channel.send("Song has been added to the playlist!")
                                }
                            })
        
                
                        })
                    } else if (args[1].toLowerCase() == "remove") {
                        sql.get(`select * from songs where ID = '${args[3]}' and discordID = '${message.author.id}' and playlistName = '${mysql_real_escape_string(args[2])}'`).then(async row => {
                            if (row) {
                                sql.run(`delete from songs where ID = '${args[3]}'`)
                                message.channel.send("Song removed from your playlist!")
                            } else {
                                message.channel.send("Song ID not found (in that playlist). Check at `!Playlist <playlistname>` to find the ID.")
                            }
                        });
                    }
                } else {
                    message.channel.send("Playlist not found. Check at `!Playlists` if you typed it correctly!")
                }
            });

        } else {
            message.channel.send("Command wrongly used. Maybe you forgot the playlist?\n`!song add <playlistname> <url>` or `!song remove <playlistname> <id>` for example (id can be found at **!Playlist <playlistname>**");
        }
    }

}
module.exports.run = async (client, message, process, args, sql, dev, lockdown, lockIDs) => {
    if (message.author.id != dev) return;
    
    if (args[0].toLowerCase() == "!lockdown") {
        lockdown = true;
        sql.all(`select * from guilds`).then(rows => {
            rows.forEach(row => {
                client.channels.get(row.musicChannelID).send(`**__Music Bot has been disabled. Bot will be restarted soon__**\n\n__Message of the developer:__\n:arrow_right:${args.slice(1).join(" ")}`).then(msg => {
                    lockIDs.push(msg);
                })
            });
        });
    }

    if (args[0].toLowerCase() == "!unlock") {
        lockdown = false;

        lockIDs.forEach(msg => {
            msg.delete();
        });

        sql.all(`select * from guilds`).then(rows => {
            rows.forEach(row => {
                client.channels.get(row.musicChannelID).send(`:arrow_right: **Music Bot back online!** :arrow_left:`).then(msg => {
                    msg.delete({timeout: 20000})
                })
            });
        });
    }




    if (args[0].toLowerCase() == "->stats") {
        if (args.length == 1) {
            message.channel.send(`= STATISTICS =
• Uptime     :: ${fancyTimeFormat(client.uptime / 1000)}
• Users      :: ${client.users.size.toLocaleString()}
• Servers    :: ${client.guilds.size.toLocaleString()}
• Channels   :: ${client.channels.size.toLocaleString()}
• MB Active  :: ${client.voiceConnections.size}
• Mem Usage  :: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, {code: "asciidoc"});

        } else if (args[1].toLowerCase() == "today") {

            var msg = `==          STATS TODAY          ==   SONGS   ==   SKIPS   ==   REMOVES `
            
            for (var k in channels) {
                guildName = client.guilds.get(k).name
                if (guildName.length > 29) guildName = guildName.substring(0,26) + "...";
                for (let index = 30 - guildName.length; index > 0; index--) {
                    guildName += " ";
                }
                msg += `\n• ${guildName} :: `
                await sql.get(`select * from currentStats where guild = '${k}' and action = 'song'`).then(songs => {

                    if (songs) songsTotal = songs.value;
                    else songsTotal = 0;
                    for (let index = 8 - songsTotal.toString().length; index > 0; index--) {
                        songsTotal += " ";
                    }
                    msg += `  ${songsTotal}::`    
                })

                await sql.get(`select * from currentStats where guild = '${k}' and action = 'skip'`).then(skip => {

                    if (skip) skipsTotal = skip.value;
                    else skipsTotal = 0;
                    for (let index = 8 - skipsTotal.toString().length; index > 0; index--) {
                        skipsTotal += " ";
                    }
                    msg += `   ${skipsTotal}::`    
                })

                await sql.get(`select * from currentStats where guild = '${k}' and action = 'remove'`).then(remove => {

                    if (remove) removeTotal = remove.value;
                    else removeTotal = 0;
                    msg += `   ${removeTotal}`    
                })
                
            }

            message.channel.send(msg, {code: "asciidoc"});
        } else if (args.length == 2) {
            await sql.get(`select * from stats where time = '${args[1]}'`).then(async row => {
                if (!row) {
                    return message.channel.send("No info found from this day.");
                } else {
                    var msg = `==        STATS ${args[1]}         ==   SONGS   ==   SKIPS   ==   REMOVES `
            
                    for (var k in channels) {
                        guildName = client.guilds.get(k).name
                        if (guildName.length > 29) guildName = guildName.substring(0,26) + "...";
                        for (let index = 30 - guildName.length; index > 0; index--) {
                            guildName += " ";
                        }
                        msg += `\n• ${guildName} :: `
                        await sql.get(`select * from stats where guild = '${k}' and action = 'song' and time = '${args[1]}'`).then(songs => {
    
                            if (songs) songsTotal = songs.value;
                            else songsTotal = 0;
                            for (let index = 8 - songsTotal.toString().length; index > 0; index--) {
                                songsTotal += " ";
                            }
                            msg += `  ${songsTotal}::`    
                        })
    
                        await sql.get(`select * from stats where guild = '${k}' and action = 'skip' and time = '${args[1]}'`).then(skip => {
    
                            if (skip) skipsTotal = skip.value;
                            else skipsTotal = 0;
                            for (let index = 8 - skipsTotal.toString().length; index > 0; index--) {
                                skipsTotal += " ";
                            }
                            msg += `   ${skipsTotal}::`    
                        })
    
                        await sql.get(`select * from stats where guild = '${k}' and action = 'remove' and time = '${args[1]}'`).then(remove => {
    
                            if (remove) removeTotal = remove.value;
                            else removeTotal = 0;
                            msg += `   ${removeTotal}`    
                        })
                        
                    }

                    message.channel.send(msg, {code: "asciidoc"});
    
                }
            })
        }
    }
}
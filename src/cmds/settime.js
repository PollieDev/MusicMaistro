module.exports.run = (client, message, serverInfo, sql, args) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if (args.length == 2 && args[1].toLowerCase() == "off") {
            sql.run(`update guilds set maxtime = null where guildID = '${message.guild.id}'`)
            serverInfo[message.guild.id].maxTime = null;
            message.author.send("There is no time limit on the songs anymore!")
        } else if (args.length == 2) {
            if (message.content.includes(':')) {
                messageSplit = args.splice(1).join(" ").split(":");
                minutes = parseInt(messageSplit[0].trim());
                seconds = parseInt(messageSplit[1].trim());

                if (isNumber(minutes) && isNumber(seconds)) {
                    totalSeconds = seconds + (minutes * 60);

                    serverInfo[message.guild.id].maxTime = totalSeconds;
                    sql.run(`update guilds set maxtime = '${totalSeconds}' where guildID = '${message.guild.id}'`)
                    message.author.send("Songs requested can not be longer than `" + fancyTimeFormat(totalSeconds) + "`  minutes\nMusic Maistro Mods & Administrators are excluded from this filter.")    
                } else {
                    message.author.send("Those minutes and / or seconds are not valid.")
                }
                                
            }
        }
    }
}


function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
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
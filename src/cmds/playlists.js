module.exports.run = (client, message, serverInfo, sql, args) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {                       
        if (serverInfo[message.guild.id].playlistsAllowed == 1) {
            message.channel.send("**:x: __Playlist are now disabled on this server.__**").then(m=>m.delete({timeout: 10000}))
            serverInfo[message.guild.id].playlistsAllowed = 0;
            sql.run(`update guilds set playlists = 0 where guildID = '${message.guild.id}'`)
        } else if (serverInfo[message.guild.id].playlistsAllowed == 0) {
            message.channel.send("**:white_check_mark: __Playlist are now enabled on this server.__**").then(m=>m.delete({timeout: 10000}))
            serverInfo[message.guild.id].playlistsAllowed = 1;
            sql.run(`update guilds set playlists = 1 where guildID = '${message.guild.id}'`)
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
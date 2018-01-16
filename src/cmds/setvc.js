module.exports.run = (client, message, serverInfo, sql, args) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if (args.length == 1) {
            if (message.member.voiceChannel) {
                sql.run(`update guilds set vchannel = '${message.member.voiceChannel.id}' where guildID = '${message.guild.id}'`)
                serverInfo[message.guild.id].voiceChannel = message.member.voiceChannel.id;
                message.author.send("Voicechannel set! The bot will only join this channel now :slight_smile:")
            } else {
                message.author.send("You are not in a voicechannel. So I don't know which channel you meant me to set it to.")
            }
        } else if (args.length == 2 && args[1].toLowerCase() == "off") {
            sql.run(`update guilds set vchannel = null where guildID = '${message.guild.id}'`)
            serverInfo[message.guild.id].voiceChannel = null;
            message.author.send("The bot will not be restricted to any channel and will now work in any voicechannel!")
        }
    }

}
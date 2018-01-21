module.exports.run = (client, message, servers, serverInfo, args, callback) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if (!servers[message.guild.id])
            return message.channel.send("The bot is currently not active.").then(m=> m.delete({timeout: 7500}))
        
        servers[message.guild.id].queue = [];
        servers[message.guild.id].dispatcher.end();
        
    }
}


//Simple function to check if they are numbers
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
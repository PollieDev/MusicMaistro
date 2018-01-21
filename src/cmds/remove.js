module.exports.run = (client, message, servers, serverInfo, args, callback) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if(!isNumber(args[1]) || args.length != 2)
            return message.channel.send("The command has not correctly been build. Please use `!remove [song number]`").then(m=> m.delete({timeout: 7500}))
        
        if(!servers[message.guild.id])
            return message.channel.send("There is currently no queue.").then(m=> m.delete({timeout: 7500}))

        if(servers[message.guild.id].queue.length < 1)
            return message.channel.send("There is currently no queue.").then(m=> m.delete({timeout: 7500}))

        if (servers[message.guild.id].queue.length < args[1])
            return message.channel.send("That song number doesn't exist!").then(m=> m.delete({timeout: 7500}))

        var index = args[1] - 1;
        servers[message.guild.id].queue.splice(index, 1);
        callback();
    }
}


//Simple function to check if they are numbers
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
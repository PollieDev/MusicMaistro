module.exports.run = (client, message, serverInfo, servers, callback) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if (servers[message.guild.id].isPlaying && servers[message.guild.id].dispatcher) {
            servers[message.guild.id].dispatcher.end();
            callback()
        }
    }
}
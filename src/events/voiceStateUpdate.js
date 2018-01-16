module.exports.run = (client, servers,newMember) => {
    if (client.voiceConnections.first()) {
        if (client.voiceConnections.find(c => c.channel.guild.id == newMember.guild.id)) {
            if (client.voiceConnections.find(c => c.channel.guild.id == newMember.guild.id).channel) {
                if(client.voiceConnections.find(c => c.channel.guild.id == newMember.guild.id).channel.members.size == 1) {
                    if (servers[newMember.guild.id].dispatcher) servers[newMember.guild.id].dispatcher.pause();
                    if (servers[newMember.guild.id]) servers[newMember.guild.id].afk = new Date().getTime()
                } else {
                    if (servers[newMember.guild.id].dispatcher) servers[newMember.guild.id].dispatcher.resume();
                    if (servers[newMember.guild.id]) servers[newMember.guild.id].afk = undefined;
                }
            }
        }
    }
}
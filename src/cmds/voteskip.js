const Discord = require('discord.js');


module.exports.run = (client, message, servers, userVoiceChannel, serverInfo, prefix) => {
    if (!userVoiceChannel) 
    return message.author.send("You need to be in the Music Channel to voteskip songs!");

    if (client.voiceConnections.first() && client.voiceConnections.find(c => c.channel.guild.id == message.guild.id).channel.id != userVoiceChannel.id)
        return message.author.send("You need to be in the Music Channel to voteskip songs!");

    if (!servers[message.guild.id])
        return message.channel.send("Musicbot is not playing yet!").then(m=> m.delete({timeout: 7500}))

    if (!servers[message.guild.id].isPlaying || !servers[message.guild.id].dispatcher)
        return message.channel.send("Musicbot isn't even playing :thinking:").then(m=> m.delete({timeout: 7500}))

    var server = servers[message.guild.id];
    var votesToSkip = Math.round((userVoiceChannel.members.array().length - 1) / 2);

    if (serverInfo[message.guild.id].voteSkips.includes(message.author.id)) {
        return;
    }
    serverInfo[message.guild.id].voteSkips.push(message.author.id);

    const embed = new Discord.MessageEmbed()
    .setColor([255,177,0])
    .setImage(server.currentSong.thumbnail)
    .setAuthor(`${server.currentSong.title} [${server.currentSong.length}]`, 'http://polliedev.com/assets/images/Logo.png', server.currentSong.url)
    .setDescription(`Requested by ${server.currentSong.requestedBy}`)
    .setFooter(`${prefix}Voteskip in progress: ${serverInfo[message.guild.id].voteSkips.length} / ${votesToSkip}`)
    serverInfo[message.guild.id].playingMessage.edit(embed);

    if (serverInfo[message.guild.id].voteSkips.length >= votesToSkip) {
        servers[message.guild.id].dispatcher.end();
        serverInfo[message.guild.id].voteSkips = [];
    }
}
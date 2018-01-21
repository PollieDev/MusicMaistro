const Discord = require('discord.js');

module.exports.run = (client, message, serverInfo, sql, args) => {
    if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.has(serverInfo[message.guild.id].modRole)) {
        if (message.mentions.users.first() == undefined) {
            var embed = new Discord.RichEmbed()
            .setAuthor("Incorrect Parameter! Please use a Discord mention of the person you'd like to unban")
            .setColor([255,177,0])
            message.author.send(embed);
        } else {
            const bannedUser = message.mentions.users.first();
            sql.get(`SELECT * FROM banned WHERE DiscordId ="${mysql_real_escape_string(bannedUser.id)}" AND ServerID = ${message.guild.id}`).then(row => {
                if (!row) {
                    var embed = new Discord.RichEmbed()
                    .setAuthor(`User ${bannedUser} was not found in the ban list.`)
                    .setColor([255,177,0])
                    message.author.send(embed);
                } else {
                    sql.run(`DELETE FROM banned WHERE DiscordId ="${mysql_real_escape_string(bannedUser.id)}" AND ServerID = ${message.guild.id}`);
                    var embed = new Discord.RichEmbed()
                    .setAuthor(`User ${bannedUser} was unbanned.`)
                    .setColor([255,177,0])
                    message.author.send(embed);
                }
              }).catch(() => {
                console.error;
              });
        }

    }
}

function mysql_real_escape_string (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return char+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}
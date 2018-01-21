module.exports.run = (message, callback) => {
    await message.author.send(`= HELP MENU =
• ->Setup                  :: To setup the required information for the bot. 
                              (Can only be done by a member with ADMINISTRATOR permission)
• ${prefix}Playlists               :: Enables / Disables playlists for this server. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}playlist <playlistname> :: Adds the songs from the playlist to the queue. Only when enabled ^
                              [Only works in the music channel]
• ${prefix}Reload                  :: Reloads the musicbot. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}Voteskip                :: To voteskip a song. 
                              [Only works in the music channel]
• ${prefix}Skip                    :: Skips the current song. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}Remove <Song Number>    :: Removes the chosen song number from the queue. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}Reload                  :: Reloads the musicbot. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}Setvc                   :: Will restrict the bot to the channel you are in. Only for the desired role or administrator
                              [Only works in the music channel]
• ${prefix}Setvc off               :: Will not restrict the bot to any channel anymore. Only for the desired role or administrator
                              [Only works in the music channel]
                              
• ->Info                   :: To see the info of the bot + invite link`, {code: "asciidoc"});

    await message.channel.send("Check your DM :wink:").then(m => m.delete({timeout: 5000}))
    callback();
}
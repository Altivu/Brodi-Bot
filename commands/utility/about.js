const { prefix } = require("../../config.json");

module.exports = {
	name: 'about',
  aliases: ['aboutme', 'about_me'],
	description: 'Quick summary of the bot.',
  result(client, message, args, embed) {
    embed.setTitle(`${client.user.username} Bot`)
    .setDescription(`Provides information on various KartRider Rush+ content. Created by <@194612164474961921> as a test project. Access my commands via the '${prefix}' prefix, or through slash commands.

Send <@194612164474961921> a direct message if you would like to add this bot to your own server.

**Note:** If you are getting a "This interaction failed" message when using slash commands, try again, or switch to prefix commands for a more responsive result. The slash command interaction times out after 3 seconds, and the fetching of data sometimes (or often) can take longer than that. Apologies for the inconvenience!`)
    .setThumbnail(client.user.displayAvatarURL())

    return embed;
  }
};
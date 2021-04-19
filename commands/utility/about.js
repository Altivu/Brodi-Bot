const { prefix } = require("../../config.json");

module.exports = {
	name: 'about',
  aliases: ['aboutme', 'about_me'],
	description: 'Quick summary of the bot.',
  result(client, message, args, embed) {
    embed.setTitle(`${client.user.username} Bot`)
    .setDescription(`Provides information on various KartRider Rush+ content. Created by <@194612164474961921> as a test project. Access my commands via the '${prefix}' prefix, or through slash commands.

    Send me a direct message if you would like to add this bot to your own server.`)
    .setThumbnail(client.user.displayAvatarURL())

    return embed;
  }
};
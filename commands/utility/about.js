const { prefix } = require("../../config.json");

module.exports = {
	name: 'about',
  aliases: ['aboutme', 'about_me'],
	description: 'Quick summary of the bot.',
  result(client, message, args, embed) {
    embed.setTitle(`${client.user.username} Bot`)
    .setDescription(`Provides information on various KartRider Rush+ content. Created by <@194612164474961921> as a test project. Access my commands via the '${prefix}' prefix, or through slash commands.
    
    (Due to the relative newness of slash commands, note that there is less room for customization, and there may be times where they stop working after a moment of inactivity. In this scenario, use the command with the '${prefix}' prefix first, which should then allow the slash commands to work again. Hopefully this will be fixed in the near future.)

    Send me a direct message if you would like to add this bot to your own server.`)
    .setThumbnail(client.user.displayAvatarURL())

    return embed;
  }
};
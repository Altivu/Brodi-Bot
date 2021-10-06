const { SlashCommandBuilder } = require('@discordjs/builders');

const { prefix } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
		.setName('about')
		.setDescription('Quick summary of the bot.'),
  async execute(
    client,
    interaction,
    args,
    embed,
    oAuth2Client
  ) {
    embed
    .setTitle(`${client.user.username} Bot`)
    .setDescription(`Provides information on various KartRider Rush+ content. Created by <@194612164474961921> as a test project. Access my commands via the '${prefix}' prefix, or through slash commands.

    Send <@194612164474961921> a direct message if you would like to add this bot to your own server.`)
    .setThumbnail(client.user.displayAvatarURL());

    return { embeds: [ embed ]};
	},
  aliases: ['aboutme', 'about_me'],
};
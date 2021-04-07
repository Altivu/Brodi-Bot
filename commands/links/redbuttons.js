const Discord = require("discord.js");

module.exports = {
	name: 'redbuttons',
  aliases: ['red_buttons', 'brokencontrols', 'broken_controls'],
	description: 'Provides the link to the "On the issue of red buttons and locked tires" video.',
  result(_client, message, args, embed) {
    message.channel.send("https://www.youtube.com/watch?v=HevCJ4Uo_G0");
    // Do not return anything here as you do not want an embed for links to videos only
    return;
  }
};
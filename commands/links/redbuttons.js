const Discord = require("discord.js");

module.exports = {
	name: 'redbuttons',
  aliases: ['red_buttons', 'brokencontrols', 'broken_controls'],
	description: 'Provides the link to the "On the issue of red buttons and locked tires" video.',
  result(_client, message, args, embed) {
    // Do not return an embed object, as you do not want an embed for links to videos only
    let text = "https://www.youtube.com/watch?v=HevCJ4Uo_G0";
    return text;
  }
};
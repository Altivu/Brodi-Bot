const Discord = require("discord.js");

module.exports = {
	name: 'burstcharge',
  aliases: ['burst_charge'],
	description: 'Provides the link to the Burst Charge tutorial.',
  result(_client, message, args, embed) {
    // Do not return an embed object, as you do not want an embed for links to videos only
    let text = "https://youtu.be/fF299ueuucQ";
    return text;
  }
};
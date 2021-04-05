const Discord = require("discord.js");

module.exports = {
	name: 'burstcharge',
   aliases: ['burst_charge'],
	description: 'Provides the link to the Burst Charge tutorial.',
  cooldown: 5,
  result(message, args, embed) {
    message.channel.send("https://youtu.be/fF299ueuucQ");
    // Do not return anything here as you do not want an embed for links to videos only
    return;
  }
};
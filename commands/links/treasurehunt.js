const Discord = require("discord.js");

module.exports = {
	name: 'treasurehunt',
	description: 'Provides the link to a treasure hunt image with details.',
  cooldown: 5,
  result(message, args) {
    const embed = new Discord.MessageEmbed()
    .setTitle("Treasure Hunt Information")
    .setImage("https://cdn.discordapp.com/attachments/736242978116468827/826893346604843008/TH_actualizado_31_de_marzo_COLORES_.jpg")

    return embed;
  }
};
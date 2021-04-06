module.exports = {
	name: 'treasurehunt',
  aliases: ['treasure_hunt'],
	description: 'Provides the link to a treasure hunt image with details.',
  result(_client, message, args, embed) {
    embed.setTitle("Treasure Hunt Information")
    .setImage("https://cdn.discordapp.com/attachments/736242978116468827/826893346604843008/TH_actualizado_31_de_marzo_COLORES_.jpg")

    return embed;
  }
};
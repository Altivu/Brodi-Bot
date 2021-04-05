module.exports = {
	name: 'beep',
	description: 'Beep!',
  result(message, args, embed) {
    embed.setDescription("Boop.")

    return embed;
  }
};
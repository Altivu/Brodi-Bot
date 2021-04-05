module.exports = {
	name: 'beep',
	description: 'Beep!',
  cooldown: 5,
  result(message, args, embed) {
    embed.setDescription("Boop.")

    return embed;
  }
};
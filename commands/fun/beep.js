module.exports = {
	name: 'beep',
	description: 'Beep!',
  result(_client, message, args, embed) {
    embed.setDescription("Boop.")

    return embed;
  }
};
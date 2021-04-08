module.exports = {
	name: 'ping',
	description: 'Ping!',
  result(_client, message, args, embed) {
    embed.setDescription("Pong.")

    return embed;
  }
};
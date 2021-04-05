module.exports = {
	name: 'ping',
	description: 'Ping!',
  result(message, args, embed) {
    embed.setDescription("Pong.")

    console.log(embed)

    return embed;
  }
};
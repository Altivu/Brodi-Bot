module.exports = {
	name: 'ping',
	description: 'Ping!',
  cooldown: 5,
  result(message, args, embed) {
    embed.setDescription("Pong.")

    console.log(embed)

    return embed;
  }
};
module.exports = {
	name: 'championshipmode',
  aliases: ['championship_mode', 'championship'],
	description: 'Provides a link to my Overview of Championship Mode Reddit post.',
  result(_client, message, args, embed) {
    embed.setTitle("Overview of Championship Mode")
    .setDescription(`https://www.reddit.com/r/Kartrider/comments/irnjic/overview_of_championship_mode/`)

    return embed;
  }
};
module.exports = {
	name: 'energyarena',
  aliases: ['energy_arena'],
	description: 'Provides a link to my Overview of Energy Arena Reddit post.',
  result(_client, message, args, embed) {
    embed.setTitle("Overview of Energy Arena")
    .setDescription(`https://www.reddit.com/r/Kartrider/comments/l8blb5/overview_of_energy_arena/`)

    return embed;
  }
};
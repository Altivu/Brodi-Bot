module.exports = {
	name: 'tutorial',
  aliases: ['tutorials, drift'],
	description: 'Provides some links to basic drifting guides.',
  result(_client, message, args, embed) {
    embed.setTitle("Drifting Tutorials")
    .setDescription(`[Drifting 101 (by phreaky)](https://www.youtube.com/watch?v=YJuaIdPFnB4)
    [The Road to Mastering Drag Drifts series (by 幸板砖, translated by MadCarroT)](https://www.youtube.com/watch?v=hndh4E_kbDw&list=PL3lisfoN_cJWbhh6pczZjo74HNzZHgyrG&index=1)`)

    return embed;
  }
};
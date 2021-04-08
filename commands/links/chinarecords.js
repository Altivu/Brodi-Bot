module.exports = {
	name: 'chinarecords',
  aliases: ['china_records', 'recordschina', 'records_china'],
	description: 'Provides the link to top track records on China server (last updated 2021-04-07).',
  result(_client, message, args, embed) {
    embed.setTitle("China Server Records")
    embed.setDescription("Translated by AltiV. [Original image here](https://media.discordapp.net/attachments/761409996399181845/829662654556798986/image0.png). Last updated 2021-04-07.")
    .setImage("https://cdn.discordapp.com/attachments/828682591913377884/829791602796920832/China20Records20Translated.png")

    return embed;
  }
};
module.exports = {
	name: 'manual',
  aliases: ['wiki'],
	description: 'Provides the link to the KartRider Rush+ Unofficial Manual.',
  result(message, args, Qembed) {
    embed.setTitle("KartRider Rush+ Unofficial Manual")
    .setDescription("https://krrplus.web.app/")

    return embed;
  }
};
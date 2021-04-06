module.exports = {
	name: 'about',
  aliases: ['aboutme', 'about_me'],
	description: 'Quick summary of the bot.',
  result(client, message, args, embed) {
    embed.setTitle(`${client.user.username} Bot`)
    .setDescription("Provides information on various KartRider Rush+ content. Created by <@194612164474961921> as a test project.")
    .setThumbnail(client.user.displayAvatarURL())

    return embed;
  }
};
// When the bot is removed from a server, run this code

module.exports = {
	name: 'guildCreate',
	once: false,
	execute(guild) {
    console.log(`Bot has been removed from ${guild.name}.`);

    guild.client.user.setActivity(`${guild.client.guilds.cache.size} servers`, {
      type: 'WATCHING',
    });
	},
};

// When the bot joins a server, run this code

module.exports = {
	name: 'guildCreate',
	once: false,
	execute(guild) {
    console.log(`Bot has been added to ${guild.name}.`);

    guild.client.user.setActivity(`${guild.client.guilds.cache.size} servers`, {
      type: 'WATCHING',
    });
	},
};
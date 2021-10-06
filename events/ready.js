// When the client is ready, run this code (only once)

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Client is ready! Logged in as ${client.user.tag}`);
    console.log(
      `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
    );

    client.user.setActivity(`${client.guilds.cache.size} servers`, {
      type: 'WATCHING',
    });
  },
};

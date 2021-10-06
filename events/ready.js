// When the client is ready, run this code (only once)

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Client is ready! Logged in as ${client.user.tag}`);
	},
};
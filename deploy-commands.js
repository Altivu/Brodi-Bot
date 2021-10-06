// To update replit version of node to v16 (to use @discordjs/builders library among others), follow the instructions in the following link:
// https://replit.com/talk/learn/Easiest-way-to-get-Node-v166-for-your-Discordjs-v13-projects/143841

const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];

// Return an array of all the sub-folder names in the commands folder
const commandFolders = fs.readdirSync('./commands');

// In a nested for loop, set all of the commands in the client.commands collection, importing the necessary files
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);

    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

console.log(commands)

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

// // This is to create guild commands
// rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands })
// 	.then(() => console.log('Successfully registered application guild commands.'))
// 	.catch(console.error);

// This is to create global commands
rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands })
	.then(() => console.log('Successfully registered application global commands.'))
	.catch(console.error);
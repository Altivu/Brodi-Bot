// Deploying on Heroku:
// https://elements.heroku.com/buildpacks/synicalsyntax/discord.js-heroku

// To run heroku local with hot reload, use the following command:
// nodemon --exec "heroku local" --signal SIGTERM

const fs = require('fs');
const dotenv = require('dotenv');

// Require the necessary discord.js classes
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Uptime Robot - keep server running with constant checks
const { keepAlive, synchronizeGoogleSheetsData } = require('./server');

// Google Sheets authentication
const auth = require('./auth.js');

// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require('./guildSettings.js');

/////////////////
// BEGIN LOGIC //
/////////////////

// Set up dotenv configuration (not required for repl.it, but required in standard node.js running)
dotenv.config();

// Create a new client instance
// GatewayIntentBits.DIRECT_MESSAGES and Partials.Channel is expicitly needed to allow usage of prefix commands in direct messages
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// Create a new collection for commands
client.commands = new Collection();

// Create a new collection for cooldowns (specifically for prefix commands, although they aren't really being used...)
client.cooldowns = new Collection();

////////////////////
// EVENT HANDLING //
////////////////////

// Search for all client events files as an array
const eventFiles = fs
  .readdirSync('./events')
  .filter(file => file.endsWith('.js'));

// For each event file, set up the event on the client
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args,oAuth2Client));
  }
}

//////////////////////////////
// SET APPLICATION COMMANDS //
//////////////////////////////

// // Delete all commands
// client.commands.set([]).then(console.log).catch(console.error);

// Return an array of all the sub-folder names in the commands folder
const commandFolders = fs.readdirSync('./commands');

// In a nested for loop, set all of the commands in the client.commands collection, importing the necessary files
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);

    // Only work with files that have the proper information
    if (command.data != null) {
      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      client.commands.set(command.data.name, command);
    }
  }
}

// Acquire OAuth2Client Authorization (primarily for usage with Google Sheets)
const oAuth2Client = auth.authorize();

// Do a preliminary synchronization before starting up the bot
client.commands.get("synchronize").execute(client, null, [], null, oAuth2Client);

// Utilize Uptime Robot to keep bot running by starting an express server and having it be constantly pinged
keepAlive();

// Run the synchronization every day at 3 am
synchronizeGoogleSheetsData("0 3 * * *", client, oAuth2Client);

// Login to Discord with your client's token
client.login(process.env.TOKEN).then(response => {
  console.log("Client login succeeded:");
  console.log(response);
}).catch(error => {
  console.log("Client login failed:");
  console.log(error);
});

// // Delete all global slash commands
// client.application?.commands.set([]).then(console.log).catch(console.error);

// // "Fixing" 429 Rate Limit Error
// // https://replit.com/talk/ask/Discord-Bot-How-to-fix-429-rate-limit-error/121289
// // "It turns out that you can run kill 1 in the shell tab to destroy the current container and switch to a new one. This fixed it for me."

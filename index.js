const fs = require('fs');

// Require the necessary discord.js classes
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');

// Require configuration variables
const {
  prefix,
  embed_color,
  default_command_cooldown,
  embed_color_error,
} = require('./config.json');

// Create a new client instance
// Intents.FLAGS.DIRECT_MESSAGES and CHANNEL partial is expicitly needed to allow usage of prefix commands in direct messages
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
  partials: ['CHANNEL'],
});

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

// Create a new collection for commands
client.commands = new Collection();

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

// // Uptime Robot - keep server running with constant checks
// const keepAlive = require('./server');

// Google Sheets authentication
const auth = require('./auth.js');

// // Logging
// const logging = require('./logging.js');

// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require('./guildSettings.js');
// const slashCommandsErrorObject = require('./slashCommandsErrorObject.js');

// Establish oAuth2Client variable for connection to Google Sheets API
let oAuth2Client;

// // Create a new Discord client, initializing empty commands and cooldowns collections
// const client = new Discord.Client();
// client.commands = new Discord.Collection();
client.cooldowns = new Collection();

// // Slash commands reference (OUTDATED): https://www.youtube.com/watch?v=-YxuSSG_O6g

// // Function to get reference to guild/server
// const getApp = guildId => {
//   const app = client.api.applications(client.user.id);

//   if (guildId) {
//     app.guilds(guildId);
//   }
//   return app;
// };

// // Function to create a reply via slash commands, which cannot rely on standard message API
// const reply = async (interaction, response) => {
//   let data = {
//     content: response,
//   };

//   // Check for embeds
//   if (typeof response === 'object') {
//     // Custom function
//     data = await createAPIMessage(interaction, response);
//   }

//   if (!data) return;

//   let { id, token } = interaction;

//   client.api.interactions(id, token).callback.post({
//     data: {
//       type: 4,
//       data,
//     },
//   });
// };

// // Cannot directly send embed; function to create own API message to send correctly
// const createAPIMessage = async (interaction, content) => {
//   // Pass in channel
//   // Resolve data and resolve files (gives access to actual embed as well as any other files this method may use in the future)
//   const apiMessage = await Discord.APIMessage.create(
//     client.channels.resolve(interaction.channel_id),
//     content
//   );
//   // .resolveData()
//   // .resolveFiles();

//   // ISSUE: There is an issue with "Cannot read property 'client' of null" when trying to call resolveData() sometimes, typically when restarting the bot or it has been sitting idle for a while. Calling a prefix command usually gets it working again, but I don't know how to fix this properly yet. In the meantime, just provide a message saying to run the command with prefix first.
//   if (apiMessage['target']) {
//     const { data, files } = await apiMessage.resolveData().resolveFiles();

//     return { ...data, files };
//   } else {
//     const data = slashCommandsErrorObject;
//     const files = [];

//     return { ...data, files };
//   }
// };

// /////////////////
// // BEGIN LOGIC //
// /////////////////

// // Return an array of all the sub-folder names in the commands folder
// const commandFolders = fs.readdirSync('./commands');

// // In a nested for loop, set all of the commands in the client.commands collection, importing the necessary files
// for (const folder of commandFolders) {
//   const commandFiles = fs
//     .readdirSync(`./commands/${folder}`)
//     .filter(file => file.endsWith('.js'));
//   for (const file of commandFiles) {
//     const command = require(`./commands/${folder}/${file}`);

//     if (command && command.name) {
//       client.commands.set(command.name, command);
//     }
//   }
// }

// Acquire OAuth2Client Authorization (primarily for usage with Google Sheets)
oAuth2Client = auth.authorize();

// // When the client is ready, run this code
// // This event will only trigger one time after logging in
// client.once('ready', async () => {
//   console.log(`Logged in as ${client.user.tag}.`);

//   console.log(
//     `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
//   );

//   client.user.setActivity(`${client.guilds.cache.size} servers`, {
//     type: 'WATCHING',
//   });

//   // Print out all existing commands (running this on a fresh project will return nothing)
//   const commands = await getApp().commands.get();
//   // // Print list of slash commands (need to refer to this to delete by id if required)
//   // console.log(commands);

//   // // Delete command by id
//   // await getApp().commands('829629810745671680').delete()
//   // await getApp().commands('829629717627011073').delete()
//   // await getApp().commands('829629716856045579').delete()

//   // Example code of me re-POSTing a particular command data
//   // let commandToRepost = client.commands.find(c => c.name === "kart");

//   // if (commandToRepost) {
//   //   const { name, description, options } = commandToRepost;
//   //   const data = { name, description, options };

//   //   await getApp().commands.post({data});
//   //   console.log("POSTED new command data.");
//   // }

//   // Add slash commands to the application
//   for (let command of client.commands) {
//     //     // Example command output
//     //     [
//     //   "badge",
//     //   {
//     //     name: "badge",
//     //     description:
//     //       "Provides badge details. Search by arguments or provide nothing to get a random badge.",
//     //     options: [[Object]],
//     //     result: [(AsyncFunction: result)],
//     //   },
//     // ]
//     const { name, description, options } = command[1];

//     // POST new command for slash commands if it does not exist in the commands list yet
//     if (commands.find(obj => obj['name'] === name) === undefined) {
//       let data;

//       if (options) {
//         data = { name, description, options };
//       } else {
//         data = { name, description };
//       }

//       await getApp().commands.post({ data });
//     }
//   }

//   ////////////////////
//   // SLASH COMMANDS //
//   ////////////////////

//   // Accessing command via slash commands
//   // "An interaction is the base "thing" that is sent when a user invokes a command, and is the same for Slash Commands and other future interaction types."
//   client.ws.on('INTERACTION_CREATE', async interaction => {
//     // Logging
//     // Date, User, Command Type, Command, Options,   Server
//     let slashPayload = [
//       [
//         new Date(),
//         interaction['user']
//           ? interaction['user']['username']
//           : interaction['member']['user']['username'],
//         'Slash',
//         interaction['data']['name'],
//         JSON.stringify(interaction['data']['options']),
//         client.guilds.cache.get(interaction['guild_id'])
//           ? client.guilds.cache.get(interaction['guild_id'])['name']
//           : '',
//       ],
//     ];

//     // Begin logging data to Google Sheet
//     logging.logData(slashPayload, oAuth2Client);

//     let embed = new Discord.MessageEmbed();
//     // Check to see if the slash command results in an error
//     let bError = false;

//     try {
//       // For specific guilds, restrict the command to specific channels
//       if (interaction.guild_id && interaction.channel_id) {
//         const channel = client.channels.cache.find(
//           ch => ch.id === interaction.channel_id
//         );

//         embed.setColor(embed_color_error);

//         if (!channel || !channel.name) {
//           bError = true;

//           embed.setDescription(
//             'An error has occured attempting to parse the channel.'
//           );
//         }
//         // If the guild/server is in the settings list and the command is attempted to be used in the "incorrect" channel, do not proceed
//         else if (
//           guildSettings[interaction.guild_id] &&
//           !guildSettings[interaction.guild_id]['permittedChannels'].includes(
//             channel.name.toLocaleLowerCase()
//           )
//         ) {
//           bError = true;

//           console.log(
//             `${
//               guildSettings[interaction.guild_id]['name']
//             } - Bot command attempted to be used in '${
//               channel.name
//             }' channel; aborting.`
//           );

//           embed.setDescription(
//             'Please use this command in the appropriate channel.'
//           );
//         }
//       }

//       if (bError) {
//         reply(interaction, embed);
//         return;
//       }

//       // interaction.data object example data:
//       // {
//       //   options: [
//       //     { value: 'abc', type: 3, name: 'name' },
//       //     { value: 123, type: 4, name: 'age' }
//       //   ],
//       //   name: 'embed',
//       //   id: '829594161748770816'
//       // }
//       const { name, options } = interaction.data;

//       const command =
//         client.commands.get(name.toLowerCase()) ||
//         client.commands.find(
//           cmd => cmd.aliases && cmd.aliases.includes(name.toLowerCase())
//         );

//       if (!command) return;

//       // Parse the data to make it easier to work with
//       const args = [];

//       if (options) {
//         for (const option of options) {
//           args.push(option.value);
//         }
//       }

//       const now = Date.now();

//       embed.setColor(embed_color);

//       if (command.result.constructor.name === 'AsyncFunction') {
//         command
//           .result(client, interaction, args, embed, oAuth2Client)
//           .then(result => {
//             embed = result;

//             if (typeof embed === 'object' && embed.setFooter) {
//               embed.setFooter(`Response time: ${Date.now() - now} ms`);
//               reply(interaction, embed);
//               // This is specifically for the kart tierlist command, which requires more than one embed to return all the contents
//               // Can't get it to work with slash commands so going to redirect the user to use prefix for now...
//             } else if (Array.isArray(embed)) {
//               // embed.forEach((msg, index) => reply(interaction, msg));

//               let errorEmbed = new Discord.MessageEmbed();
//               errorEmbed.setColor(embed_color_error);
//               errorEmbed.setDescription(
//                 `Please use this command with the '${prefix}' prefix (currently not working with slash commands).`
//               );

//               reply(interaction, errorEmbed);
//             } else {
//               reply(interaction, result);
//             }
//           });
//       } else {
//         embed = command.result(client, interaction, args, embed, oAuth2Client);

//         if (embed.setFooter) {
//           embed.setFooter(`Response time: ${Date.now() - now} ms`);
//         }

//         reply(interaction, embed);
//       }
//     } catch (error) {
//       console.error(error);
//       embed.setDescription(error);
//       reply(interaction, embed);
//     }
//   });
// });

// // Utilize Uptime Robot to keep bot running
// keepAlive();

// Login to Discord with your client's token
client.login(process.env.TOKEN);

// // "Fixing" 429 Rate Limit Error
// // https://replit.com/talk/ask/Discord-Bot-How-to-fix-429-rate-limit-error/121289
// // "It turns out that you can run kill 1 in the shell tab to destroy the current container and switch to a new one. This fixed it for me."

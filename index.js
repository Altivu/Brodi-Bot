const fs = require("fs");
const Discord = require("discord.js");

// Uptime Robot - keep server running with constant checks
const keepAlive = require("./server");
// Configuration variables
const {
  prefix,
  embed_color,
  default_command_cooldown,
  embed_color_error,
} = require("./config.json");
// Google Sheets authentication
const auth = require("./auth.js");
// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require("./guildSettings.js");
const slashCommandsErrorObject = require("./slashCommandsErrorObject.js");

let oAuth2Client;

// Create a new Discord client, initializing empty commands and cooldowns collections
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

// Slash commands reference: https://www.youtube.com/watch?v=-YxuSSG_O6g

// Function to get reference to guild/server
const getApp = (guildId) => {
  const app = client.api.applications(client.user.id);

  if (guildId) {
    app.guilds(guildId);
  }
  return app;
};

// Function to create a reply via slash commands, which cannot rely on standard message API
const reply = async (interaction, response) => {
  let data = {
    content: response,
  };

  // Check for embeds
  if (typeof response === "object") {
    // Custom function
    data = await createAPIMessage(interaction, response);
  }

  if (!data) return;

  let { id, token } = interaction;

  client.api.interactions(id, token).callback.post({
    data: {
      type: 4,
      data,
    },
  });
};

// Cannot directly send embed; function to create own API message to send correctly
const createAPIMessage = async (interaction, content) => {
  // Pass in channel
  // Resolve data and resolve files (gives access to actual embed as well as any other files this method may use in the future)
  const apiMessage = await Discord.APIMessage.create(
    client.channels.resolve(interaction.channel_id),
    content
  );
  // .resolveData()
  // .resolveFiles();

  // ISSUE: There is an issue with "Cannot read property 'client' of null" when trying to call resolveData() sometimes, typically when restarting the bot or it has been sitting idle for a while. Calling a prefix command usually gets it working again, but I don't know how to fix this properly yet. In the meantime, just provide a message saying to run the command with prefix first.
  if (apiMessage["target"]) {
    const { data, files } = await apiMessage.resolveData().resolveFiles();

    return { ...data, files };
  } else {
    const data = slashCommandsErrorObject;
    const files = [];

    return { ...data, files };
  }
};

/////////////////
// BEGIN LOGIC //
/////////////////

// Return an array of all the sub-folder names in the commands folder
const commandFolders = fs.readdirSync("./commands");

// In a nested for loop, set all of the commands in the client.commands collection, importing the necessary files
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);

    if (command && command.name) {
      client.commands.set(command.name, command);
    }
  }
}

// Acquire OAuth2Client Authorization (primarily for usage with Google Sheets)
oAuth2Client = auth.authorize();

// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}.`);

  console.log(
    `Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`
  );

  client.user.setActivity(`${client.guilds.cache.size} servers`, {
    type: "WATCHING",
  });

  // Print out all existing commands (running this on a fresh project will return nothing)
  const commands = await getApp().commands.get();
  // // Print list of slash commands (need to refer to this to delete by id if required)
  // console.log(commands);

  // // Delete command by id
  // await getApp().commands('829629716930625536').delete()
  // await getApp().commands('829629717627011073').delete()
  // await getApp().commands('829629716856045579').delete()

  // // Example code of me re-POSTing the info command data
  // let infoCommand = client.commands.find(c => c.name === "info");

  // if (infoCommand) {
  //   const { name, description, options } = infoCommand;
  //   const data = { name, description, options };

  //   await getApp().commands.post({data});
  //   console.log("POSTED info command data.");
  // }

  // Add slash commands to the application
  for (let command of client.commands) {
    //     // Example command output
    //     [
    //   "badge",
    //   {
    //     name: "badge",
    //     description:
    //       "Provides badge details. Search by arguments or provide nothing to get a random badge.",
    //     options: [[Object]],
    //     result: [(AsyncFunction: result)],
    //   },
    // ]
    const { name, description, options } = command[1];

    // POST new command for slash commands if it does not exist in the commands list yet
    if (commands.find((obj) => obj["name"] === name) === undefined) {
      let data;

      if (options) {
        data = { name, description, options };
      } else {
        data = { name, description };
      }

      await getApp().commands.post({ data });
    }
  }

  ////////////////////
  // SLASH COMMANDS //
  ////////////////////

  // Accessing command via slash commands
  // "An interaction is the base "thing" that is sent when a user invokes a command, and is the same for Slash Commands and other future interaction types."
  client.ws.on("INTERACTION_CREATE", async (interaction) => {
    let embed = new Discord.MessageEmbed();

    try {
      // For specific guilds, restrict the command to specific channels
      if (interaction.guild_id && interaction.channel_id) {
        const channel = client.channels.cache.find(
          (ch) => ch.id === interaction.channel_id
        );

        embed.setColor(embed_color_error);

        if (!channel || !channel.name) {
          embed.setDescription(
            "An error has occured attempting to parse the channel."
          );
          reply(interaction, embed);
          return;
        }

        // If the guild/server is in the settings list and the command is attempted to be used in the "incorrect" channel, do not proceed
        if (
          guildSettings[interaction.guild_id] &&
          !guildSettings[interaction.guild_id]["permittedChannels"].includes(
            channel.name.toLocaleLowerCase()
          )
        ) {
          embed.setDescription(
            "Please use this command in the appropriate channel."
          );
          reply(interaction, embed);
          console.log(
            `${
              guildSettings[interaction.guild_id]["name"]
            } - Bot command attempted to be used in '${
              channel.name
            }' channel; aborting.`
          );
          return;
        }
      }

      // interaction.data object example data:
      // {
      //   options: [
      //     { value: 'abc', type: 3, name: 'name' },
      //     { value: 123, type: 4, name: 'age' }
      //   ],
      //   name: 'embed',
      //   id: '829594161748770816'
      // }
      const { name, options } = interaction.data;

      const command =
        client.commands.get(name.toLowerCase()) ||
        client.commands.find(
          (cmd) => cmd.aliases && cmd.aliases.includes(name.toLowerCase())
        );

      if (!command) return;

      // Parse the data to make it easier to work with
      const args = [];

      if (options) {
        for (const option of options) {
          args.push(option.value);
        }
      }

      const now = Date.now();

      embed.setColor(embed_color);

      if (command.result.constructor.name === "AsyncFunction") {
        command
          .result(client, interaction, args, embed, oAuth2Client)
          .then((result) => {
            embed = result;

            if (typeof embed === "object" && embed.setFooter) {
              embed.setFooter(`Response time: ${Date.now() - now} ms`);
              reply(interaction, embed);
            } else {
              reply(interaction, result);
            }
          });
      } else {
        embed = command.result(client, interaction, args, embed, oAuth2Client);

        if (embed.setFooter) {
          embed.setFooter(`Response time: ${Date.now() - now} ms`);
        }

        reply(interaction, embed);
      }
    } catch (error) {
      console.error(error);
      embed.setDescription(error);
      reply(interaction, embed);
    }
  });
});

/////////////////////
// PREFIX COMMANDS //
/////////////////////

// Accessing command via prefix
// Listen for any message that is sent which is visible to the bot
// The function is designated as asynchronous, as this bot will be pulling data from other websites and thus needs to ensure logic is executed in desired order
client.on("message", async (message) => {
  // Ignore any messages that do not have the desired prefix or that is sent by a(nother) bot to prevent infinite loops
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // For specific guilds, restrict the command to specific channels
  if (message.guild && message.channel) {
    // If the guild/server is in the settings list and the command is attempted to be used in the "incorrect" channel, do not proceed
    if (
      guildSettings[message.guild.id] &&
      !guildSettings[message.guild.id]["permittedChannels"].includes(
        message.channel.name.toLocaleLowerCase()
      )
    ) {
      let embed = new Discord.MessageEmbed();
      embed.setColor(embed_color_error);
      embed.setDescription(
        "Please use this command in the appropriate channel."
      );
      message.channel.send(embed);

      console.log(
        `${
          guildSettings[message.guild.id]["name"]
        } - Bot command attempted to be used in '${
          message.channel.name
        }' channel; aborting.`
      );
      return;
    }
  }

  // Split the message into the commandName and the arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // If the commandName (or any of its aliases) doesn't exist in the commands collection, end logic
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  // // Logic to handle server-only commands (this currently isn't used)
  // if (command.guildOnly && message.channel.type === "dm") {
  //   return message.reply("I can't execute that command inside DMs!");
  // }

  // Logic to handle argument-mandatory commands
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  // Handle cooldowns on commands
  const { cooldowns } = client;

  // If the cooldowns collection does not have the command name in it, add it as a key, with a new collection as its value
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || default_command_cooldown) * 1000;

  // Create and send cooldown embed if command hasn't fully cooled down yet
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      let cooldownEmbed = new Discord.MessageEmbed();
      cooldownEmbed
        .setColor(embed_color_error)
        .setDescription(
          `Please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${command.name}\` command.`
        );

      return message.channel.send(cooldownEmbed).then((msg) => {
        // Maybe don't need to delete message for now
        // msg.delete({ timeout: timeLeft * 1000 });
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // let loadingMessage;

  // Retrieve data from command (which is placed into an embed before passing it here), and set the standard colour and response time footer which is consistent for all commands
  try {
    // message.channel.send(new Discord.MessageEmbed().setDescription("Loading...").setColor(embed_color_error)).then((msg) =>
    //   // TODO: It would be ideal to have this loading message persist until the command successfully runs, and then delete it, but there are issues with persisting the variable
    //   loadingMessage = msg
    // );

    let embed = new Discord.MessageEmbed();
    embed.setColor(embed_color);

    if (command.result.constructor.name === "AsyncFunction") {
      command
        .result(client, message, args, embed, oAuth2Client)
        .then((result) => {
          if (result && result.setFooter) {
            embed = result;
            embed.setFooter(`Response time: ${Date.now() - now} ms`);
            message.channel.send(embed);
          } else if (typeof result === "string") {
            message.channel.send(result);
          }
        });
    } else {
      embed = command.result(client, message, args, embed, oAuth2Client);

      if (embed && embed.setFooter) {
        embed.setFooter(`Response time: ${Date.now() - now} ms`);
        message.channel.send(embed);
        // Techncially not an embed in this scenario
      } else if (typeof embed === "string") {
        message.channel.send(embed);
      }
    }
  } catch (error) {
    console.error(error);
    message.reply("There was an error trying to execute that command!");
  }
});

// Joined a server
client.on("guildCreate", (guild) => {
  console.log(`Bot has been added to ${guild.name}.`);

  client.user.setActivity(`${client.guilds.cache.size} servers`, {
    type: "WATCHING",
  });
});

// Removed from a server
client.on("guildDelete", (guild) => {
  console.log(`Bot has been removed from ${guild.name}.`);

  client.user.setActivity(`${client.guilds.cache.size} servers`, {
    type: "WATCHING",
  });
});

// Utilize Uptime Robot to keep bot running
keepAlive();

// Login to Discord with your app's token
client.login(process.env.TOKEN);

// // Track debug events
// client.on('debug', (...args) => console.log('debug', ...args));
// Track rate limit events
client.on('rateLimit', (...args) => console.log('rateLimit', ...args));

// "Fixing" 429 Rate Limit Error
// https://replit.com/talk/ask/Discord-Bot-How-to-fix-429-rate-limit-error/121289
// "It turns out that you can run kill 1 in the shell tab to destroy the current container and switch to a new one. This fixed it for me."
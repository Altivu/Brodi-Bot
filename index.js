const fs = require("fs");
const Discord = require("discord.js");

const fetch = require("node-fetch");

const {
  prefix,
  embed_color,
  default_command_cooldown,
} = require("./config.json");
const auth = require("./auth.js");

let oAuth2Client;

// Create a new Discord client, initializing empty commands and cooldowns collections
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

// Return an array of all the sub-folder names in the commands folder
const commandFolders = fs.readdirSync("./commands");

// In a nested for loop, set all of the commands in the client.commands collection, importing the necessary files
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    client.commands.set(command.name, command);
  }
}

///////////////
// FUNCTIONS //
///////////////

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listContent(auth) {
  const sheets = google.sheets({ version: "v4", auth });

  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: "Karts Raw!A2:D4",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;

      if (rows.length) {
        return rows;
        rows.map((row) => {
          console.log(`${row[0]}, ${row[1]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}

/////////////////
// BEGIN LOGIC //
/////////////////

// oAuth2Client = auth.authorize();

// When the client is ready, run this code
// This event will only trigger one time after logging in
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}.`);
});

// Listen for any message that is sent which is visible to the bot
// The function is designated as asynchronous, as this( bot will be pulling data from other websites and thus needs to ensure logic is executed in desired order
client.on("message", async (message) => {
  // Ignore any messages that do not have the desired prefix or that is sent by a(nother) bot to prevent infinite loops
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // Split the message into the commandName and the arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // If the commandName doesn't exist in the commands collection, end logic
  if (!client.commands.has(commandName)) return;

  const command = client.commands.get(commandName);

  // Logic to handle server-only commands
  if (command.guildOnly && message.channel.type === "dm") {
    return message.reply("I can't execute that command inside DMs!");
  }

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

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `Please wait ${timeLeft.toFixed(
          1
        )} more second(s) before reusing the \`${command.name}\` command.`
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Retrieve data from command (which is placed into an embed before passing it here), and set the standard colour and response time footer which is consistent for all commands
  try {
    let embed = new Discord.MessageEmbed();
    embed.setColor(embed_color);

    if (command.result.constructor.name === "AsyncFunction") {
      command.result(message, args, embed, oAuth2Client).then((result) => {
        embed = result;
        embed.setFooter(`Response time: ${Date.now() - now} ms`);
        message.channel.send(embed);
      });
    } else {
      embed = command.result(message, args, embed, oAuth2Client);
      embed.setFooter(`Response time: ${Date.now() - now} ms`);
      message.channel.send(embed);
    }
  } catch (error) {
    console.error(error);
    message.reply("There was an error trying to execute that command!");
  }
});

// Login to Discord with your app's token
client.login(process.env.TOKEN);

/////////////////////
// PREFIX COMMANDS //
/////////////////////

// Require the necessary discord.js classes
const { Collection, MessageEmbed } = require('discord.js');

// Require configuration variables
const {
  prefix,
  embed_color,
  default_command_cooldown,
  embed_color_error,
} = require('../config.json');

// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require('../guildSettings.js');

module.exports = {
	name: 'messageCreate',
	once: false,
	async execute(message, oAuth2Client) {
  // Ignore any messages that do not have the desired prefix or that is sent by a(nother) bot to prevent infinite loops
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // For specific guilds, restrict the command to specific channels
  if (message.guild && message.channel) {
    // If the guild/server is in the settings list and the command is attempted to be used in the "incorrect" channel, do not proceed
    if (
      guildSettings[message.guild.id] &&
      !guildSettings[message.guild.id]['permittedChannels'].includes(
        message.channel.name.toLocaleLowerCase()
      )
    ) {
      let embed = new MessageEmbed()
        .setColor(embed_color_error)
        .setDescription('Please use this command in the appropriate channel.');

      message.channel.send(embed);

      console.log(
        `${
          guildSettings[message.guild.id]['name']
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

  // // Logging
  // // Date, User, Command Type, Command, Options,   Server
  // let prefixPayload = [
  //   [
  //     new Date(),
  //     message['author']['username'],
  //     'Prefix',
  //     commandName,
  //     `[${args.toString()}]`,
  //     message['channel']['guild'] &&
  //     message.client.guilds.cache.get(message['channel']['guild']['id'])
  //       ? message.client.guilds.cache.get(message['channel']['guild']['id'])['name']
  //       : '',
  //   ],
  // ];

  // logging.logData(prefixPayload, oAuth2Client);

  // If the commandName (or any of its aliases) doesn't exist in the commands collection, end logic
  const command =
    message.client.commands.get(commandName) ||
    message.client.commands.find(
      cmd => cmd.aliases && cmd.aliases.includes(commandName)
    );

  if (!command) return;

  // Logic to handle argument-mandatory commands
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`;

    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  // Handle cooldowns on commands
  const { cooldowns } = message.client;

  // If the cooldowns collection does not have the command name in it, add it as a key, with a new collection as its value
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || default_command_cooldown) * 1000;

  // Create and send cooldown embed if command hasn't fully cooled down yet
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      let cooldownEmbed = new MessageEmbed();
      cooldownEmbed
        .setColor(embed_color_error)
        .setDescription(
          `Please wait ${timeLeft.toFixed(
            1
          )} more second(s) before reusing the \`${command.name}\` command.`
        );

      return message.channel.send(cooldownEmbed).then(msg => {
        // // Maybe don't need to delete message for now
        // msg.delete({ timeout: timeLeft * 1000 });
      });
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // If all above checks have passed
  // Retrieve data from command (which is placed into an embed before passing it here), and set the standard colour and response time footer which is consistent for all commands
  try {
    // Create a loading message, and edit it once the data is returned (better UX)
    message.channel
      .send({
        embeds: [
          new MessageEmbed()
            .setDescription('Loading...')
            .setColor(embed_color_error),
        ],
      })
      .then(loadingMessage => {
        // Create a base embed to be used for all commands
        let embed = new MessageEmbed().setColor(embed_color);

        try {
          if (command.execute.constructor.name === 'AsyncFunction') {
            command
              .execute(message.client, message, args, embed, oAuth2Client)
              .then(result => {
                result?.embeds?.forEach(innerEmbed => {
                  innerEmbed.setFooter(`Response time: ${Date.now() - now} ms`);
                });

                // Edit the message with the new information once completed
                loadingMessage.edit(result);
              });
          } else {
            let result = command.execute(
              message.client,
              message,
              args,
              embed,
              oAuth2Client
            );

            result?.embeds?.forEach(innerEmbed => {
              innerEmbed.setFooter(`Response time: ${Date.now() - now} ms`);
            });

            // Edit the message with the new information once completed
            loadingMessage.edit(result);
          }
        } catch (error) {
          console.log(error);

          let embed = new MessageEmbed()
            .setDescription(error)
            .setColor(embed_color_error)
            .setFooter(`Response time: ${Date.now() - now} ms`);

          loadingMessage.edit({ embeds: [embed] });
        }
      });
  } catch (error) {
    console.error(error);
    message.reply('There was an error trying to execute that command!');
  }
	},
};
////////////////////
// SLASH COMMANDS //
////////////////////

// Require the necessary discord.js classes
const { MessageEmbed } = require('discord.js');

// Require configuration variables
const { embed_color, embed_color_error, banned_user_ids } = require('../config.json');

const { trim } = require('../utils/utils');

// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require('../guildSettings.js');

// Logging
const logging = require('../logging.js');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, oAuth2Client) {
    // Do not check logic for anything except slash commands
    if (!interaction.isCommand()) return;

    // Get the relevant command
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      // If user is on the banned list, do not allow them to run this
      if (banned_user_ids.includes(interaction.user.id)) {
        let bannedEmbed = new MessageEmbed()
          .setColor(embed_color_error)
          .setDescription('This bot has been disabled for you.');

        await interaction.reply({ embeds: [ bannedEmbed ], ephemeral: true });

        // Logging
        const payload = [
          [
            new Date(),
            interaction['user']['username'],
            'Slash',
            interaction['commandName'],
            JSON.stringify(interaction['options']),
            interaction['guildId'] ? interaction['member']['guild']['name'] : '',
            trim(JSON.stringify(bannedEmbed), 1024),
            'BANNED USER',
          ],
        ];

        logging.logData(payload, oAuth2Client);

        return;
      }

      // Track time prior to request
      const now = Date.now();

      // Defer the reply, as the data may take more than 3 seconds to be retrieved

      // // Use this line after people have gotten comfortable with the records update command and/or everyone wants it to be hidden
      // await interaction.deferReply( { ephemeral: interaction.commandName === "records" && interaction?.options?.getSubcommand() === "update" } );

      await interaction.deferReply();

      // Create a base embed to be used for all commands
      let embed = new MessageEmbed().setColor(embed_color);

      // If the guild/server is in the settings list and the command is attempted to be used in the "incorrect" channel, do not proceed
      if (
        guildSettings[interaction.guildId] &&
        !guildSettings[interaction.guildId]['permittedChannels'].includes(
          interaction.client.channels.cache
            .get(interaction['channelId'])
            ?.name?.toLocaleLowerCase()
        )
      ) {
        embed
          .setColor(embed_color_error)
          .setDescription(
            'Please use this command in the appropriate channel.'
          );

        await interaction.editReply({ embeds: [embed] });

        return;
      }

      // All of the commands will be programmed to return the content, as opposed to replying directly in the command, in order to support both prefix and slash commands
      let result = await command.execute(
        interaction.client,
        interaction,
        [],
        embed,
        oAuth2Client
      );

      result?.embeds?.forEach(innerEmbed => {
        innerEmbed
          // .setColor(embed_color)
          .setFooter(`Response time: ${Date.now() - now} ms`);
      });

      await interaction.editReply(result);

      // Logging
      const payload = [
        [
          new Date(),
          interaction['user']['username'],
          'Slash',
          interaction['commandName'],
          JSON.stringify(interaction['options']),
          interaction['guildId'] ? interaction['member']['guild']['name'] : '',
          trim(JSON.stringify(result), 1024),
          'COMPLETE',
        ],
      ];

      logging.logData(payload, oAuth2Client);
    } catch (error) {
      console.error(error);

      const errorEmbed = new MessageEmbed().setColor(embed_color_error)
        .setDescription(`There was an error while executing this command!

Error stack trace:
${error}
`);
      const result = { embeds: [errorEmbed] };

      // interaction.editReply(result) might throw an error if it fails to edit the interaction...
      try {
        await interaction.editReply(result);

        // Logging
        const payload = [
          [
            new Date(),
            interaction['user']['username'],
            'Slash',
            interaction['commandName'],
            JSON.stringify(interaction['options']),
            interaction['guildId'] ? interaction['member']['guild']['name'] : '',
            trim(JSON.stringify(result), 1024),
            'ERROR',
          ],
        ];

        logging.logData(payload, oAuth2Client);
      } catch (err) {
        console.error(err);
      }
    }
  },
};

////////////////////
// SLASH COMMANDS //
////////////////////

// Require the necessary discord.js classes
const { MessageEmbed } = require('discord.js');

// Require configuration variables
const {
  embed_color,
  embed_color_error,
} = require('../config.json');

// Variables for specific guilds (currently used for command restriction to certain channels)
const guildSettings = require('../guildSettings.js');

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
      // Track time prior to request
      const now = Date.now();

      // Defer the reply, as the data may take more than 3 seconds to be retrieved
      await interaction.deferReply();

      // Create a base embed to be used for all commands
      let embed = new MessageEmbed().setColor(embed_color);

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
    } catch (error) {
      console.error(error);

      let errorEmbed = new MessageEmbed().setColor(embed_color_error)
        .setDescription(`There was an error while executing this command!

Error stack trace:
${error}
`);
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};

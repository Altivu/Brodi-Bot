const { SlashCommandBuilder } = require('@discordjs/builders');

const { prefix, default_command_cooldown } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all of my commands or info about a specific command.')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Name of command.')
        .setRequired(false)
    ),
  async execute(
    client,
    interaction,
    args,
    embed,
    _oAuth2Client
  ) {
    const { commands } = client;

    const commandName = interaction?.options?.getString('command') || args[0];

    // No additional arguments provided: return list of commands
    if (!commandName) {
      embed
        .setTitle('List of Commands')
        .setDescription(`
Here's a list of all my commands:

${[...commands.keys()]
  .sort()
  .join(', ')}

You can send \`/help [command name]\` or \`${prefix}help [command name]\` to get info on a specific command!
      `);

      return { embeds: [embed] };
    }
    // Additional argument provided: return info on specific command
    else {
      const command =
        commands.get(commandName) ||
        commands.find(c => c.aliases && c.aliases.includes(commandName));

      if (!command) {
        embed.setDescription(`'${commandName}' is not a valid command.`);

        return { embeds: [embed] };
      }

      embed.setTitle(`Help for '${commandName}' command`);

      // Provided aliases, if applicable (only for prefix commands)
      if (command.aliases)
        embed.addFields({ name: 'Aliases', value: command.aliases.join(', ') });

      // Provide description, if applicable
      // helpDescription is specifically for the more complex commands, if there is more to explain
      if (command.helpDescription)
        embed.addFields({
          name: 'Description',
          value: command.helpDescription,
        });
      else if (command.data.description)
        embed.addFields({ name: 'Description', value: command.data.description });

      // Provide usage, if applicable
      if (command.usage)
        embed.addFields({
          name: 'Usage',
          value: `${prefix}${commandName} ${command.usage}`,
        });

      // Provide command cooldown, if applicable (only for prefix commands)
      if (command.cooldown || default_command_cooldown > 0) {
        embed.addFields({
          name: 'Cooldown',
          value: `${command.cooldown || default_command_cooldown} second(s)`,
        });
      }

      return { embeds: [embed] };
    }
  },
  aliases: ['commands, h'],
  usage: '[command name]',
};

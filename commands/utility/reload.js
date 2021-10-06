const { SlashCommandBuilder } = require('@discordjs/builders');

const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('(BOT CREATOR ONLY) Reloads a command.')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Name of command.')
        .setRequired(true)
    ),
  async execute(
    client,
    interaction,
    args,
    embed,
    _oAuth2Client
  ) {
    // Get the user id to check if the user is the bot creator (technically not needed for slash commands if permissions are properly set, but maybe for prefix commands)

    // Left is for slash commands, right is for prefix
    let userId = interaction?.user?.id || interaction?.author?.id;

    if (userId !== process.env.CREATOR_ID) {
      embed.setDescription(
        "Only the bot creator can use this command."
      );
      return { embeds: [ embed ]};
    }

    // Get the command name from the message
    const commandName = interaction?.options?.getString('command') || args[0];

    // If no arguments are provided, exit out
    if (!commandName) {
      embed.setDescription(
        `You didn't pass any command to reload!`
      );
      return { embeds: [ embed ]};
    }

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    // If no command under that name is found, exit out
    if (!command) {
      embed.setDescription(
        `There is no command with name or alias '${commandName}'!`
      );
      return { embeds: [ embed ]};
    }

    const commandFolders = fs.readdirSync("./commands");
    const folderName = commandFolders.find((folder) =>
      fs.readdirSync(`./commands/${folder}`).includes(`${command.data.name}.js`)
    );

    delete require.cache[
      require.resolve(`../${folderName}/${command.data.name}.js`)
    ];

    // NOTE: Do not console.log require.cache by itself as it's...huge

    try {
      const newCommand = require(`../${folderName}/${command.data.name}.js`);
      client.commands.set(newCommand.data.name, newCommand);
    } catch (error) {
      console.error(error);
      message.channel.send(
        `There was an error while reloading a command \`${command.data.name}\`:\n\`${error}\``
      );
    }

    embed.setDescription(`Command \`${command.data.name}\` was reloaded!`);

    return { embeds: [ embed ]};;
  },
};

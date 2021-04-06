const fs = require("fs");

module.exports = {
  name: "reload",
  description: "Reloads a command.",

  result(_client, message, args, embed) {
    // If no arguments are provided, exit out
    if (!args.length) {
      embed.setDescription(
        `You didn't pass any command to reload, ${message.author}!`
      );
      return embed;
    }

    // Get the command name from the message
    const commandName = args[0].toLowerCase();
    const command =
      message.client.commands.get(commandName) ||
      message.client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    // If no command under that name is found, exit out
    if (!command) {
      embed.setDescription(
        `There is no command with name or alias \`${commandName}\`, ${message.author}!`
      );
      return embed;
    }

    const commandFolders = fs.readdirSync("./commands");
    const folderName = commandFolders.find((folder) =>
      fs.readdirSync(`./commands/${folder}`).includes(`${commandName}.js`)
    );

    delete require.cache[
      require.resolve(`../${folderName}/${command.name}.js`)
    ];

    try {
      const newCommand = require(`../${folderName}/${command.name}.js`);
      message.client.commands.set(newCommand.name, newCommand);
    } catch (error) {
      console.error(error);
      message.channel.send(
        `There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``
      );
    }

    embed.setDescription(`Command \`${command.name}\` was reloaded!`);

    return embed;
  },
};

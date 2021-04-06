const { prefix } = require("../../config.json");

module.exports = {
  name: "help",
  description: "List all of my commands or info about a specific command.",
  aliases: ["commands, h"],
  usage: "[command name]",
  result(_client, message, args, embed) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      data.push("Here's a list of all my commands:");
      data.push(commands.map((command) => command.name).join(", "));
      data.push(
        `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`
      );

      return message.author
        .send(data, { split: true })
        .then(() => {
          if (message.channel.type === "dm") return;
          message.reply("I've sent you a DM with all my commands!");
        })
        .catch((error) => {
          console.error(
            `Could not send help DM to ${message.author.tag}.\n`,
            error
          );
          message.reply(
            "It seems like I can't DM you! Do you have DMs disabled?"
          );
        });
    }

    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      embed.setDescription(`'${name}' is not a valid command.`);
      return embed;
    }

    embed.setTitle(`Help for '${command.name}' command`);

    if (command.aliases)
      embed.addFields({ name: "Aliases", value: command.aliases.join(", ") });
    if (command.description)
      embed.addFields({ name: "Description", value: command.description });
    if (command.usage)
      embed.addFields({
        name: "Usage",
        value: `${prefix}${command.name} ${command.usage}`,
      });

    embed.addFields({
      name: "Cooldown",
      value: `${command.cooldown || 3} second(s)`,
    });

    return embed;
  },
};

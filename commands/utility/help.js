const { prefix } = require("../../config.json");

module.exports = {
  name: "help",
  description: "List all of my commands or info about a specific command.",
  aliases: ["commands, h"],
  options: [
    {
      name: "command",
      description: "Name of command.",
      required: false,
      type: 3, // string
    },
  ],
  usage: "[command name]",
  result(client, message, args, embed) {
    const data = [];
    const { commands } = client;
    let user = message.author || message.user || message.member.user;

    if (!args.length) {
      data.push("Here's a list of all my commands:");
      data.push(commands.sort((a, b) => a.name > b.name ? 1 : -1).map((command) => command.name).join(", "));
      data.push(
        `\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`
      );

      if (user.send) {
      return user.send(data, { split: true })
        .then(() => {
          if (message.channel.type === "dm") return data;
          message.reply("I've sent you a DM with all my commands!");
        })
        .catch((error) => {
          console.error(
            `Could not send help DM to ${user.tag}.\n`,
            error
          );
          message.reply(
            "It seems like I can't DM you! Do you have DMs disabled?"
          );
        });
      } else {
        embed.setTitle("Help")
        .setDescription(data);

        return embed;
      }
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

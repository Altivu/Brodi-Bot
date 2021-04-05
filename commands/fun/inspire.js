const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
  name: "inspire",
  description: "Retrieves a random inspirational quote from zenquotes.io.",
  cooldown: 5,
  result(message, args, embed) {
    let quote = fetch("https://zenquotes.io/api/random")
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        return data[0]["q"] + " -" + data[0]["a"];
      })
      .then((quote) => {
        const embed = new Discord.MessageEmbed()
        .setTitle("Inspiration")
        .setDescription(quote);

        return embed;
      });
  },
};

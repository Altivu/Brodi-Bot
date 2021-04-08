const fetch = require("node-fetch");

module.exports = {
  name: "inspire",
  description: "Retrieves a random inspirational quote from zenquotes.io.",
  async result(_client, message, args, embed) {
    let quote = await fetch("https://zenquotes.io/api/random")
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        return data[0]["q"] + " -" + data[0]["a"];
      });

    embed.setTitle("Inspiration").setDescription(quote);

    return embed;
  },
};

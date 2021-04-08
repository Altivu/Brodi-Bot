const fetch = require("node-fetch");

module.exports = {
  name: "cat",
  description: "Cat.",
  cooldown: 5,
  async result(_client, _message, _args, embed) {
    const { file } = await fetch("https://aws.random.cat/meow").then(
      (response) => {
        return response.json();
      }
    );
    embed.setTitle("Cat.");
    embed.setImage(file);

    return embed;
  },
};

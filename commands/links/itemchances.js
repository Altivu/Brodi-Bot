const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('itemchances')
  .setDescription('Provides the link to item probabilities based on placement during Item Race.'),
  aliases: ['item_chances', 'itemprobability', 'item_probability', 'itemprobabilities', 'item_probabilities'],
  execute(_client, _interaction, _args, embed) {
    embed.setTitle("Item Race Item Probabilities")
    .setDescription("(Slightly outdated due to the inclusion of the Teleporter item)")
    .setImage("https://cdn.discordapp.com/attachments/801142879510069280/825991840674611230/Screenshot_20210303-142815_YouTube.png")

    return { embeds: [ embed ] };
  }
};


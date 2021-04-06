module.exports = {
	name: 'itemchances',
  aliases: ['item_chances', 'itemprobability', 'item_probability', 'itemprobabilities', 'item_probabilities'],
	description: 'Provides the link to item probabilities based on placement during Item Race.',
  result(_client, message, args, embed) {
    embed.setTitle("Item Race Item Probabilities")
    .setImage("https://cdn.discordapp.com/attachments/801142879510069280/825991840674611230/Screenshot_20210303-142815_YouTube.png")

    return embed;
  }
};


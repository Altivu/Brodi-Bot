module.exports = {
	name: 'records',
	description: 'Provides the link to the Rush+ Records List.',
  result(message, args, embed) {
    embed.setTitle("Rush+ Records List")
    .setDescription("https://docs.google.com/document/d/1LiIZ4OYP53VP0u2QI32nCSwUFoBqTNYj-9rM502pFIo/edit")

    return embed;
  }
};

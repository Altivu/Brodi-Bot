module.exports = {
	name: 'records',
	description: 'Provides the link to the Rush+ Records List.',
  result(_client, message, args, embed) {
    embed.setTitle("Rush+ Records List")
    .setDescription("[International Server Records compiled by PF_Horace](https://docs.qq.com/doc/DTEFsSWxNZlhJQW1E)")

    return embed;
  }
};

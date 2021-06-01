module.exports = {
	name: 'giftequalexchange',
  aliases: ['gift_equal_exchange'],
	description: 'Provides the link to the KR Gift Equal Exchange Google Sheet.',
  result(_client, message, args, embed) {
    embed.setTitle("KRR+ Gift Equal Exchange")
    .setDescription("[KR Gift Equal Exchange compiled by Foras](https://docs.google.com/spreadsheets/d/1erNYuvkbExADjX9T1v3U4OxUHW1uOiJadPPjrcC4XpE/edit#gid=0)")

    return embed;
  }
};

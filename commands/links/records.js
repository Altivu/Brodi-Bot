module.exports = {
	name: 'records',
	description: 'Provides the link to the Global Server Records sheet.',
  result(_client, message, args, embed) {
    embed.setTitle("Global Server Records")
    .setDescription(`[글로벌 타임어택 기록 國際服計時榜 (Global Server Records) compiled by PF_Horace/Run Wildly 狂熱跑跑/DMS](https://docs.google.com/spreadsheets/u/1/d/1yQY45eWh3Dc7pxlCqf-79rXjPJ1nXrCbGnzKQcYFu6s/htmlview#)

(Note that the sheet is in Korean/Chinese)`)

    return embed;
  }
};

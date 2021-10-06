const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('globalserverrecords')
  .setDescription('Provides the link to the Global Server Records sheet.'),
  execute(_client, _interaction, _args, embed) {
    embed.setTitle("Global Server Records")
    .setDescription(`[글로벌 타임어택 기록 國際服計時榜 (Global Server Records) compiled by PF_Horace/Run Wildly 狂熱跑跑/DMS](https://docs.google.com/spreadsheets/u/1/d/1yQY45eWh3Dc7pxlCqf-79rXjPJ1nXrCbGnzKQcYFu6s/htmlview#)

(Note that the sheet is in Korean/Chinese)`)

    return { embeds: [ embed ] }
  }
};

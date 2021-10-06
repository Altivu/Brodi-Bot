const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giftequalexchange')
    .setDescription('Provides the link to the KR Gift Equal Exchange Google Sheet.'),
  aliases: ['gift_equal_exchange'],
  execute(_client, _interaction, _args, embed) {
    embed.setTitle("KRR+ Gift Equal Exchange")
    .setDescription("[KR Gift Equal Exchange compiled by Foras](https://docs.google.com/spreadsheets/d/1erNYuvkbExADjX9T1v3U4OxUHW1uOiJadPPjrcC4XpE/edit#gid=0)")

    return { embeds: [ embed ] };
  }
};

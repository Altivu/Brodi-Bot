const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
  .setName('currencyconversion')
  .setDescription('Provides the link to the KRR+ Currency Conversion Google Sheet.'),
  aliases: ['currency_conversion'],
  execute(_client, _interaction, _args, embed) {
    embed.setTitle("KRR+ Currency Conversion")
    .setDescription("[Battery Pack pricing and conversion rates compiled by derP](https://docs.google.com/spreadsheets/d/1V8XXkhlFEV179J3HPRwlTZeWpmFN6V0cQzNBjnaPx20/edit#gid=0)")

    return { embeds: [ embed ] };
  }
};

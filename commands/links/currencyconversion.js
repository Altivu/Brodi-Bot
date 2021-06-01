module.exports = {
	name: 'currencyconversion',
  aliases: ['currency_conversion'],
	description: 'Provides the link to the KRR+ Currency Conversion Google Sheet.',
  result(_client, message, args, embed) {
    embed.setTitle("KRR+ Currency Conversion")
    .setDescription("[Battery Pack pricing and conversion rates compiled by derP](https://docs.google.com/spreadsheets/d/1V8XXkhlFEV179J3HPRwlTZeWpmFN6V0cQzNBjnaPx20/edit#gid=0)")

    return embed;
  }
};




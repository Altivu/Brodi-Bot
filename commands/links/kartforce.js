const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kartforce')
    .setDescription('Provides the link to the Kart Impact Force Tier image.'),
  aliases: ['kart_force', 'force', 'kartimpact', 'kart_impact', 'impact'],
  result(_client, _interaction, _args, embed) {
    embed
      .setTitle('Kart Impact Force Tier')
      .setDescription('The image shows karts up to Season 10.')
      .setImage(
        'https://cdn.discordapp.com/attachments/801142879510069280/825991840674611230/Screenshot_20210303-142815_YouTube.png'
      );

    return embed;
  },
};

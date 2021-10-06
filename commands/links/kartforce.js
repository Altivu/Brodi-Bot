const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kartforce')
    .setDescription('Provides the link to the Kart Impact Force Tier image.'),
  aliases: ['kart_force', 'force', 'kartimpact', 'kart_impact', 'impact'],
  execute(_client, _interaction, _args, embed) {
    embed
      .setTitle('Kart Impact Force Tier')
      .setDescription('The image shows karts up to Season 10.')
      .setImage(
        'https://cdn.discordapp.com/attachments/827662026372808744/879567486700376095/image0.jpg'
      );

    return { embeds: [ embed ] };
  },
};

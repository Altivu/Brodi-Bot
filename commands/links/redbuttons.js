const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('redbuttons')
    .setDescription('Provides the link to the "On the issue of red buttons and locked tires" video.'),
  aliases: ['red_buttons', 'brokencontrols', 'broken_controls'],
  execute(_client, _interaction, _args, embed) {
    // Do not return an embed object, as you do not want an embed for links to videos only
    let text = "https://www.youtube.com/watch?v=HevCJ4Uo_G0";
    return { content: text };
  }
};
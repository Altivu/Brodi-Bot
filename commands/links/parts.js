const Discord = require("discord.js");

module.exports = {
	name: 'parts',
  aliases: ['part', 'part_system', 'parts_system'],
	description: 'Provides the link to the "Parts System explained! (Season 7 Update)" video.',
  result(_client, message, args, embed) {
    // Do not return an embed object, as you do not want an embed for links to videos only
    let text = "https://www.youtube.com/watch?v=tJdw4_042gc\nhttps://cdn.discordapp.com/attachments/827579047067254797/840387988814561280/partsystem.jpg";
    return text;
  }
};
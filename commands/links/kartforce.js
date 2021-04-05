const Discord = require("discord.js");

module.exports = {
	name: 'kartforce',
   aliases: ['kart_force', 'force', 'kartimpact', 'kart_impact', 'impact'],
	description: 'Provides the link to the Kart Impact Force Tier image.',
  cooldown: 5,
  result(message, args) {
    const embed = new Discord.MessageEmbed()
    .setTitle("Kart Impact Force Tier")
    .setDescription("[Click here](https://gall.dcinside.com/mgallery/board/view/?id=zkxm&no=8198) to access the page with the image (too large to be posted normally).")

    return embed;
  }
};
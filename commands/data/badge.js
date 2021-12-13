const { SlashCommandBuilder } = require('@discordjs/builders');

const { embed_color_error } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('badge')
    .setDescription('Provides badge details. Search by arguments or provide nothing to get a random badge.')
    .addStringOption(option =>
      option
        .setName('parameters')
        .setDescription('Name of badge.')
        .setRequired(false)
    ),
    async execute(_client, interaction, args, embed, _auth) {
    const imageUrl = "https://krrplus.web.app/assets/Badges";

    try {
      if (global.badges.length) {
        let badgesObj = global.badges;

        let searchString = interaction?.options?.getString('parameters') || args.join(" ");
        let lowerCaseSearchString = searchString?.toLocaleLowerCase();

        // Retrieve object of badge matching given arguments
        let badge;

        if (lowerCaseSearchString) {
          badge =
            badgesObj.find(
              (row) => row["Name"].toLocaleLowerCase() === lowerCaseSearchString
            ) ||
            badgesObj.find((row) =>
              row["Name"].toLocaleLowerCase().includes(lowerCaseSearchString)
            );
        } else {
          badge = badgesObj[Math.floor(Math.random() * badgesObj.length)];
        }

        if (badge) {
          embed
            .setThumbnail(
              `${imageUrl}/${badge["File Id"]}.png`
            )
            .setTitle(badge["Name"]);

          if (badge["Rarity"]) {
            embed.setDescription(
              `${"★".repeat(badge["Stars"]) +
            "☆".repeat(5 - badge["Stars"])} Badge`
            );
          }

          if (badge["Special Effects"]) {
            embed.addFields({
              name: "Special Effects",
              value: `
                ${badge["Special Effects"]}
                `,
            });
          }

            embed.addFields({
              name: "Acquire Method",
              value: `
          ${badge["Acquire Method"]}
          `,
            })
            .addFields({
              name: "Released in Global server?",
              value: badge['Released'].toLocaleLowerCase() || "-",
              });
        } else {
          embed.setDescription(
            `No badge found under the name "${searchString}".`
          )
          .setColor(embed_color_error)
        }

        return { embeds: [ embed ] };
      }
    } catch (err) {
      console.error(err);
    }
  },
};

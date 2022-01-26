const { SlashCommandBuilder } = require('@discordjs/builders');

const { embed_color_error } = require("../../config.json");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('racer')
    .setDescription('Provides racer details. Search by arguments or provide nothing to get a random racer.')
    .addStringOption(option =>
      option
        .setName('parameters')
        .setDescription('Name of racer.')
        .setRequired(false)
    ),
    aliases: ["character"],
  async execute(_client, interaction, args, embed, _auth) {
    const imageUrl = "https://krrplus.web.app/assets/Racers";

    try {
      if (global.racers.length) {
        let racersObj = global.racers;

        let searchString = interaction?.options?.getString('parameters') || args.join(" ");
        let lowerCaseSearchString = searchString.toLocaleLowerCase();
        // Retrieve object of racer matching given arguments
        let racer;

        if (searchString) {
          racer =
            racersObj.find(
              (row) => row["Name"].toLocaleLowerCase() === lowerCaseSearchString
            ) ||
            racersObj.find((row) =>
              row["Name"].toLocaleLowerCase().includes(lowerCaseSearchString)
            );
        } else {
          racer = racersObj[Math.floor(Math.random() * racersObj.length)];
        }

        if (racer) {
          embed
            .setThumbnail(
              `${imageUrl}/${racer["File Id"]}${
                [
                  "f_0005",
                  "f_1014",
                  "f_1015",
                  "m_0007",
                  "m_0008",
                  "m_0010",
                  "m_0011",
                  "m_0012",
                ].includes(racer["File Id"])
                  ? "_02_icon"
                  : ""
              }.png`
            )
            .setTitle(racer["Name"]);

          if (racer["Rarity"]) {
            embed.setDescription(
              `${racer["Rarity"].split(" ")[1].trim()} Racer`
            );
          }

          if (racer["Special Effects"]) {
            embed.addFields({
              name: "Special Effects",
              value: `
                ${racer["Special Effects"]}
                `,
            });
          }

          if (racer["Season of Release"]) {
            embed
              .addFields({
                name: "Season of Release",
                value: `
            S${racer["Season of Release"]}
            `,
              });
          }

          if (racer["Acquire Method"]) {
            embed.addFields({
                name: "Acquire Method",
                value: `
            ${racer["Acquire Method"]}
            `,
              });
          }

          if (racer["Released"]) {
            embed.addFields({
                name: "Released in Global server?",
                value: `
            ${racer["Released"].toLocaleLowerCase()}`,
              });
          }

        } else {
          let noResultsString = `No racer found under the name "${searchString}".`;

          let suggestions = racersObj
            .filter(
              element =>
                lowerCaseSearchString &&
                lowerCaseSearchString.length >= 2 &&
                element['Name'] &&
                (element['Name']
                  .toLocaleLowerCase()
                  .startsWith(lowerCaseSearchString.slice(0, 2)) ||
                  element['Name']
                    .toLocaleLowerCase()
                    .endsWith(lowerCaseSearchString.slice(-2)))
            )
            .map(data => data['Name']);

            // A bit more important to additionally sort this object due to the large amount of duplicate characters (like searching for an incorrect spelling of a special Dao is not going to return useful suggestions most of the time using base logic)
            suggestions = suggestions.sort(element => 
            {
              if (element[0].toLocaleLowerCase() === lowerCaseSearchString[0]) {
                return -1;
              }
              else {
                return (Math.abs(element.length - lowerCaseSearchString.length));
              }
            }).splice(0, 5);

          if (suggestions.length > 0) {
            noResultsString += `\n\n**Some suggestions:**\n${suggestions.join(
              '\n'
            )}`;
          }

          embed.setColor(embed_color_error).setDescription(noResultsString);
        }

        return { embeds: [ embed ] };
      }
    } catch (err) {
      console.error(err);
    }
  },
};

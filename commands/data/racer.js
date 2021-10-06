const { SlashCommandBuilder } = require('@discordjs/builders');

const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");
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
  async execute(_client, interaction, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Racers";
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: "Racers!A:I",
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let racersObj = convertToObjects(rows[0], rows.slice(1));

        let searchString = interaction?.options?.getString('parameters') || args.join(" ").toLocaleLowerCase();
        // Retrieve object of racer matching given arguments
        let racer;

        if (searchString) {
          racer =
            racersObj.find(
              (row) => row["Name"].toLocaleLowerCase() === searchString
            ) ||
            racersObj.find((row) =>
              row["Name"].toLocaleLowerCase().includes(searchString)
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
                ${racer["Special Effects"].split(",").join("\n")}
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
          embed
          .setColor(embed_color_error)
          .setDescription(
            `No racer found under the name "${searchString}".`
          );
        }

        return { embeds: [ embed ] };
      }
    } catch (err) {
      console.error(err);
    }
  },
};

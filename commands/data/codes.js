const { SlashCommandBuilder } = require('@discordjs/builders');

const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('codes')
    .setDescription('Provides a list of codes and their respective free decoding track.'),
  async execute(_client, _interaction, args, embed, auth) {
    const codesSpreadsheetInfo = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: "Codes!A:B",
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(codesSpreadsheetInfo)).data.values;

      if (rows.length) {
        let codesObj = convertToObjects(rows[0], rows.slice(1));

        let organizedCodesObj = {};

        codesObj.forEach(code => {
          let codeMode = code["Free Decode Mode/Track"].split("/")[0].trim();

          if (!organizedCodesObj[codeMode]) {
            organizedCodesObj[codeMode] = [{
              name: code["Name"],
              track: code["Free Decode Mode/Track"].split("/")[1].trim()
            }]
          } else {
            organizedCodesObj[codeMode].push({
              name: code["Name"],
              track: code["Free Decode Mode/Track"].split("/")[1].trim()
            });
          }
        });

        // // Was going to use this for putting tab indents between name and track but it seems like embeds do not support this
        // let maxCodeNameLength = Math.max(0,...codesObj.map(code => code["Free Decode Mode/Track"].split("/")[0].trim().length));

        embed.setTitle("Codes");

        Object.keys(organizedCodesObj).forEach(mode => {
          embed.addFields({
            name: mode,
            value: organizedCodesObj[mode].map(info => `${info["name"]} ----- ${info["track"]}`).join("\n")
          });
        });
      } else {
        embed.setDescription("An error occured retrieving the codes information.");
      }

      return { embeds: [ embed ] };
    } catch (err) {
      console.error(err);
    }
  },
};

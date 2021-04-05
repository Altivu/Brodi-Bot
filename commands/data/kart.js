const Discord = require("discord.js");
const { google } = require("googleapis");

const convertToObjects = require("../../utils/convertToObjects");

module.exports = {
  name: "kart",
  description: "Provides kart details",
  cooldown: 5,
  result(message, args, auth) {
    const sheets = google.sheets({ version: "v4", auth });

    sheets.spreadsheets.values.get(
      {
        spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
        range: "Karts!A:P",
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err);
        const rows = res.data.values;

        if (rows.length) {
          return rows;
          rows.map((row) => {
            console.log(`${row[0]}, ${row[1]}`);
          });
        } else {
          console.log("No data found.");
        }
      }
    );

    const embed = new Discord.MessageEmbed().setTitle("Kart");
    // .setImage("https://cdn.discordapp.com/attachments/736242978116468827/826893346604843008/TH_actualizado_31_de_marzo_COLORES_.jpg")

    return embed;
  },
};

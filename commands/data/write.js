const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "write",
  description: "Test command to write to Google Sheets.",
  async result(_client, message, args, embed, auth) {
    const spreadsheetId = "1op1V759st7jQRF-heahsZMKy-985059hSRXrMI_OwC4";
    // This is MadCarroT's sheet; only go here once you set everything up properly
    // const spreadsheetId = "1l3lFe_XD8d05PtM9OSdygQJQc-vaAdPUqbfFwLT1yKo";
    const range = "Sheet24!A1:B4";
    const valueInputOption = "USER_ENTERED";
    const name = "phreaky";
    const map = "Cosmic Canyon";


    const sheets = google.sheets({ version: "v4", auth });
    const request = {
      spreadsheetId,
      range: "Member Times!A4:CQ",
    };

    try {
      // const response =
      //   (await sheets.spreadsheets.values.update({
      //     spreadsheetId,
      //     range,
      //     valueInputOption,
      //     resource: { values: [[new Date()]] },
      //   }),
      //   (err, res) => {
      //     if (err) return console.error(err);
      //   });

      // return;

      // console.log(message.author.username);
      // console.log(message.author.tag.split("#")[0])

      const rows = (await sheets.spreadsheets.values.get(request)).data.values;
      let timesObj = convertToObjects(rows[0], rows.slice(1));
      let mapObj = timesObj.find((obj) => obj["Map"] === map)

      if (!mapObj) return;

      let userTime = mapObj[name];

      console.log(userTime);

      return;
    } catch (err) {
      console.error(err);
    }
  },
};

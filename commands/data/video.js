const { google } = require("googleapis");
const fetch = require("node-fetch");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "video",
  description: "Provides video details",
  async result(message, args, embed, auth) {
    const request = {
      spreadsheetId: "1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E",
      range: "Videos!A1:D4",
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let tracksVideosObj = convertToObjects(rows[0], rows.slice(1));

        // Analyze provided arguments
        let searchString = args.join(" ").toLocaleLowerCase();

        // Retrieve object of track matching given arguments
        let track;

        if (args.length > 0) {
          track = tracksVideosObj.find(
            (obj) =>
              obj["Name"].toLocaleLowerCase() === searchString ||
              obj["Name"].toLocaleLowerCase().includes(searchString)
          );
        } else {
          track =
            tracksVideosObj[Math.floor(Math.random() * tracksVideosObj.length)];
        }

        console.log(tracksVideosObj)

        // If a track was found, begin filling the embed with info
        if (track) {
          // console.log
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};
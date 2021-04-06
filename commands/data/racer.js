const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "racer",
  aliases: ["character"],
  description: "Provides racer details. Search by arguments or provide nothing to get a random racer.",
  async result(_client, message, args, embed, auth) {
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

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of racer matching given arguments
        let racer;

        if (args.length > 0) {
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

          embed
            .addFields({
              name: "Season of Release",
              value: `
          ${racer["Season of Release"]}
          `,
            })
            .addFields({
              name: "Acquire Method",
              value: `
          ${racer["Acquire Method"]}
          `,
            })
            .addFields({
              name: "Released in Global server?",
              value: `
          ${racer["Released"].toLocaleLowerCase()}`,
            });
        } else {
          embed.setDescription(
            `No racer found under the name "${args.join(" ")}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

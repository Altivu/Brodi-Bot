const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "badge",
  description: "Provides badge details. Search by arguments or provide nothing to get a random badge.",
  async result(_client, message, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Badges";
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: "Badges Raw!A:F",
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let badgesObj = convertToObjects(rows[0], rows.slice(1));

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of badge matching given arguments
        let badge;

        if (args.length > 0) {
          badge =
            badgesObj.find(
              (row) => row["Name"].toLocaleLowerCase() === searchString
            ) ||
            badgesObj.find((row) =>
              row["Name"].toLocaleLowerCase().includes(searchString)
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
                ${badge["Special Effects"].split("~").join("\n")}
                `,
            });
          }

            embed.addFields({
              name: "Acquire Method",
              value: `
          ${badge["Acquire Method"]}
          `,
            })
        } else {
          embed.setDescription(
            `No badge found under the name "${args.join(" ")}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

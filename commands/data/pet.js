const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "pet",
  aliases: ["companion"],
  description: "Provides pet details. Search by arguments or provide nothing to get a random pet/flying pet.",
  async result(_client, message, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Pets";
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      ranges: ["Pets!A:J", "Flying Pets!A:J"],
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.batchGet(request)).data
        .valueRanges;

      if (rows.length) {
        // Combine both pets and flying pets into one object for "simplier" usage
        let petsObj = convertToObjects(rows[0].values[0], [
          ...rows[0].values.slice(1),
          ...rows[1].values.slice(1),
        ]).sort((a, b) => (a["Name"] > b["Name"] ? 1 : -1));

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of pet matching given arguments
        let pet;

        // If arguments are provided, search for pet based on that argument, else return a random pet
        if (args.length > 0) {
          pet = petsObj.find((row) =>
            row["Name"].toLocaleLowerCase().includes(searchString)
          );
        } else {
          pet = petsObj[Math.floor(Math.random() * petsObj.length)];
        }

        if (pet) {
          embed
            .setThumbnail(`${imageUrl}/${pet["File Id"]}.png`)
            .setTitle(pet["Name"]);

          if (pet["Rarity"]) {
            embed.setDescription(
              `${pet["Rarity"].split(" ")[1].trim()} ${
                pet["File Id"].includes("flypet") ? "Flying " : ""
              }Pet`
            );
          }

          if (pet["Special Effects"]) {
            embed.addFields({
              name: "Special Effects",
              value: `
                ${pet["Special Effects"]}
                `,
            });
          }

          if (pet["Season of Release"]) {
            embed.addFields({
              name: "Season of Release",
              value: `
          ${pet["Season of Release"]}
          `,
            });
          }

          if (pet["Acquire Method"]) {
            embed.addFields({
              name: "Acquire Method",
              value: `
          ${pet["Acquire Method"]}
          `,
            });
          }

          if (pet["Released"]) {
            embed.addFields({
              name: "Released in Global server?",
              value: `
          ${pet["Released"].toLocaleLowerCase()}`,
            });
          }
        } else {
          embed.setDescription(
            `No pet found under the name "${args.join(" ")}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

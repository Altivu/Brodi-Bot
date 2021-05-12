const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "kart",
  description:
    "Provides kart details. Search by arguments or provide nothing to get a random kart.",
  options: [
    {
      name: "parameters",
      description: "Name of kart.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Karts";
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: "Karts!A:P",
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let obj = convertToObjects(rows[0], rows.slice(1));

        // Don't include karts that don't have a name
        obj = obj.filter((kart) => kart["Name"]);

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of kart matching given arguments
        let kart;

        if (args.length > 0) {
          kart =
            obj.find(
              (kart) => kart["Name"].toLocaleLowerCase() === searchString
            ) ||
            obj.find((kart) =>
              kart["Name"].toLocaleLowerCase().includes(searchString)
            );
        } else {
          kart = obj[Math.floor(Math.random() * obj.length)];
        }

        if (kart) {
          embed
            .setThumbnail(`${imageUrl}/${kart["File Id"]}_icon.png`)
            .setTitle(kart["Name"])
            .setDescription(
              `${kart["Rarity"].split(" ")[1].trim()} ${kart["Kart Type"]} Kart`
            )
            .addFields({
              name: "Stats",
              value: `
          Drift:
          Acceleration:
          Curve:
          Accel. Duration:
          Nitro Charge Speed:
          **Total:**
          `,
              inline: true,
            })
            .addFields({
              name: "---",
              value: `
          ${kart["Drift"]}
          ${kart["Acceleration"]}
          ${kart["Curve"]}
          ${kart["Accel. Duration"]}
          ${kart["Nitro Charge Speed"]}
          **${kart["Raw Total"]}**
          `,
              inline: true,
            });

          if (kart["Kart Type"] === "Item" || kart["Kart Type" === "Hybrid"]) {
            embed.addFields({
              name: "Special Effects",
              value: `
                ${kart["Special Effects (Item Karts Only)"]}
                `,
            });
          }

          if (kart["Season of Release"]) {
            embed.addFields({
              name: "Season of Release",
              value: `
          S${kart["Season of Release"]}
          `,
            });
          }

          if (kart["Permanent Acquire Method"]) {
            embed.addFields({
              name: "Acquire Method",
              value: `
          ${kart["Permanent Acquire Method"]}
          `,
            });
          }

          if (kart["Released"]) {
            embed.addFields({
              name: "Released in Global server?",
              value: `
          ${kart["Released"].toLocaleLowerCase()}`,
            });
          }
        } else {
          embed.setDescription(
            `No kart found under the name "${args.join(" ")}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "kart",
  description: "Provides kart details",
  async result(message, args, embed, auth) {
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

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of kart matching given arguments
        let kart;
        
        if (args.length > 0) {
                  kart = obj.find(
          (kart) =>
            kart.Name.toLocaleLowerCase() === searchString ||
            kart.Name.toLocaleLowerCase().includes(searchString)
        );
        } else {
            kart = obj[Math.floor(Math.random() * (obj.length))]
        }

        if (kart) {
          embed
            .setThumbnail(`${imageUrl}/${kart["File Id"]}_icon.png`)
            .setTitle(kart["Name"])
            .setDescription(`${kart["Rarity"].split(" ")[1].trim()} ${kart["Kart Type"]} kart`)
            .addFields({
              name: "Stats",
              value: `
          Drift: ${kart["Drift"]}
          Acceleration: ${kart["Acceleration"]}
          Curve: ${kart["Curve"]}
          Accel. Duration: ${kart["Accel. Duration"]}
          Nitro Charge Speed: ${kart["Nitro Charge Speed"]}
          **Total: ${kart["Raw Total"]}**
          `,
            })

            if (kart["Kart Type"] === "Item" || kart["Kart Type" === "Hybrid"]) {
              embed.addFields({
                name: "Special Effects",
                value: `
                ${kart["Special Effects (Item Karts Only)"]}
                `
              })
            }

            embed.addFields({
              name: "Season of Release",
              value: `
          S${kart["Season of Release"]}
          `,
            })
            .addFields({
              name: "Acquire Method",
              value: `
          ${kart["Permanent Acquire Method"]}
          `,
            })
            .addFields({
              name: "Released in Global server?",
              value: `
          ${kart["Released"].toLocaleLowerCase()}`,
            });
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

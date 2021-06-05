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
      range: "Karts Raw!A:AC",
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
          // Separate search string for 'maxspeeds'
          if (searchString.split(" ")[0].toLocaleLowerCase() === "maxspeeds") {
            const NUMBER_OF_KARTS = 15;

            let kartsWithSpeeds = obj.filter(kart => kart["Max Speed (km/h) (Nitro)"]).sort((a, b) => b["Max Speed (km/h) (Nitro)"] - a["Max Speed (km/h) (Nitro)"] || a["Name"].localeCompare(b["Name"])).map(kart => {
              return {
                "Name": kart["Name"],
                "Max Speed (km/h) (Nitro)": kart["Max Speed (km/h) (Nitro)"],
                "Released": kart["Released"]
              }
            });

            if (searchString.split(" ")[1] === "released") {
              kartsWithSpeeds = kartsWithSpeeds.filter(kart => kart["Released"] === "TRUE");

              embed.setTitle("Top/Bottom Base Max Nitro Speed Comparisons (Global Released Karts");
            } else {
              embed.setTitle("Top/Bottom Base Max Nitro Speed Comparisons")
            }
            embed.setDescription(`(Showing results from ${kartsWithSpeeds.length} karts with recorded values)`)
    .addFields({
      name: `Top ${NUMBER_OF_KARTS} Karts`,
      value: `${kartsWithSpeeds.slice(0, NUMBER_OF_KARTS).map((kart, index) => `${index + 1}. ${kart["Name"]}`).join('\n')}`,
      inline: true
    })
    .addFields({
      name: `Speed (km/h)`,
      value: `${kartsWithSpeeds.slice(0, NUMBER_OF_KARTS).map(kart => kart["Max Speed (km/h) (Nitro)"]).join('\n')}`,
      inline: true
    })
    .addField('\u200b', '\u200b')
    .addFields({
      name: `Bottom ${NUMBER_OF_KARTS} Karts`,
      value: `${kartsWithSpeeds.slice(-NUMBER_OF_KARTS).reverse().map((kart, index) => `${kartsWithSpeeds.length - index}. ${kart["Name"]}`).join('\n')}`,
      inline: true
    })
    .addFields({
      name: `Speed (km/h)`,
      value: `${kartsWithSpeeds.slice(-NUMBER_OF_KARTS).reverse().map(kart => kart["Max Speed (km/h) (Nitro)"]).join('\n')}`,
      inline: true
    })

            return embed;
}

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
    .setTitle(kart["Name"]);

  let descriptionString = `\n`;

  // Build CH/KR string, if applicable
  if (kart["Name (CN)"]) {
    descriptionString += `**CN:** ${kart["Name (CN)"]}\n`;
  }

  if (kart["Name (KR)"]) {
    descriptionString += `**KR:** ${kart["Name (KR)"]}\n`;
  }

  descriptionString += `${kart["Rarity"].split(" ")[1].trim()} ${kart["Kart Type"]} Kart`;

  embed.setDescription(descriptionString);

  if (kart["Raw Total"]) {
    embed.addFields({
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
  }

  if (kart["Max Speed (km/h) (Nitro)"]) {
    // Get an array of all karts that have a noted base max speed with nitro
    const kartSpeeds = obj.map(kart => kart["Max Speed (km/h) (Nitro)"]).filter(speed => speed).sort().reverse();

    // const uniqueSpeeds = Array.from(new Set(kartSpeeds));

    let valueString = `${kart["Max Speed (km/h) (Nitro)"]} km/h
      (#${kartSpeeds.indexOf(kart["Max Speed (km/h) (Nitro)"]) + 1} out of ${kartSpeeds.length} karts with recorded speeds)`;

    // Let's also get this statistic for released karts only
    if (kart["Released"] === "TRUE") {
      const releasedKartSpeeds = obj.filter(kart => kart["Max Speed (km/h) (Nitro)"] && kart["Released"] === "TRUE").map(kart => kart["Max Speed (km/h) (Nitro)"]).sort().reverse();

      valueString += `
      (#${releasedKartSpeeds.indexOf(kart["Max Speed (km/h) (Nitro)"]) + 1} out of ${releasedKartSpeeds.length} global server karts with recorded speeds)`;
    }

    embed.addFields({
      name: "Base Max Nitro Speed",
      value: valueString
    });
  }

  if (kart["Special Effects (Item Karts Only)"]) {
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

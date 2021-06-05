const { google } = require("googleapis");

const { convertToObjects, trim } = require("../../utils/utils");

module.exports = {
  name: "item",
  description:
    "Provides item (from Item Mode) details. Search by arguments or provide nothing to get a random item.",
  options: [
    {
      name: "parameters",
      description: "Name of item.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Item%20Mode%20Icons";

    // Cross-reference multiple spreadsheets to combine information on item interactions
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      ranges: [
        "Item Mode Items Raw!A:E",
        "Karts!A:P",
        "Pets!A:J",
        "Badges Raw!A:F",
      ],
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.batchGet(request)).data
        .valueRanges;

      if (rows.length) {
        let itemsObj = convertToObjects(
          rows[0].values[0],
          rows[0].values.slice(1)
        );

        // Remove any items that don't have a name
        itemsObj = itemsObj.filter((item) => item["Name"]);

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of item matching given arguments
        let item;

        if (args.length > 0) {
          item =
            itemsObj.find(
              (row) => row["Name"].toLocaleLowerCase() === searchString
            ) ||
            itemsObj.find((row) =>
              row["Name"].toLocaleLowerCase().includes(searchString)
            );
        } else {
          item = itemsObj[Math.floor(Math.random() * itemsObj.length)];
        }

        if (item) {
          embed
            .setThumbnail(`${imageUrl}/${item["File Id"]}.png`)
            .setTitle(item["Name"]);

          if (item["Description"]) {
            embed.setDescription(item["Description"]);
          }

          // Due to overlap in item names, some items are prefixed with 'Normal' in the special effects section, so note that here
          const normalItems = [
            "Banana Peel",
            "Cloud",
            "Ice Bomb",
            "Magnet",
            "Mine",
            "Missile",
            "Nitro",
            "Shield",
            "UFO",
            "Water Bomb",
            "Water Fly"
          ];

          let itemSearchName = `${
            normalItems.includes(item["Name"]) ? "Normal " : ""
          }${item["Name"]}`;

          // Start with karts
          let kartsObj = convertToObjects(
            rows[1].values[0],
            rows[1].values.slice(1)
          );

          kartsObj = kartsObj.filter((kart) =>
            kart["Special Effects (Item Karts Only)"].includes(itemSearchName)
          );

          // Attempt to sort between offensive and defensive interactions (will definitely not be perfect as it will differentiate via keywords)
          let finalKartsObjOffensive = [];
          let finalKartsObjDefensive = [];

          kartsObj.forEach((kart) => {
            let specialEffectsArray = kart[
              "Special Effects (Item Karts Only)"
            ].split("\n");

            // If the searched item is a Water Bomb/Water Fly and the effect is to enable quick boost, don't bother including it because it's too common on karts
            specialEffectsArray = specialEffectsArray.filter(
              (effect) =>
                effect.includes(itemSearchName) &&
                (!["Normal Water Bomb", "Water Fly"].includes(itemSearchName) ||
                  !effect.includes("Enable Quick Boost after escaping"))
            );

            specialEffectsArray.forEach((effect) => {
              if (effect.toLocaleLowerCase().includes("hitting") || effect.toLocaleLowerCase().includes("replace") || effect.toLocaleLowerCase().includes("land") || effect.toLocaleLowerCase().includes("using")) {
                finalKartsObjOffensive.push(`${kart["Name"]} - ${effect}`);
              } else {
                finalKartsObjDefensive.push(`${kart["Name"]} - ${effect}`);
              }
            });
          });

          if (finalKartsObjOffensive.length > 0) {
            embed.addFields({
              name: "Kart Interactions (Offensive)",
              value: `
          ${trim(finalKartsObjOffensive.join("\n"), 1024)}
          `,
            });
          }

          if (finalKartsObjDefensive.length > 0) {
            embed.addFields({
              name: "Kart Interactions (Defensive)",
              value: `
          ${trim(finalKartsObjDefensive.join("\n"), 1024)}
          `,
            });
          }

          // Now look at pets
          let petsObj = convertToObjects(
            rows[2].values[0],
            rows[2].values.slice(1)
          );

          petsObj = petsObj.filter((pet) =>
            pet["Special Effects"] && pet["Special Effects"].includes(itemSearchName)
          );

          let finalPetsObj = [];

          petsObj.forEach((pet) => {
            let specialEffectsArray = pet["Special Effects"].split("\n");

            specialEffectsArray = specialEffectsArray.filter((effect) =>
              effect.includes(itemSearchName)
            );

            specialEffectsArray.forEach((effect) => {
              finalPetsObj.push(`${pet["Name"]} - ${effect}`);
            });
          });

          if (finalPetsObj.length > 0) {
            embed.addFields({
              name: "Pet Interactions",
              value: `
          ${trim(finalPetsObj.join("\n"), 1024)}
          `,
            });
          }

          // Finally, look at badges
          let badgesObj = convertToObjects(
            rows[3].values[0],
            rows[3].values.slice(1)
          );

          badgesObj = badgesObj.filter((badge) =>
            badge["Special Effects"].includes(itemSearchName)
          );

          let finalBadgesObj = [];

          badgesObj.forEach((badge) => {
            let specialEffectsArray = badge["Special Effects"].split("~");

            specialEffectsArray = specialEffectsArray.filter((effect) =>
              effect.includes(itemSearchName)
            );

            specialEffectsArray.forEach((effect) => {
              finalBadgesObj.push(`${badge["Name"]} - ${effect}`);
            });
          });

          if (finalBadgesObj.length > 0) {
            embed.addFields({
              name: "Badge Interactions",
              value: `
          ${trim(finalBadgesObj.join("\n"), 1024)}
          `,
            });
          }
        } else {
          embed.setDescription(
            `No item found under the name "${args.join(" ")}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

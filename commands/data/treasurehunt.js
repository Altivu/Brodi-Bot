const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "treasurehunt",
  aliases: ["treasure_hunt"],
  description: "Provides treasure hunt details for an item or theme, or provide nothing to get a summary image.",
  options: [
    {
      name: "parameters",
      description: "Name of item/theme.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    // Does not exist yet
    const imageUrl = "https://krrplus.web.app/assets/Home";

    const spreadsheetInfo = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      ranges: ["Treasure Hunt Raw!A:F", "Home Raw!A:O"],
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      // If no arguments are provided, just provide the image and return
      if (args.length === 0) {
        embed.setTitle("Treasure Hunt Information")
          // .setImage("https://cdn.discordapp.com/attachments/736242978116468827/826893346604843008/TH_actualizado_31_de_marzo_COLORES_.jpg")
          .setDescription("Image created by Jadeiteg on May 25th, 2021")
          .setImage("https://cdn.discordapp.com/attachments/679508206032388106/846792169532030996/Treasure_Hunt_Guide.jpg");
          
        return embed;
      }

      const searchString = args.join(" ").toLocaleLowerCase();

      // Now start parsing for the treasure hunt and home information
      const spreadsheetObj = (await sheets.spreadsheets.values.batchGet(spreadsheetInfo)).data
        .valueRanges;

      let treasureHuntData, homeData;

      if (spreadsheetObj[0].values.length) {
        treasureHuntData = convertToObjects(
          spreadsheetObj[0].values[0],
          spreadsheetObj[0].values.slice(1)
        );
      }

      if (spreadsheetObj[1].values.length) {
        homeData = convertToObjects(
          spreadsheetObj[1].values[0],
          spreadsheetObj[1].values.slice(1)
        );
      }

      if (!treasureHuntData || !homeData) {
        embed.setDescription("An error has occured in parsing the Treasure Hunt or Home sheets.");
        return embed;
      }

      // Begin by parsing through the treasure hunt data 
      treasureHuntData.sort((a, b) => {
        if (!a["Name"] || !b["Name"]) {
          return 0;
        }

        return a["Name"].localeCompare(b["Name"]);
      });

      let result = treasureHuntData.find(
        (obj) =>
          (obj["Name"] && obj["Name"].toLocaleLowerCase().includes(searchString.toLocaleLowerCase())
          ));

      // If a result was found, build the treasure hunt item data and return the embed
      if (result) {
        embed.setTitle(result["Name"])
          .setDescription(`${result["Rarity"].split(" ")[1]} Treasure`)
          .addFields({
            name: "Themes",
            value: result["Themes"]
          })
          .addFields({
            name: "Available in Fairy Shop?",
            value: result["Shop (Fairy Jewels)"] ? `${result["Shop (Fairy Jewels)"]} Fairy Jewels` : "false"
          })
          .setThumbnail(`${imageUrl}/Treasure%20Hunt/${result["File Id"]}.png`);

        return embed;
      }

      // If a result was not found, now check the home sheet under the assumption that the user may have been searching for a home theme instead

      // Start by cutting out most of the home items, since we are only focusing on themes
      homeData = homeData.filter((obj) => obj["Name"] && obj["Name"].includes("Background"));

      homeData.sort((a, b) => {
        return a["Name"].localeCompare(b["Name"]);
      });

      result = homeData.find(
        (obj) =>
          (obj["Name"] && obj["Name"].toLocaleLowerCase().includes(searchString.toLocaleLowerCase())
          ));

      if (!result) {
        embed.setDescription(`No results found for '${searchString}'.`);
        return embed;
      }

      let matchedTreasures = treasureHuntData.filter((item) => item["Themes"] && (item["Themes"] === "All" || item["Themes"].includes(result["Name"].split(" Background")[0])));

      matchedTreasures.sort((a, b) => b["Rarity"].localeCompare(a["Rarity"]) || a["Name"].localeCompare(b["Name"]));

      let finalTreasuresObj = {};

      matchedTreasures.forEach((item) => {
        if (!finalTreasuresObj[item["Rarity"]]) {
          finalTreasuresObj[item["Rarity"]] = `${item["Name"]}\n`;
        } else {
          finalTreasuresObj[item["Rarity"]] += `${item["Name"]}\n`;
        }
      });

      embed.setTitle(result["Name"])
        .setDescription("Home Theme");

      // Add Lucky Balls or K-Coins information
      if (result["Lucky Balls"]) {
        embed.addFields({
          name: "Lucky Ball",
          value: result["Lucky Balls"]
        })
      };

      if (result["K-Coins"]) {
        embed.addFields({
          name: "Shop",
          value: `${parseInt(result["K-Coins"]).toLocaleString()} K-Coins`
        })
      };

      Object.keys(finalTreasuresObj).forEach((rarity) => {
        embed.addFields({
          name: `${rarity.split(" ").slice(1)} Treasures`,
          value: finalTreasuresObj[rarity]
        });
      });

      embed.setImage(`${imageUrl}/Items/${result["File Id"]}.png`);

      return embed;
    } catch (err) {
      console.error(err);
    }
  },
};

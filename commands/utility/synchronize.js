const { SlashCommandBuilder } = require('@discordjs/builders');

const { google } = require("googleapis");

const { convertToObjects } = require("../../utils/utils");

const { embed_color_error } = require('../../config.json');

const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('synchronize')
    .setDescription('(BOT CREATOR ONLY) Update global variable(s) with Google Sheet data.'),
  async execute(client, interaction, args, embed, auth) {
    // Get the user id to check if the user is the bot creator (technically not needed for slash commands if permissions are properly set, but maybe for prefix commands)

    // Left is for slash commands, right is for prefix
    let userId = interaction?.user?.id || interaction?.author?.id;

    if (userId && userId !== process.env.CREATOR_ID) {
      if (embed) {
        embed.setDescription(
          "Only the bot creator can use this command."
        );
        return { embeds: [embed] };
      }
      else {
        console.log("An error has occured with the synchronize command.")
        return;
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const standardDataMappingObj = [
        {
          name: 'karts',
          range: 'Karts Raw!A:BI'
        },
        {
          name: 'racers',
          range: 'Racers Raw!A:K'
        },
        {
          name: 'pets',
          range: 'Pets Raw!A:L'
        },
        {
          name: 'flying_pets',
          range: 'Flying Pets Raw!A:L'
        },
        {
          name: 'badges',
          range: 'Badges Raw!A:I'
        },
        {
          name: 'titles',
          range: 'Titles Raw!A2:E'
        },
        {
          name: 'frames',
          range: 'Frames Raw!A2:E'
        },
        {
          name: 'item_mode_items',
          range: 'Item Mode Items Raw!A:E'
        },
        {
          name: 'treasure_hunt',
          range: 'Treasure Hunt Raw!A:F'
        },
        {
          name: 'home',
          range: 'Home Raw!A:O'
        },
        {
          name: 'parts',
          range: 'Parts Raw!A:H'
        },
        {
          name: 'codes',
          range: 'Codes!A:B'
        },
        {
          name: 'seasons',
          range: 'Seasons!A:N'
        },
      ];

      // Link to Google Sheets - KRRPlus Tables, which gets a bunch of data that should not be seeing updates that often (which allows them to be saved to global variable for faster access)
      const spreadsheetsInfo = {
        spreadsheetId: '1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU',
        ranges: standardDataMappingObj.map(element => element.range)
      };

      const spreadsheetsObj = (
        await sheets.spreadsheets.values.batchGet(spreadsheetsInfo)
      ).data.valueRanges;

      standardDataMappingObj.forEach((element, index) => {
        eval("global." + element["name"] + " = convertToObjects(spreadsheetsObj[index].values[0], spreadsheetsObj[index].values.slice(1));");

        console.log(`global.${element["name"]} variable set. (${eval("global." + element["name"] + ".length")} rows)`);
      });

      // Now do it for the tracks spreadsheet
      const tracksDataMappingObj = [
        {
          name: 'tracks',
          range: 'Tracks!A:O'
        },
        {
          name: 'custom_tracks',
          range: 'Custom Tracks (West Server)!A2:N'
        }
      ];

      // Link to Google Sheets - KartRider Rush+ Tracks
      const tracksSpreadsheetsInfo = {
        spreadsheetId: '1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E',
        ranges: tracksDataMappingObj.map(element => element.range)
      };

      const trackSpreadsheetsObj = (
        await sheets.spreadsheets.values.batchGet(tracksSpreadsheetsInfo)
      ).data.valueRanges;

      tracksDataMappingObj.forEach((element, index) => {
        eval("global." + element["name"] + " = convertToObjects(trackSpreadsheetsObj[index].values[0], trackSpreadsheetsObj[index].values.slice(1));");

        console.log(`global.${element["name"]} variable set. (${eval("global." + element["name"] + ".length")} rows)`);
      });

      // Retrieve the tier times from a separate spreadsheet
      // This used to use the Inverse one managed by MadCarroT, but because it is has no longer been updated for many seasons, switch to one of the "main" SEA ones updated by CHAOS/FadedEx/Hateful, who largely copied MadCarroT's sheet framework anyways
      // Need to make some additional changes to code though, since their formatting is a bit different
      const trackTierCutoffsDataMappingObj = [
        {
          // name: 'inverse_tier_cutoffs',
          // range: 'Tier Cutoffs!A:F'

          name: 'tier_cutoffs',
          range: 'Tier_Cutoff!B2:I'
        },
      ];

      const trackTierCutoffsSpreadsheetsInfo = {
        // Inverse one
        // spreadsheetId: '1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4',

        // SEA one
        spreadsheetId: "17J3BmfiaDeocyG-TsJq204Jq7ZXG6FpLn40i9EaSa28",
        ranges: trackTierCutoffsDataMappingObj.map(element => element.range)
      };

      const trackTierCutoffsSpreadsheetsObj = (
        await sheets.spreadsheets.values.batchGet(trackTierCutoffsSpreadsheetsInfo)
      ).data.valueRanges;

      trackTierCutoffsDataMappingObj.forEach((element, index) => {
        eval("global." + element["name"] + " = convertToObjects(trackTierCutoffsSpreadsheetsObj[index].values[0], trackTierCutoffsSpreadsheetsObj[index].values.slice(1));");

        console.log(`global.${element["name"]} variable set. (${eval("global." + element["name"] + ".length")} rows)`);
      });

      console.log("Synchronization complete.");

      if (embed) {
        embed.setDescription(`Synchronization complete.`);

        return { embeds: [embed] };
      } else {
        return;
      }
    } catch (error) {
      console.error(error);

      if (embed) {
        embed.setColor(embed_color_error).setDescription(error.toString());
        return { embeds: [embed] };
      } else {
        return;
      }
    }
  },
};

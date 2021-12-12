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
        return { embeds: [ embed ]};
      }
      else {
        console.log("An error has occured with the synchronize command.")
        return;
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const dataMappingObj = [
        {
          name: 'karts',
          range: 'Karts Raw!A:AU'
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
          range: 'Badges Raw!A:G'
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
        ranges: dataMappingObj.map(element => element.range)
      };

      const spreadsheetsObj = (
          await sheets.spreadsheets.values.batchGet(spreadsheetsInfo)
        ).data.valueRanges;
        
      dataMappingObj.forEach((element, index) => {
        eval("global." + element["name"] + " = convertToObjects(spreadsheetsObj[index].values[0], spreadsheetsObj[index].values.slice(1));");

        console.log(`global.${element["name"]} variable set.`);
      });

      console.log("Synchronization complete.");

      if (embed) {
        embed.setDescription(`Synchronization complete.`);

        return { embeds: [ embed ]};
      } else {
        return;
      }
    } catch (error) {
      if (embed) {
        console.error(error);
        embed.setColor(embed_color_error).setDescription(error.toString());
        return { embeds: [embed] };
      } else {
        return;
      }
    }
  },
};

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { google } = require('googleapis');

const {
  convertToObjects,
  convertTimeToMilliseconds,
  convertMillisecondsToTime,
  convertDiscordToGoogleSheetName,
  numbertoColumnLetters,
  getTiersFromTrackAndTimeAndTierCutoffsObj,
} = require('../../utils/utils');

const { embed_color, embed_color_error } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('records')
    .setDescription(
      'Update a record on the Inverse time sheet, or see the Global Server Records sheet.'
    )
    // .addSubcommand(subcommand =>
    //   subcommand
    //     .setName('get')
    //     .setDescription(
    //       '(INVERSE MEMBERS ONLY) Get record of track, or provide nothing to get all records.'
    //     )
    //     .addStringOption(option =>
    //       option
    //         .setName('parameters')
    //         .setDescription('Name of track.')
    //         .setRequired(false)
    //     )
    // )
    .addSubcommand(subcommand =>
      subcommand
        .setName('update')
        .setDescription(
          '(INVERSE MEMBERS ONLY) Update a record on the Inverse time sheet, given track and time.'
        )
        .addStringOption(option =>
          option
            .setName('track')
            .setDescription('Name of track.')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('Record time (expected format: XX.XX.XX or 0).')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('globalserverrecords')
        .setDescription('Provides the link to the Global Server Records sheet.')
    ),
  async execute(client, interaction, args, embed, auth) {
    // Variable for how long a user has to confirm updating a record before the interaction automatically cancels
    const UPDATE_TIME_LIMIT = 20000;

    // MadCarroT's "Inverse Club Time Sheet" Google Sheet
    const timeSheetSpreadsheetId = "1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4";
    // // My test time sheet copy
    // const timeSheetSpreadsheetId = '1fsYiB7iJzEvyGc-ktPyMvrsm1GcFctQru3XUoBIAbjM';

    // Get subcommand
    const subCommandName = interaction?.options?.getSubcommand() || args[0];

    /////////////////
    // RECORDS GET //
    /////////////////

    if (subCommandName === 'get') {
    }

    ////////////////////
    // RECORDS UPDATE //
    ////////////////////
    if (subCommandName === 'update') {
      // Both of these options are required
      const optionTrack = interaction?.options?.getString('track');
      const optionTime = interaction?.options?.getString('time');

      if (!optionTrack || !optionTime) {
        embed
          .setColor(embed_color_error)
          .setDescription('This command can only be run as a slash command.');

        return { embeds: [embed] };
      }

      // Get user object
      // First option is if the command is sent via slash command
      // Second option is if the command is sent via prefix command
      // (NOTE THAT THIS COMMAND WILL NOT ACTUALLY SUPPORT PREFIX COMMANDS DUE TO REQUIRING EPHEMERAL STATUS ON THE INTERACTION)
      const user = interaction?.user || interaction?.author;

      const timeSheetRequestObj = {
        spreadsheetId: timeSheetSpreadsheetId,
        ranges: [
          'time_master!A2:I',
          'Member Times!A4:CQ',
          'Member Tiers!A3:G',
          'Tier Cutoffs!A1:F',
        ],
      };

      const sheets = google.sheets({ version: 'v4', auth });

      try {
        // Start by parsing the Inverse Club Time Sheet
        const timesRows = (
          await sheets.spreadsheets.values.batchGet(timeSheetRequestObj)
        ).data.valueRanges;

        // Time Master (Map Tiers) (has difficulty column)
        // Member Times
        // Member Tiers (contains Average Tier info)
        // Tier Cutoffs (does not have difficulty column)
        let timeMasterObj, memberTimesObj, memberTiersObj, tierCutoffsObj;

        if (timesRows[0].values.length) {
          timeMasterObj = convertToObjects(
            timesRows[0].values[0],
            timesRows[0].values.slice(1)
          );
        }

        if (timesRows[1].values.length) {
          memberTimesObj = convertToObjects(
            timesRows[1].values[0],
            timesRows[1].values.slice(1)
          );
        }

        if (timesRows[2].values.length) {
          memberTiersObj = convertToObjects(
            timesRows[2].values[0],
            timesRows[2].values.slice(1)
          );
        }

        if (timesRows[3].values.length) {
          tierCutoffsObj = convertToObjects(
            timesRows[3].values[0],
            timesRows[3].values.slice(1)
          );
        }

        // Do not continue if there is an issue with parsing any of the sheets
        if (
          !timeMasterObj ||
          !memberTimesObj ||
          !memberTiersObj ||
          !tierCutoffsObj
        ) {
          embed
            .setColor(embed_color_error)
            .setDescription(
              'An error has occured with parsing the time sheet. Please contact the developer.'
            );
          return { embeds: [embed] };
        }

        // Look for the name in both the Member Times sheet as well as the separate name mapping sheet (will prematurely end the command if no name is found)

        // timesRows[1].values[0].slice(2) returns an array holding all of the time sheet names to cross-reference name
        const nameInSheet = await convertDiscordToGoogleSheetName(
          sheets,
          timesRows[1].values[0].slice(2),
          undefined,
          user
        );

        if (!nameInSheet) {
          embed
            .setColor(embed_color_error)
            .setDescription('Your name is not in the Inverse Club Time Sheet!');

          return { embeds: [embed] };
        }

        // Simplify the member times object to only display map and user's record (as opposed to every user)
        memberTimesObj = memberTimesObj.map(obj => {
          return {
            Map: obj['Map'],
            Record: obj[nameInSheet],
          };
        });

        // Check to see if the track passed as parameter is valid
        // Create a shallow copy of the memberTimesObj simply for sorting and track search purposes (want to keep the original object intact so we can get the correct sheet row later)
        let tempMemberTimesObj = JSON.parse(JSON.stringify(memberTimesObj));

        // Because reverse tracks are sorted at the top of the list in the "raw" data, using find would get these tracks first; resort the object here to place them at the bottom
        tempMemberTimesObj.sort((a, b) => {
          // Exception for tracks that aren't given an English name
          if (!a['Map'] || !b['Map']) {
            return 0;
          }

          if (a['Map'].includes('[R]') && !b['Map'].includes('[R]')) {
            return 1;
          } else if (!a['Map'].includes('[R]') && b['Map'].includes('[R]')) {
            return -1;
          } else {
            return a['Map'].localeCompare(b['Map']);
          }
        });

        // Parse the track variable to make it more likely to find the track
        let trackNameToSearch = parseTrackSearchString(optionTrack);

        // Pinpoint the main object
        tempMemberTimesObj =
          tempMemberTimesObj.find(
            obj => obj['Map'].toLocaleLowerCase() === trackNameToSearch
          ) ||
          tempMemberTimesObj.find(obj =>
            obj['Map'].toLocaleLowerCase().includes(trackNameToSearch)
          );

        if (!tempMemberTimesObj) {
          embed
            .setColor(embed_color_error)
            .setDescription(
              `"${optionTrack}" is not in the Inverse Club Time Sheet!`
            );

          return { embeds: [embed] };
        }

        // Get proper track name
        trackNameToSearch = tempMemberTimesObj['Map'];
        // Get previous record
        const previousRecord = tempMemberTimesObj['Record'];

        ////////////////
        // GET COLUMN //
        ////////////////

        // timesRows[1].values[0] gets the row which holds the time sheet names
        const columnLetters = numbertoColumnLetters(
          timesRows[1].values[0].indexOf(nameInSheet)
        );

        /////////////
        // GET ROW //
        /////////////

        // Remember that memberTimesObj starts from A5 (the fifth row), so add 5 to the resulting number to get the actual row number
        const rowNumber =
          memberTimesObj.findIndex(i => i['Map'] === trackNameToSearch) + 5;

        // string + number = string
        const cellRange = columnLetters + rowNumber;

        ///////////////////////
        // PARSE TIME OPTION //
        ///////////////////////

        // Attempt to parse the optionTime into readable format (to a certain degree)

        // First replace any : with .
        let timeToUpdateWith = optionTime.replace(/:/g, '.');

        // Blank clause
        if (/^(0+\.?)*0*$/.test(timeToUpdateWith)) {
          timeToUpdateWith = '';
        } else {
          timeToUpdateWith = timeToUpdateWith.split('.');

          // For times that are less than a minute
          if (timeToUpdateWith.length === 2) {
            timeToUpdateWith.unshift('00');
          }

          // Add leading zeroes in case they were forgotten
          timeToUpdateWith.forEach(
            (component, index) =>
              (timeToUpdateWith[index] = timeToUpdateWith[index].padStart(2, 0))
          );
          
          // Re-join array into string
          timeToUpdateWith = timeToUpdateWith.join('.');
        }

        if (
          timeToUpdateWith !== '' &&
          !/^\d{2}\.[0-5]\d\.\d{2}$/.test(timeToUpdateWith)
        ) {
          embed
            .setColor(embed_color_error)
            .setDescription(`"${optionTime}" is not a valid record time!`);

          return { embeds: [embed] };
        }

        /////////////////////////////////////
        // CREATE CONFIRMATION INTERACTION //
        /////////////////////////////////////

        const previousTimeTiersObj = getTiersFromTrackAndTimeAndTierCutoffsObj(trackNameToSearch, previousRecord, tierCutoffsObj).find(tier => tier["differentialMilliseconds"] <= 0);
        const updateTimeTiersObj = getTiersFromTrackAndTimeAndTierCutoffsObj(trackNameToSearch, timeToUpdateWith, tierCutoffsObj).find(tier => tier["differentialMilliseconds"] <= 0);

        const resultEmbed = new MessageEmbed()
          .setTitle(`Update record for ${trackNameToSearch}`)
          .setColor(embed_color);

        // Create a specific filter for capturing the button:
        // 1. The button is tied to this specific interaction
        // 2. The interaction was requested by the user that is actually clicking the button
        const filter = i => {
          return (
            i?.message?.interaction?.id === interaction.id &&
            i?.user?.id === user?.id
          );
        };

        const collector = interaction.channel.createMessageComponentCollector({
          filter,
          time: UPDATE_TIME_LIMIT,
          max: 1,
        });

        collector.on('collect', async i => {
          // If the interaction is confirmed, then update the Google sheet with the new time
          if (i.customId === 'confirm') {
            const previousFooterText = embed?.footer?.text;
            const now = Date.now();

            const timeSheetUpdateObj = {
              spreadsheetId: timeSheetSpreadsheetId,
              range: 'Member Times!' + cellRange,
              valueInputOption: 'RAW',
              resource: { values: [[timeToUpdateWith]] },
            };

            await sheets.spreadsheets.values.update(timeSheetUpdateObj);

            embed.spliceFields(embed.fields.length - 2, 2, [
              {
                name: 'New Record',
                value: timeToUpdateWith ? `${timeToUpdateWith} (${updateTimeTiersObj?.tier || "Incomplete"})` : '<<blank>>',
              },
              {
                name: 'Confirmed',
                value: 'Successfully updated!',
              },
            ])
            .setFooter(
              `${previousFooterText} + ${Date.now() - now} ms`
            );

            await i.update({ embeds: [embed], components: [] });
          } else {
            resultEmbed.setDescription('Update process cancelled.');

            await i.update({ embeds: [resultEmbed], components: [] });
          }
        });

        // Logic for when the collector expires with no interactions
        collector.on('end', collected => {
          if (!collected?.first()) {
            resultEmbed.setDescription('Update process cancelled.');

            interaction.editReply({ embeds: [resultEmbed], components: [] });
          }
        });

        // Build the confirmation embed
        const row = new MessageActionRow().addComponents(
          new MessageButton()
            .setCustomId('confirm')
            .setLabel('Confirm')
            .setStyle('SUCCESS'),
          new MessageButton()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle('SECONDARY')
        );

        embed
          .setTitle(`Update record for ${trackNameToSearch}`)
          .addFields({
            name: 'Time Sheet Name',
            value: nameInSheet,
          })
          .addFields({
            name: 'Track',
            value: trackNameToSearch,
          })
          .addFields({
            name: 'Previous Record',
            value: previousRecord ? `${previousRecord} (${previousTimeTiersObj?.tier || "Incomplete"})` : '<<blank>>',
          })
          .addFields({
            name: 'New Record (pending)',
            value: timeToUpdateWith ? `${timeToUpdateWith} (${updateTimeTiersObj?.tier || "Incomplete"})` : '<<blank>>',
          })
          .addFields({
            name: 'Confirmation',
            value: `Confirm that the above information is correct to update the time sheet.
          
This process will automatically cancel if no response is provided within ${+parseFloat(
              (UPDATE_TIME_LIMIT / 1000).toFixed(2)
            )} seconds.`,
          });

        return { embeds: [embed], components: [row] };
      } catch (err) {
        console.error(err);
        embed.setColor(embed_color_error).setDescription(err);
        return { embeds: [embed] };
      }
    }

    ///////////////////////////////////
    // RECORDS GLOBAL SERVER RECORDS //
    ///////////////////////////////////

    if (subCommandName === 'globalserverrecords') {
      embed.setTitle('Global Server Records')
        .setDescription(`[글로벌 타임어택 기록 國際服計時榜 (Global Server Records) compiled by PF_Horace/Run Wildly 狂熱跑跑/DMS](https://docs.google.com/spreadsheets/u/1/d/1yQY45eWh3Dc7pxlCqf-79rXjPJ1nXrCbGnzKQcYFu6s/htmlview#)

(Note that the sheet is in Korean/Chinese)`);

      return { embeds: [embed] };
    }

    // If you have hit this code block, you probably ran a prefix command and didn't use one of the subcommands above...
    embed.setColor(embed_color_error).setDescription(
      // "You did not provide a valid subcommand! Use 'get' or 'globalserverrecords'."

      "You did not provide a valid subcommand! Use 'globalserverrecords'."
    );

    return { embeds: [embed] };

    // // If number of tracks with actual recorded records is less than NUM_TRACKS_TO_SHOW, don't bother showing full information due to inaccuracies
    // if (
    //   memberTimesObj.filter((obj) => obj["Record"]).length <
    //   NUM_TRACKS_TO_SHOW
    // ) {
    //   embed
    //   .setColor(embed_color_error)
    //   .setDescription(
    //     "Not enough records. Please fill in your times to use this command!"
    //   );
    //   return { embeds: [ embed ] };
    // }

    // // Add the difficulty to the tier cutoffs object because MadCarroT's sheet doesn't have it there
    // tierCutoffsObj.forEach((obj) => {
    //   let difficulty = timeMasterObj.find(
    //     (innerObj) => innerObj["Map"] === obj["Map"]
    //   )["Difficulty"];

    //   obj["Difficulty"] = difficulty.length;
    // });

    // // Instantiate empty "master times object" to populate with calculated values (to be used for the majority of the data for the embed)
    // let masterTimesObj = [];

    // memberTimesObj.forEach((track) => {
    //   // Tier Cutoffs Sheet - specific track object
    //   let tiersObj = tierCutoffsObj.find(
    //     (obj) => obj["Map"] === track["Map"]
    //   );

    //   let differenceMilliseconds =
    //     convertTimeToMilliseconds(track["Record"], ".") -
    //     convertTimeToMilliseconds(tiersObj["Pro"], ".");

    //   if (differenceMilliseconds > 0) {
    //     differenceMilliseconds /= Math.round(
    //       1 + RATIO_MULTIPLIER * tiersObj["Difficulty"]
    //     );
    //   } else {
    //     differenceMilliseconds *= Math.round(
    //       1 + RATIO_MULTIPLIER * tiersObj["Difficulty"]
    //     );
    //   }

    //   // Slice 1 is to remove the map name; only return the individual tier times in order to calculate what tier the user is
    //   let tierTime = Object.values(tiersObj)
    //     .slice(1)
    //     .find((tier) => track["Record"] && track["Record"] <= tier);

    //   let tierLabel =
    //     Object.keys(tiersObj).find((key) => tiersObj[key] === tierTime) ||
    //     "Below T4";

    //   // Track each track and its name, the player's record, what tier that is considered as based on tier cutoffs, and the difference in time between the user's record and the pro time

    //   // Choose whether or not to include cp tracks (do not include as default) (this is in the time_master sheet, which is in the timeMasterObj object)
    //   if (tiersObj) {
    //     masterTimesObj.push({
    //       Track: track["Map"],
    //       Record: track["Record"],
    //       Tier: tierLabel,
    //       Difference: differenceMilliseconds,
    //     });
    //   }
    // });

    // masterTimesObj.sort((a, b) => {
    //   if (isNaN(a["Difference"]) && isNaN(b["Difference"])) {
    //     // Put unrecorded tracks at the bottom in reverse alphabetical order (such that when the bottom 5 tracks are printed, it will be in alphabetical order)
    //     return a["Track"] > b["Track"] ? -1 : 1;
    //   } else if (isNaN(a["Difference"])) {
    //     return 1;
    //   } else if (isNaN(b["Difference"])) {
    //     return -1;
    //   } else {
    //     return a["Difference"] - b["Difference"];
    //   }
    // });

    // let memberTierInfo = memberTiersObj.find(
    //   (obj) => obj["Player"] === nameInSheet
    // );

    // let averageTier = memberTierInfo["Average Tier"];

    // let descriptionString = `Average Tier: ${averageTier}`;

    // // Build string showing amount of time to shave for next tier
    // if (averageTier !== "Incomplete") {
    //   let nextTier = "";

    //   if (averageTier === "Below T4") {
    //     nextTier = "T4";
    //   } else if (averageTier === "Pro") {
    //     nextTier = "Pro";
    //   } else {
    //     nextTier = Object.keys(memberTierInfo)[Object.keys(memberTierInfo).indexOf(averageTier) - 1]
    //   }

    //   let timeToNextTierString = "";

    //   if (averageTier !== "Pro") {
    //     timeToNextTierString = `
    //   (Improve sum record times by ${memberTierInfo[nextTier]} for the next tier)`;
    //   }
    //   else {
    //     timeToNextTierString = `
    //   (Exceeding Pro tier cutoff time (${memberTierInfo[nextTier]}))`;
    //   }

    //   descriptionString += timeToNextTierString;
    // }

    // embed
    //   .setTitle(`Information for ${nameInSheet}`)
    //   // .setThumbnail(user.displayAvatarURL())
    //   .setDescription(descriptionString)
    //   .addFields({
    //     name: "Best Records",
    //     value: masterTimesObj
    //       .slice(0, NUM_TRACKS_TO_SHOW)
    //       .map((obj) => `${obj["Track"]} - ${obj["Record"]} (${obj["Tier"]})`)
    //       .join("\n"),
    //     inline: true,
    //   })
    //   .addFields({
    //     name: "Suggested Focus Tracks",
    //     value: masterTimesObj
    //       .slice(-NUM_TRACKS_TO_SHOW)
    //       .reverse()
    //       .map(
    //         (obj) =>
    //           `${obj["Track"]} - ${obj["Record"] || "No Record"} (${
    //           obj["Tier"]
    //           })`
    //       )
    //       .join("\n"),
    //     inline: true,
    //   })
    // return { embeds: [ embed ] };
  },
};

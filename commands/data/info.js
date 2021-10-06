const { SlashCommandBuilder } = require('@discordjs/builders');

const { google } = require("googleapis");

const {
  convertToObjects,
  convertTimeToMilliseconds,
  convertMillisecondsToTime,
  convertDiscordToGoogleSheetName,
} = require("../../utils/utils");

const { embed_color_error } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('(INVERSE MEMBERS ONLY) Provides records info on the user, if available.')
    .addStringOption(option =>
      option
        .setName('parameters')
        .setDescription('Name of user.')
        .setRequired(false)
    ),
  async execute(client, interaction, args, embed, auth) {
    // Number of tracks to show in embed for "best" and "worst" tracks
    const NUM_TRACKS_TO_SHOW = 7;
    // My own formula: calculate difference ratios to determine strongest/weakest maps instead of using static differences (IMO, a high tier time on harder map is considered "better"); default is 0, with higher numbers putting more emphasis on harder tracks being ranked higher relatively
    const RATIO_MULTIPLIER = 0.03;

    // First option is if the command is sent via message
    // Second option is if the command is sent via slash command in a server
    // Third option is if the command is sent via slash command in a direct message
    const messageUser = interaction?.author || interaction?.user || interaction?.member.user;

    // Get full user object from id, as the above data can vary based on how and where you input the command
    const user = await client.users.fetch(messageUser.id);

    // For now? Only let myself search by name if it is outside the Inverse server
    if (user.id !== process.env.CREATOR_ID) {
      if (
        (interaction?.guild && interaction?.guild.id !== process.env.SERVER_ID_INVERSE) 
      || 
      (interaction?.guild_id !== process.env.SERVER_ID_INVERSE)
      ) {
        embed.setDescription(
          "This command is currently only available for Inverse club members.\n\nIf you would like this implemented for your club and have a list of club time trial records on Google Sheets, contact <@194612164474961921> for more details."
        );
        return { embeds: [ embed ] };
      }
    }

    // Separating variable instantiation into separate line in case there is future implementation to support multiple club (sheets)
    let requestTimes;

    // This is MadCarroT's "Inverse Club Time Sheet" Google Sheet
    requestTimes = {
      spreadsheetId: "1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4",
      ranges: [
        "time_master!A2:I",
        "Member Times!A4:CQ",
        "Member Tiers!A3:G",
        // Remove the '90' afterwards; it's a stopgap due to an error in MadCarroT's sheet
        "Tier Cutoffs!A1:F90"],
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      // Start by parsing the Inverse Club Time Sheet
      const timesRows = (
        await sheets.spreadsheets.values.batchGet(requestTimes)
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

      if (!timeMasterObj || !memberTimesObj || !memberTiersObj || !tierCutoffsObj) {
        embed
        .setColor(embed_color_error)
        .setDescription(
          "An error has occured with parsing the time sheet. Please contact the developer."
        );
        return { embeds: [ embed ] };
      }

      // Normally I want to include the "Excluded" column in the time_master sheet, but due to how it is organized (column headers do not match the style of a standard table), I will manually write down the CP maps here...
      const EXCLUDED_TRACKS = ["Shanghai Noon", "Dragon Palace", "360 Tower", "Ice Lantern Road"].sort();

      // Look for the name in both the Member Times sheet as well as the separate name mapping sheet (will prematurely end the command if no name is found)
      let searchString =
        interaction?.options?.getString('parameters') ||
        args.join(' ');
      let lowerCaseSearchString = searchString?.toLocaleLowerCase();

      let nameInSheet = await convertDiscordToGoogleSheetName(sheets, timesRows[1].values[0].slice(2), lowerCaseSearchString, user);

      // Simplify the member times object to only display map and user's record
      memberTimesObj = memberTimesObj.map((obj) => {
        return {
          Map: obj["Map"],
          Record: obj[nameInSheet],
        };
      });

      // If number of tracks with actual recorded records is less than NUM_TRACKS_TO_SHOW, don't bother showing full information due to inaccuracies
      if (
        memberTimesObj.filter((obj) => obj["Record"]).length <
        NUM_TRACKS_TO_SHOW
      ) {
        embed
        .setColor(embed_color_error)
        .setDescription(
          "Not enough records. Please fill in your times to use this command!"
        );
        return { embeds: [ embed ] };
      }

      // Add the difficulty to the tier cutoffs object because MadCarroT's sheet doesn't have it there
      tierCutoffsObj.forEach((obj) => {
        let difficulty = timeMasterObj.find(
          (innerObj) => innerObj["Map"] === obj["Map"]
        )["Difficulty"];

        obj["Difficulty"] = difficulty.length;
      });

      // Instantiate empty "master times object" to populate with calculated values (to be used for the majority of the data for the embed)
      let masterTimesObj = [];
      
      memberTimesObj.forEach((track) => {
        // Tier Cutoffs Sheet - specific track object
        let tiersObj = tierCutoffsObj.find(
          (obj) => obj["Map"] === track["Map"]
        );

        let differenceMilliseconds =
          convertTimeToMilliseconds(track["Record"], ".") -
          convertTimeToMilliseconds(tiersObj["Pro"], ".");

        if (differenceMilliseconds > 0) {
          differenceMilliseconds /= Math.round(
            1 + RATIO_MULTIPLIER * tiersObj["Difficulty"]
          );
        } else {
          differenceMilliseconds *= Math.round(
            1 + RATIO_MULTIPLIER * tiersObj["Difficulty"]
          );
        }

        // Slice 1 is to remove the map name; only return the individual tier times in order to calculate what tier the user is
        let tierTime = Object.values(tiersObj)
          .slice(1)
          .find((tier) => track["Record"] && track["Record"] <= tier);

        let tierLabel =
          Object.keys(tiersObj).find((key) => tiersObj[key] === tierTime) ||
          "Below T4";

        // Track each track and its name, the player's record, what tier that is considered as based on tier cutoffs, and the difference in time between the user's record and the pro time

        // Choose whether or not to include cp tracks (do not include as default) (this is in the time_master sheet, which is in the timeMasterObj object)
        if (tiersObj && !EXCLUDED_TRACKS.includes(track["Map"])) {
          masterTimesObj.push({
            Track: track["Map"],
            Record: track["Record"],
            Tier: tierLabel,
            Difference: differenceMilliseconds,
          });
        }
      });

      masterTimesObj.sort((a, b) => {
        if (isNaN(a["Difference"]) && isNaN(b["Difference"])) {
          // Put unrecorded tracks at the bottom in reverse alphabetical order (such that when the bottom 5 tracks are printed, it will be in alphabetical order)
          return a["Track"] > b["Track"] ? -1 : 1;
        } else if (isNaN(a["Difference"])) {
          return 1;
        } else if (isNaN(b["Difference"])) {
          return -1;
        } else {
          return a["Difference"] - b["Difference"];
        }
      });

      let memberTierInfo = memberTiersObj.find(
        (obj) => obj["Player"] === nameInSheet
      );

      let averageTier = memberTierInfo["Average Tier"];

      let descriptionString = `Average Tier: ${averageTier}`;

      // Build string showing amount of time to shave for next tier
      if (averageTier !== "Incomplete") {
        let nextTier = "";

        if (averageTier === "Below T4") {
          nextTier = "T4";
        } else if (averageTier === "Pro") {
          nextTier = "Pro";
        } else {
          nextTier = Object.keys(memberTierInfo)[Object.keys(memberTierInfo).indexOf(averageTier) - 1]
        }

        let timeToNextTierString = "";

        if (averageTier !== "Pro") {
          timeToNextTierString = `
        (Improve sum record times by ${memberTierInfo[nextTier]} for the next tier)`;
        }
        else {
          timeToNextTierString = `
        (Exceeding Pro tier cutoff time (${memberTierInfo[nextTier]}))`;
        }

        descriptionString += timeToNextTierString;
      }

      embed
        .setTitle(`Information for ${nameInSheet}`)
        // .setThumbnail(user.displayAvatarURL())
        .setDescription(descriptionString)
        .addFields({
          name: "Best Records",
          value: masterTimesObj
            .slice(0, NUM_TRACKS_TO_SHOW)
            .map((obj) => `${obj["Track"]} - ${obj["Record"]} (${obj["Tier"]})`)
            .join("\n"),
          inline: true,
        })
        .addFields({
          name: "Suggested Focus Tracks",
          value: masterTimesObj
            .slice(-NUM_TRACKS_TO_SHOW)
            .reverse()
            .map(
              (obj) =>
                `${obj["Track"]} - ${obj["Record"] || "No Record"} (${
                obj["Tier"]
                })`
            )
            .join("\n"),
          inline: true,
        })
        .addFields({
          name: "‎",
          value: `(Tracks on time sheet excluded from tier calculations: ${EXCLUDED_TRACKS.join(", ")})`
        })
      return { embeds: [ embed ] };
    } catch (err) {
      // // Having this print makes the response take too long for slash function for some reason, so commenting it out
      // console.error(err);
      embed
      .setColor(embed_color_error)
      .setDescription(err);
      return { embeds: [ embed ] };
    }
  },
};

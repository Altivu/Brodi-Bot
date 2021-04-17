const { google } = require("googleapis");

const {
  convertToObjects,
  convertTimeToMilliseconds,
  convertMillisecondsToTime,
  convertDiscordToGoogleSheetName,
} = require("../../utils/utils");

module.exports = {
  name: "info",
  aliases: ["me"],
  description:
    "Provides records info on the user, if available.",
  options: [
    {
      name: "user",
      description: "Name of user.",
      required: false,
      type: 3, // string
    },
  ],
  async result(client, message, args, embed, auth) {
    // Number of tracks to show in embed for "best" and "worst" tracks
    const NUM_TRACKS_TO_SHOW = 5;
    // My own formula: calculate difference ratios to determine strongest/weakest maps instead of using static differences (IMO, a high tier time on harder map is considered "better")
    const RATIO_MULTIPLIER = 0.04;

    // First option is if the command is sent via message
    // Second option is if the command is sent via slash command in a server
    // Third option is if the command is sent via slash command in a direct message
    const messageUser = message.author || message.user || message.member.user;

    // Get full user object from id, as the above data can vary based on how and where you input the command
    const user = await client.users.fetch(messageUser.id);

    // For now? Only let myself search by name if it is outside the Inverse server
    if (user.id !== process.env.CREATOR_ID && (((message.guild && message.guild.id) || message.guild_id) === process.env.SERVER_ID_INVERSE)) {
      embed.setDescription(
        "This command is currently only available for Inverse club members."
      );
      return embed;
    }

    // // ISSUE: Guild shows it only has 4 members?...
    // console.log(client.guilds.fetch(process.env.SERVER_ID_INVERSE).then(guild => console.log(guild.members.cache.array().length)));

    // Look through Google Sheets
    const requestNames = {
      spreadsheetId: "1RKQQOx_WtgyU8o2d1BV9r1pF-dvg3UmP7CsZpJzUkks",
      ranges: ["Discord Servers!A:B", "Name Mapping!A:D"],
    };

    // Separating variable instantiation into separate line in case there is future implementation to support multiple club (sheets)
    let requestTimes;

    requestTimes = {
      spreadsheetId: "1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4",
      ranges: ["Tier Cutoffs!A:F", "Member Times!A4:CQ", "Member Tiers!A3:B"],
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      let nameInSheet = await convertDiscordToGoogleSheetName(sheets, requestNames, args, user);

      // Now begin logic based on acquired sheet name
      const timesRows = (
        await sheets.spreadsheets.values.batchGet(requestTimes)
      ).data.valueRanges;

      // Tier Cutoffs (Map Tiers)
      // Member Times
      // Member Tiers (contains Average Tier info)
      let tierCutoffsObj, memberTimesObj, memberTiersObj;

      if (timesRows[0].values.length) {
        tierCutoffsObj = convertToObjects(
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

      if (!tierCutoffsObj || !memberTimesObj || !memberTiersObj) {
        embed.setDescription(
          "An error has occured with parsing the time sheet. Please contact the developer."
        );
        return embed;
      }

      // Simplify the objects to only display map and user's record
      memberTimesObj = memberTimesObj.map((obj) => {
        return {
          Map: obj["Map"],
          Difficulty: obj["Difficulty"].length,
          Record: obj[nameInSheet],
        };
      });

      // If number of tracks with actual recorded records is less than NUM_TRACKS_TO_SHOW, don't bother showing full information due to inaccuracies
      if (
        memberTimesObj.filter((obj) => obj["Record"]).length <
        NUM_TRACKS_TO_SHOW
      ) {
        embed.setDescription(
          "Not enough records. Please fill in your times to use this command!"
        );
        return embed;
      }

      // Add the difficulty to the tier cutoffs object because MadCarroT's sheet doesn't have it there
      tierCutoffsObj.forEach((obj) => {
        let difficulty = memberTimesObj.find(
          (innerObj) => innerObj["Map"] === obj["Map"]
        )["Difficulty"];

        obj["Difficulty"] = difficulty;
      });

      // Instantiate empty master times object to populate with calculated values (to be used for the majority of the data for the embed)
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

        let tierTime = Object.values(tiersObj)
          .slice(1)
          .find((tier) => track["Record"] && track["Record"] < tier);

        let tierLabel =
          Object.keys(tiersObj).find((key) => tiersObj[key] === tierTime) ||
          "Below T4";

        if (tiersObj) {
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

      let averageTier = memberTiersObj.find(
        (obj) => obj["Player"] === nameInSheet
      )["Average Tier"];

      embed
        .setTitle(`Information for ${nameInSheet}`)
        // .setThumbnail(user.displayAvatarURL())
        .setDescription(`Average Tier: ${averageTier}`)
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
        });
      return embed;
    } catch (err) {
      console.error(err);
      embed.setDescription(err);
      return embed;
    }
  },
};

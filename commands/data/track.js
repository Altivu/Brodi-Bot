const { google } = require("googleapis");
const fetch = require("node-fetch");
const requestImageSize = require('request-image-size');

const {
  convertToObjects,
  convertDiscordToGoogleSheetName,
} = require("../../utils/utils");

module.exports = {
  name: "track",
  aliases: ["map"],
  description:
    "Provides track details. Search by arguments or provide nothing to get a random track.",
  options: [
    {
      name: "parameters",
      description: "Name of track. You can also type 'theme' to get a track theme list, or further filter by theme name.",
      required: false,
      type: 3, // string
    },
  ],
  async result(client, message, args, embed, auth) {
    // Image to show at bottom of embed (map + background)
    const imageUrl = "https://krrplus.web.app/assets/Tracks/Combination";
    // // Primary source of track information (such as laps, modes, and release date)
    // const jsonUrl = "https://krrplus.web.app/assets/Tracks/tracks.json";

    // My separate spreadsheet containing track info, including record and tutorial videos
    const tracksSpreadsheetInfo = {
      spreadsheetId: "1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E",
      range: "Tracks!A:N",
    };

    // Link to Google Sheets, which gets track tiers and member times (if applicable)
    const tiersSpreadsheetInfo = {
      // // My spreadsheet
      // spreadsheetId: "1op1V759st7jQRF-heahsZMKy-985059hSRXrMI_OwC4",
      // MadCarroT's spreadsheet (change to this one once done)
      spreadsheetId: "1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4",
      ranges: ["Tier Cutoffs!A:F", "Member Times!A4:CQ"],
    };

    const namesMappingSpreadSheetInfo = {
      spreadsheetId: "1RKQQOx_WtgyU8o2d1BV9r1pF-dvg3UmP7CsZpJzUkks",
      ranges: ["Discord Servers!A:B", "Name Mapping!A:D"],
    };

    const chinaTiersSpreadsheetInfo = {
      spreadsheetId: "1lMa0_eA2742NT91hKaAz8W5aaHluVKcL4vGq8Pfhw9o",
      ranges: ["Tier Cutoffs!A:G"],
    }

    // // Retrieve track data from JSON file from my website (this will be used for primary info)
    // const tracksData = await fetch(jsonUrl).then((response) =>
    //   response.json()
    // );

    const sheets = google.sheets({ version: "v4", auth });

    try {
      // First, get the tracks data
      const tracksSpreadsheetObj = (
        await sheets.spreadsheets.values.get(tracksSpreadsheetInfo)
      ).data.values;

      // If the Spreadsheet data could not be retrieved, return appropriate description and exit command logic
      if (!tracksSpreadsheetObj.length) {
        embed.setDescription(
          `An error has occured attempting to fetch the 'KartRider Rush+ Tracks' Spreadsheet.`
        );
        return embed;
      }

      let tracksData = convertToObjects(
        tracksSpreadsheetObj[0],
        tracksSpreadsheetObj.slice(1)
      );

      // Analyze provided arguments
      let searchString = args.join(" ").toLocaleLowerCase().trim();

      // There are "iPhone apostrophes" which are different from standard, so replace those prior to searching so we don't get missing results
      searchString = searchString.replace(/’/g, "'");

      // Retrieve object of track matching given arguments
      let track;

      // Because reverse tracks are sorted at the top of the list in the "raw" data, using find would get these tracks first; resort the object here to place them at the bottom
      tracksData.sort((a, b) => {
        // Exception for tracks that aren't given an English name
        if (!a["Name"] || !b["Name"]) {
          return 0;
        }

        if (a["Name"].includes("[R]") && !b["Name"].includes("[R]")) {
          return 1;
        }
        else if (!a["Name"].includes("[R]") && b["Name"].includes("[R]")) {
          return -1;
        }
        else {
          return a["Name"].localeCompare(b["Name"]);
        }
      });

      // If an argument is provided, search the data based on the given search term, otherwise get a random track
      if (args.length > 0) {
        // Do a special search on themes if the keyboard is provided
        if (searchString.split(" ")[0] && searchString.split(" ")[0].toLocaleLowerCase().includes("theme")) {
          if (!searchString.split(" ")[1]) {
            // Get number of themes
            const uniqueThemes = Array.from(new Set([...tracksData.map((track) => track["Theme"])])).filter((theme) => theme).sort();

            embed.setTitle("Track Themes")
              .setDescription(`
            There are a total of ${uniqueThemes.length} themes:

            ${uniqueThemes.join('\n')}
            `);
            return embed;
          }
          else {
            let searchThemeString = searchString.split(" ")[1]

            let themeTracks = tracksData.filter((obj) =>
              obj["Theme"] && obj["Theme"].trim().toLocaleLowerCase() === searchThemeString.trim().toLocaleLowerCase()
            )

            if (!themeTracks || themeTracks.length == 0) {
              embed.setDescription(`No track theme found under the name "${searchThemeString}"`);
              
              return embed;
            }

            embed.setTitle(`Tracks - ${searchThemeString.toLocaleLowerCase() !== "wkc" ? searchThemeString.charAt(0).toLocaleUpperCase() + searchThemeString.slice(1).toLocaleLowerCase() : searchThemeString.toLocaleUpperCase()} Theme`);

            let releasedTracks = themeTracks.filter(track => track["Release Date"]).map(track => track["Name"]).join('\n');
            let unreleasedTracks = themeTracks.filter(track => !track["Release Date"]).map(track => track["Name"]).join('\n');

            if (releasedTracks.length > 0) {
              embed.addFields({
                name: "Released Tracks",
                value: releasedTracks
              });
            }

            if (unreleasedTracks.length > 0) {
              embed.addFields({
                name: "Unreleased in Global",
                value: unreleasedTracks
              })
            }
          }

          return embed;
        }

        track =
          tracksData.find(
            (obj) =>
              (obj["Name"] && obj["Name"].toLocaleLowerCase() ===
                searchString.toLocaleLowerCase()) || (obj["Name (CN)"] && obj["Name (CN)"].toLocaleLowerCase() ===
                  searchString.toLocaleLowerCase()) || (obj["Name (KR)"] && obj["Name (KR)"].toLocaleLowerCase() ===
                    searchString.toLocaleLowerCase())
          ) ||
          tracksData.find((obj) =>
            (obj["Name"] && obj["Name"]
              .toLocaleLowerCase()
              .includes(searchString.toLocaleLowerCase())) || (obj["Name (CN)"] && obj["Name (CN)"].toLocaleLowerCase().includes(
                searchString.toLocaleLowerCase())) || (obj["Name (KR)"] && obj["Name (KR)"].toLocaleLowerCase().includes(
                  searchString.toLocaleLowerCase()))
          );
      } else {
        track =
          tracksData[Math.floor(Math.random() * tracksData.length)];
      }

      // If no track was found, return appropriate message
      if (!track) {
        let noResultsString = `No track found under the name "${args.join(" ")}".`;

        let trackSuggestions = tracksData.filter(track => searchString && searchString.length >= 2 && track["Name"] && (track["Name"].toLocaleLowerCase().startsWith(searchString.slice(0, 2).toLocaleLowerCase()) || track["Name"].toLocaleLowerCase().endsWith(searchString.slice(-2).toLocaleLowerCase()))).splice(0, 5).map(data => data["Name"]);

        if (trackSuggestions.length > 0) {
          noResultsString += `\n\n**Some suggestions:**\n${trackSuggestions.join('\n')}`;
        }

        embed.setDescription(noResultsString);
        return embed;
      }

      // If a track was found, begin filling the embed with info
      embed.setTitle(track["Name"]);

      // Build CH/KR string, if applicable
      let otherNames = "";

      if (track["Name (CN)"]) {
        otherNames += `**CN:** ${track["Name (CN)"]}\n`;
      }

      if (track["Name (KR)"]) {
        otherNames += `**KR:** ${track["Name (KR)"]}`;
      }

      embed.setDescription(otherNames);

      // Basic info
      embed.addFields({
        name: "Basic Info", value:
          `
          **Theme:** ${track["Theme"]}
          **License:** ${track["License"]}
          **Difficulty:** ${track["Difficulty"] ?
          "★".repeat(track["Difficulty"]) +
          "☆".repeat(5 - track["Difficulty"]) : ""
          }
          **Laps: ** ${track["Laps"]}
          `
      });
      if (track["Item"] != "" && track["Relay"] != "") {
        embed.addFields({
          name: "Mode Info",
          value: `
          **Item:** ${track["Item"] === "TRUE" ? "☑" : "☐"}
          **Relay:** ${track["Relay"] === "TRUE" ? "☑" : "☐"}
          `,
        })
      }
      
      let releaseDateString = "";

      if (track["Release Date"]) {
        releaseDateString = new Date (track["Release Date"]).toDateString();
      }

      if (track["Season of Release"]) {
        releaseDateString += `
        (${!track["Release Date"] ? "Estimated " : "" }Season ${track["Season of Release"]})`;
      }

      if (releaseDateString) {
        embed.addFields({
          name: "Release Date/Season",
          value: releaseDateString,
        });
      }

      // Now start parsing for the track tier information
      const tiersSpreadsheetObj = (await sheets.spreadsheets.values.batchGet(tiersSpreadsheetInfo)).data
        .valueRanges;

      if (tiersSpreadsheetObj[0].values.length) {
        // Tier cutoff information JSON object
        let tracksTiersObj = convertToObjects(
          tiersSpreadsheetObj[0].values[0],
          tiersSpreadsheetObj[0].values.slice(1)
        );

        // Look to see if the map is in the tier cutoff object
        let trackTiers = tracksTiersObj.find(
          (obj) => obj["Map"] === track["Name"]
        );

        // Another minor check for some China server tracks (this spreadsheet will probably not be updated so it is temporary in a sense)
        if (!trackTiers) {
          const chinaTiersSpreadsheetObj = (await sheets.spreadsheets.values.batchGet(chinaTiersSpreadsheetInfo)).data
            .valueRanges;

          if (chinaTiersSpreadsheetObj[0].values.length) {
            // Tier cutoff information JSON object
            let chinaTracksTiersObj = convertToObjects(
              chinaTiersSpreadsheetObj[0].values[0],
              chinaTiersSpreadsheetObj[0].values.slice(1)
            );

            // Look to see if the map is in the tier cutoff object
            trackTiers = chinaTracksTiersObj.find(
              (obj) => obj["Map"] === track["Name"]
            );
          }
        }

        if (trackTiers) {
          embed.addFields({
            name: "Tier Cutoffs",
            value: `
          **Pro:** ${trackTiers["Pro"]}
          **T1:** ${trackTiers["T1"]}
          **T2:** ${trackTiers["T2"]}
          **T3:** ${trackTiers["T3"]}
          **T4:** ${trackTiers["T4"]}
          `,
          });

          // Now check if the user has a recorded time for the track

          // First option is if the command is sent via message
          // Second option is if the command is sent via slash command in a server
          // Third option is if the command is sent via slash command in a direct message
          const messageUser =
            message.author || message.user || message.member.user;

          const user = await client.users.fetch(messageUser.id);

          // Additional section to get information concerning your own recorded time, if applicable
          let nameInSheet;

          try {
            nameInSheet = await convertDiscordToGoogleSheetName(
              sheets,
              tiersSpreadsheetObj[1].values[0].slice(2),
              namesMappingSpreadSheetInfo,
              [],
              user
            );
          } catch (_err) { }

          // If the user's name was found, look through the whole range to get the map time
          if (nameInSheet) {
            let timesObj = convertToObjects(
              tiersSpreadsheetObj[1].values[0],
              tiersSpreadsheetObj[1].values.slice(1)
            );

            let mapObj = timesObj.find((obj) => obj["Map"] === track["Name"]);

            if (mapObj && mapObj[nameInSheet]) {
              let tierTime = Object.values(trackTiers)
                .slice(1)
                .find((tier) => mapObj[nameInSheet] < tier);
              let nextTierTime = Object.values(trackTiers)
                .reverse()
                .slice(1)
                .find((tier) => mapObj[nameInSheet] >= tier);

              let tierLabel =
                Object.keys(trackTiers).find(
                  (key) => trackTiers[key] === tierTime
                ) || "Below T4";
              let nextTierLabel = Object.keys(trackTiers).find(
                (key) => trackTiers[key] === nextTierTime
              );
              embed.addFields({
                name: "Your Recorded Record",
                value: `${mapObj[nameInSheet]} (${tierLabel})`,
              });
            }
          }
        } else {
          embed.addFields({
            name: "Tier Cutoffs",
            value: "N/A",
          });
        }
      }

      // Include record and tutorial videos at the bottom, if applicable
      let records =
        track["Records"] &&
        track["Records"].split("\n");
      let tutorials =
        track["Tutorials"] &&
        track["Tutorials"].split("\n");

      if (records) {
        embed.addFields({
          name: "Records",
          value: records
            .map((obj) => {
              let stringArray = obj.split(" ");

              return `[${stringArray
                .slice(0, -1)
                .join(" ")}]${stringArray.slice(-1)}`;
            })
            .join("\n"),
        });
      }

      if (tutorials) {
        embed.addFields({
          name: "Tutorials",
          value: tutorials
            .map((obj) => {
              let stringArray = obj.split(" ");

              return `[${stringArray
                .slice(0, -1)
                .join(" ")}]${stringArray.slice(-1)}`;
            })
            .join("\n"),
        });
      }

      try {
      // Add combination icon image; logic includes reverse map exceptions
      let finalImageUrl = `${imageUrl}/${track["File Id"]}${
        track["File Id"].includes("_icon01") ? "" : "_icon"
        }.png`;

        // This line will error out if the image is not found, which prevents the embed from setting the image
        // This is required, as if you try to set the image with an invalid url, the embed is not visible on mobile devices (for some reason...)
        await requestImageSize(finalImageUrl);

        embed.setImage(finalImageUrl);
      } catch(_err) {

      }

      // Once everything is built, return the embed
      return embed;
    } catch (err) {
      console.error(err);
    }
  },
};

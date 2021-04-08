const { google } = require("googleapis");
const fetch = require("node-fetch");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "track",
  aliases: ["map"],
  description:
    "Provides track details. Search by arguments or provide nothing to get a random track.",
  options: [
    {
      name: "parameters",
      description: "Name of track.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    // Image to show at bottom of embed (map + background)
    const imageUrl = "https://krrplus.web.app/assets/Tracks/Combination";
    // Primary source of track information (such as laps, modes, and release date)
    const jsonUrl = "https://krrplus.web.app/assets/Tracks/tracks.json";
    // Link to Google Sheets, which gets track tiers and member times (if applicable)
    const request = {
      // // My spreadsheet
      // spreadsheetId: "1op1V759st7jQRF-heahsZMKy-985059hSRXrMI_OwC4",
      // MadCarroT's spreadsheet (change to this one once done)
      spreadsheetId: "1l3lFe_XD8d05PtM9OSdygQJQc-vaAdPUqbfFwLT1yKo",
      // The reason for the second and third ranges are to save a little bit on computation; if a name is not found in the second range, don't bother with searching in the third range
      ranges: ["Tier Cutoffs!A:F", "Member Times!C4:CQ4", "Member Times!A4:CQ"],
    };

    // My separate spreadsheet containing record and tutorial video information (perhaps I could consider integrating this with MadCarroT's spreadsheet in the future?)
    const requestResources = {
      spreadsheetId: "1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E",
      range: "Videos!A:E",
    };

    // Retrieve track data from JSON file from my website (this will be used for primary info)
    const tracksMainObj = await fetch(jsonUrl).then((response) =>
      response.json()
    );

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.batchGet(request)).data
        .valueRanges;

      if (rows[0].values.length) {
        // Tier cutoff information JSON object
        let tracksTiersObj = convertToObjects(
          rows[0].values[0],
          rows[0].values.slice(1)
        );

        // Analyze provided arguments
        let searchString = args.join(" ").toLocaleLowerCase();

        // Retrieve object of track matching given arguments
        let track;

        if (args.length > 0) {
          track = tracksMainObj.find(
            (obj) =>
              obj["Name"].toLocaleLowerCase() === searchString ||
              obj["Name"].toLocaleLowerCase().includes(searchString)
          );
        } else {
          track =
            tracksMainObj[Math.floor(Math.random() * tracksMainObj.length)];
        }

        if (!track) {
          embed.setDescription(
            `No track found under the name "${args.join(" ")}".`
          );
          return embed;
        }
        // If a track was found, begin filling the embed with info
        embed
          .setTitle(track["Name"])
          .setDescription(
            `
          **License:** ${track["License"]}
          **Difficulty:** ${
            "★".repeat(track["Difficulty"]) +
            "☆".repeat(5 - track["Difficulty"])
          }
          **Laps: ** ${track["Laps"]}
          `
          )
          .addFields({
            name: "Mode Info",
            value: `
          **Item:** ${track["Item"] ? "☑" : "☐"}
          **Relay:** ${track["Relay"] ? "☑" : "☐"}
          `,
          });

        // Look to see if the map is in the tier cutoff object
        let trackTiers = tracksTiersObj.find(
          (obj) => obj["Map"] === track["Name"]
        );

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

          // First option is if the command is sent via message
          // Second option is if the command is sent via slash command in a server
          // Third option is if the command is sent via slash command in a direct message
          let user = message.author || message.user || message.member.user;

          let username = user.username && user.username.toLocaleLowerCase();
          let tag = user.tag && user.tag.split("#")[0].toLocaleLowerCase();

          // Additional section to get information concerning your own recorded time, if applicable
          let recordedName = rows[1].values[0].find((name) =>
            [username, tag].includes(name.toLocaleLowerCase())
          );

          // If the user's name was found, look through the whole range to get the map time
          if (recordedName) {
            let timesObj = convertToObjects(
              rows[2].values[0],
              rows[2].values.slice(1)
            );
            let mapObj = timesObj.find((obj) => obj["Map"] === track["Name"]);

            if (mapObj && mapObj[recordedName]) {
              let tierTime = Object.values(trackTiers)
                .slice(1)
                .find((tier) => mapObj[recordedName] < tier);
              let nextTierTime = Object.values(trackTiers)
                .reverse()
                .slice(1)
                .find((tier) => mapObj[recordedName] >= tier);

              let tierLabel =
                Object.keys(trackTiers).find((key) => trackTiers[key] === tierTime) ||
                "Below T4";
              let nextTierLabel = Object.keys(trackTiers).find(
                (key) => trackTiers[key] === nextTierTime
              );
              embed.addFields({
                name: "Your Recorded Record",
                value: `${mapObj[recordedName]} (${tierLabel})`,
              });
            }
          }
        } else {
          embed.addFields({
            name: "Tier Cutoffs",
            value: "N/A",
          });
        }

        embed.addFields({
          name: "Release Date",
          value: new Date(track["Release Date"]).toDateString(),
        });

        const rowsResources = (
          await sheets.spreadsheets.values.get(requestResources)
        ).data.values;

        if (rowsResources.length) {
          let tracksResourcesObj = convertToObjects(
            rowsResources[0],
            rowsResources.slice(1)
          );

          // Look to see if the map is in the tier cutoff object
          let trackResources = tracksResourcesObj.find(
            (obj) => obj["Name"] === track["Name"]
          );

          // Check to see if the track is in the Videos worksheet, and format embed accordingly
          if (trackResources) {
            let records =
              trackResources["Records"] &&
              trackResources["Records"].split("\n");
            let tutorials =
              trackResources["Tutorials"] &&
              trackResources["Tutorials"].split("\n");

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

            // Reverse map exceptions
            embed.setImage(`${imageUrl}/${track["File Id"]}${track["File Id"].includes("_icon01") ? "" : "_icon"}.png`);
          }

          return embed;
        }
      }
    } catch (err) {
      console.error(err);
    }
  },
};

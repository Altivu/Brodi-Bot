const { google } = require("googleapis");
const fetch = require("node-fetch");

const { convertToObjects } = require("../../utils/utils");

module.exports = {
  name: "track",
  aliases: ["map"],
  description: "Provides track details. Search by arguments or provide nothing to get a random track.",
  async result(_client, message, args, embed, auth) {
    const imageUrl = "https://krrplus.web.app/assets/Tracks/Combination";
    const jsonUrl = "https://krrplus.web.app/assets/Tracks/tracks.json";
    const request = {
      spreadsheetId: "1l3lFe_XD8d05PtM9OSdygQJQc-vaAdPUqbfFwLT1yKo",
      range: "Tier Cutoffs!A:F",
    };
    const requestResources = {
      spreadsheetId: "1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E",
      range: "Videos!A:E",
    };

    // Retrieve track data from JSON file from my website (this will be used for primary info)
    const tracksMainObj = await fetch(jsonUrl).then((response) =>
      response.json()
    );

    // Get data from MadCarroT's Google sheet which contains tier cutoff information
    // Also get data from my Google sheet which contains videos (records and tutorials)
    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        // Tier cutoff information JSON object
        let tracksTiersObj = convertToObjects(rows[0], rows.slice(1));

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
              let records = trackResources["Records"] && trackResources["Records"].split("\n");
              let tutorials = trackResources["Tutorials"] && trackResources["Tutorials"].split("\n");

              if (records) {
                embed.addFields({
                  name: "Records",
                  value: records
                    .map((obj) => {
                      let stringArray = obj.split(" ");

                      return `[${stringArray.slice(0, -1).join(" ")}]${stringArray.slice(
                        -1
                      )}`;
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

                      return `[${stringArray.slice(0, -1).join(" ")}]${stringArray.slice(
                        -1
                      )}`;
                    })
                    .join("\n"),
                });
              }

              embed.setImage(`${imageUrl}/${track["File Id"]}_icon.png`);
            }

            return embed;
          }
      }
    } catch (err) {
      console.error(err);
    }
  },
};

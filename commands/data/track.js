const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { google } = require('googleapis');
const fetch = require('node-fetch');

const {
  convertToObjects,
  convertDiscordToGoogleSheetName,
  parseTrackSearchString,
  getEditDistance
} = require('../../utils/utils');

const { embed_color_error } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('track')
    .setDescription(
      'Provides track details. Search by arguments or provide nothing to get a random track.'
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('name')
        .setDescription(
          'Search track by name, or provide nothing to get a random track.'
        )
        .addStringOption(option =>
          option
            .setName('parameters')
            .setDescription('Name of track.')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('theme')
        .setDescription(
          'Search tracks by theme, or provide nothing to get a list of themes.'
        )
        .addStringOption(option =>
          option
            .setName('parameters')
            .setDescription('Name of theme.')
            .setRequired(false)
        )
    ),
  aliases: ['map'],
  async execute(client, interaction, args, embed, auth) {
    // Maximum distance allowed before search string is deemed too invalid
    const LEVENSHTEIN_DISTANCE_MAX = 6;

    // Image to show at bottom of embed (map + background)
    const imageUrl = 'https://krrplus.web.app/assets/Tracks/Combination';
    // // Primary source of track information (such as laps, modes, and release date)
    // const jsonUrl = "https://krrplus.web.app/assets/Tracks/tracks.json";

    // My separate spreadsheet containing track info, including record and tutorial videos
    const tracksSpreadsheetInfo = {
      spreadsheetId: '1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E',
      range: 'Tracks!A:O',
    };

    // Link to Google Sheets, which gets track tiers and member times (if applicable)
    const tiersSpreadsheetInfo = {
      // // My spreadsheet
      // spreadsheetId: "1op1V759st7jQRF-heahsZMKy-985059hSRXrMI_OwC4",
      // MadCarroT's spreadsheet (change to this one once done)
      spreadsheetId: '1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4',
      ranges: ['Tier Cutoffs!A:F', 'Member Times!A4:CQ'],
    };

    const chinaTiersSpreadsheetInfo = {
      spreadsheetId: '1lMa0_eA2742NT91hKaAz8W5aaHluVKcL4vGq8Pfhw9o',
      ranges: ['Tier Cutoffs!A:G'],
    };

    // // Retrieve track data from JSON file from my website (this will be used for primary info)
    // const tracksData = await fetch(jsonUrl).then((response) =>
    //   response.json()
    // );

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // First, get the tracks data
      const tracksSpreadsheetObj = (
        await sheets.spreadsheets.values.get(tracksSpreadsheetInfo)
      ).data.values;

      // If the Spreadsheet data could not be retrieved, return appropriate description and exit command logic
      if (!tracksSpreadsheetObj.length) {
        embed
          .setColor(embed_color_error)
          .setDescription(
            `An error has occured attempting to fetch the 'KartRider Rush+ Tracks' Spreadsheet.`
          );
        return { embeds: [embed] };
      }

      let tracksData = convertToObjects(
        tracksSpreadsheetObj[0],
        tracksSpreadsheetObj.slice(1)
      );

      // Get subcommand
      let subCommandName = interaction?.options?.getSubcommand() || args[0];

      // Get other arguments
      let searchString =
        interaction?.options?.getString('parameters') ||
        args.slice(1).join(' ');
      let lowerCaseSearchString = searchString?.toLocaleLowerCase()?.trim();

      ///////////////////////
      // TRACK NAME SEARCH //
      ///////////////////////

      if (subCommandName === 'name') {
        // Parse search string to make it easier to search
        lowerCaseSearchString = parseTrackSearchString(lowerCaseSearchString);

        // Because reverse tracks are sorted at the top of the list in the "raw" data, using find would get these tracks first; resort the object here to place them at the bottom
        tracksData.sort((a, b) => {
          // Exception for tracks that aren't given an English name
          if (!a['Name'] || !b['Name']) {
            return 0;
          }

          if (a['Name'].includes('[R]') && !b['Name'].includes('[R]')) {
            return 1;
          } else if (!a['Name'].includes('[R]') && b['Name'].includes('[R]')) {
            return -1;
          } else {
            return a['Name'].localeCompare(b['Name']);
          }
        });

        // Retrieve object of track matching given arguments
        let track;

        // If an argument is provided, search the data based on the given search term, otherwise get a random track
        if (lowerCaseSearchString) {
          // Do a special search on themes if the keyboard is provided
          track =
            tracksData.find(
              obj =>
                (obj['Name'] &&
                  obj['Name'].toLocaleLowerCase() === lowerCaseSearchString) ||
                (obj['Name (CN)'] &&
                  obj['Name (CN)'].toLocaleLowerCase() ===
                    lowerCaseSearchString) ||
                (obj['Name (KR)'] &&
                  obj['Name (KR)'].toLocaleLowerCase() ===
                    lowerCaseSearchString)
            ) ||
            tracksData.find(
              obj =>
                (obj['Name'] &&
                  obj['Name']
                    .toLocaleLowerCase()
                    .includes(lowerCaseSearchString)) ||
                (obj['Name (CN)'] &&
                  obj['Name (CN)']
                    .toLocaleLowerCase()
                    .includes(lowerCaseSearchString)) ||
                (obj['Name (KR)'] &&
                  obj['Name (KR)']
                    .toLocaleLowerCase()
                    .includes(lowerCaseSearchString))
            );
        } else {
          track = tracksData[Math.floor(Math.random() * tracksData.length)];
        }

        // Prepare an additional embed if the levenshtein distance algorithm is used due to search string not being valid
        let levenshteinEmbed = null;

        // If no track was found, return appropriate message
        if (!track) {
          // Use Levenshtein distance algorithm to get closest track match
          track = tracksData.reduce((prev, curr) => {
            const levenshteinDistance = getEditDistance(lowerCaseSearchString, curr?.Name?.toLocaleLowerCase() || "");
            
            if (levenshteinDistance <= LEVENSHTEIN_DISTANCE_MAX &&
            (!prev || levenshteinDistance < prev["levenshteinDistance"])) {
              return {
                ...curr,
                levenshteinDistance
              }
            } else {
              return prev;
            }
          }, null);

          // If a track was found, inform that the levenshtein algorithm was used in a separate embed
          if (track && track['Name']) {
            levenshteinEmbed = new MessageEmbed()
            .setColor(embed_color_error)
            .setDescription(`No track found under the name "${searchString}".
            
Returning the closest match based on the Levenshtein Distance algorithm (up to a max distance of ${LEVENSHTEIN_DISTANCE_MAX})...

**Track Name:** ${track['Name']}
**Distance:** ${track['levenshteinDistance']}`);
          } else {
            // If there's STILL no track (the user probably input some horribly incorrect search string), then return the no track found message
            let noResultsString = `No track found under the name "${searchString}".`;

            let trackSuggestions = tracksData
              .filter(
                track =>
                  lowerCaseSearchString &&
                  lowerCaseSearchString.length >= 2 &&
                  track['Name'] &&
                  (track['Name']
                    .toLocaleLowerCase()
                    .startsWith(lowerCaseSearchString.slice(0, 2)) ||
                    track['Name']
                      .toLocaleLowerCase()
                      .endsWith(lowerCaseSearchString.slice(-2)))
              )
              .splice(0, 5)
              .map(data => data['Name']);

            if (trackSuggestions.length > 0) {
              noResultsString += `\n\n**Some suggestions:**\n${trackSuggestions.join(
                '\n'
              )}`;
            }

            embed.setColor(embed_color_error).setDescription(noResultsString);

            return { embeds: [embed] };
          }
        }

        // If a track was found, begin filling the embed with info
        embed.setTitle(track['Name']);

        // Build CH/KR string, if applicable
        let otherNames = '';

        if (track['Name (CN)']) {
          otherNames += `**CN:** ${track['Name (CN)']}\n`;
        }

        if (track['Name (KR)']) {
          otherNames += `**KR:** ${track['Name (KR)']}`;
        }

        embed.setDescription(otherNames);

        // Basic info
        embed.addFields({
          name: 'Basic Info',
          value: `
**Theme:** ${track['Theme']}
**License:** ${track['License']}
**Difficulty:** ${
            track['Difficulty']
              ? '★'.repeat(track['Difficulty']) +
                '☆'.repeat(5 - track['Difficulty'])
              : ''
          }
**Laps: ** ${track['Laps']}
`,
        });
        if (track['Item'] != '' && track['Relay'] != '') {
          embed.addFields({
            name: 'Mode Info',
            value: `
**Item:** ${track['Item'] === 'TRUE' ? '☑' : '☐'}
**Relay:** ${track['Relay'] === 'TRUE' ? '☑' : '☐'}
`,
          });
        }

        let releaseDateString = '';

        if (track['Release Date']) {
          releaseDateString = new Date(track['Release Date']).toDateString();
        }

        if (track['Season of Release']) {
          releaseDateString += `
(${!track['Release Date'] ? 'Estimated ' : ''}Season ${
            track['Season of Release']
          })`;
        }

        if (releaseDateString) {
          embed.addFields({
            name: 'Release Date/Season',
            value: releaseDateString,
          });
        }

        // Now start parsing for the track tier information
        const tiersSpreadsheetObj = (
          await sheets.spreadsheets.values.batchGet(tiersSpreadsheetInfo)
        ).data.valueRanges;

        if (tiersSpreadsheetObj[0].values.length) {
          // Tier cutoff information JSON object
          let tracksTiersObj = convertToObjects(
            tiersSpreadsheetObj[0].values[0],
            tiersSpreadsheetObj[0].values.slice(1)
          );

          // Look to see if the map is in the tier cutoff object
          let trackTiers = tracksTiersObj.find(
            obj => obj['Map'] === track['Name']
          );

          // Another minor check for some China server tracks (this spreadsheet will probably not be updated so it is temporary in a sense)
          if (!trackTiers) {
            const chinaTiersSpreadsheetObj = (
              await sheets.spreadsheets.values.batchGet(
                chinaTiersSpreadsheetInfo
              )
            ).data.valueRanges;

            if (chinaTiersSpreadsheetObj[0].values.length) {
              // Tier cutoff information JSON object
              let chinaTracksTiersObj = convertToObjects(
                chinaTiersSpreadsheetObj[0].values[0],
                chinaTiersSpreadsheetObj[0].values.slice(1)
              );

              // Look to see if the map is in the tier cutoff object
              trackTiers = chinaTracksTiersObj.find(
                obj => obj['Map'] === track['Name']
              );
            }
          }

          if (trackTiers) {
            embed.addFields({
              name: 'Tier Cutoffs',
              value: `
**Pro:** ${trackTiers['Pro']}
**T1:** ${trackTiers['T1']}
**T2:** ${trackTiers['T2']}
**T3:** ${trackTiers['T3']}
**T4:** ${trackTiers['T4']}
`,
            });

            // Now check if the user has a recorded time for the track

            // First option is if the command is sent via message
            // Second option is if the command is sent via slash command in a server
            // Third option is if the command is sent via slash command in a direct message
            const user =
              interaction?.author || interaction?.user || interaction?.member.user;

            // Additional section to get information concerning your own recorded time, if applicable
            let nameInSheet;

            try {
              nameInSheet = await convertDiscordToGoogleSheetName(
                sheets,
                tiersSpreadsheetObj[1].values[0].slice(2),
                undefined,
                user
              );
            } catch (_err) {}

            // If the user's name was found, look through the whole range to get the map time
            if (nameInSheet) {
              let timesObj = convertToObjects(
                tiersSpreadsheetObj[1].values[0],
                tiersSpreadsheetObj[1].values.slice(1)
              );

              let mapObj = timesObj.find(obj => obj['Map'] === track['Name']);

              if (mapObj && mapObj[nameInSheet]) {
                let tierTime = Object.values(trackTiers)
                  .slice(1)
                  .find(tier => mapObj[nameInSheet] < tier);
                let nextTierTime = Object.values(trackTiers)
                  .reverse()
                  .slice(1)
                  .find(tier => mapObj[nameInSheet] >= tier);

                let tierLabel =
                  Object.keys(trackTiers).find(
                    key => trackTiers[key] === tierTime
                  ) || 'Below T4';
                let nextTierLabel = Object.keys(trackTiers).find(
                  key => trackTiers[key] === nextTierTime
                );
                embed.addFields({
                  name: 'Your Recorded Record',
                  value: `${mapObj[nameInSheet]} (${tierLabel})`,
                });
              }
            }
          } else {
            embed.addFields({
              name: 'Tier Cutoffs',
              value: 'N/A',
            });
          }
        }

        // Include record and tutorial videos at the bottom, if applicable
        const records = track['Records'] && track['Records'].split('\n');
        const nonCNRecords = track['Records (Non-CN)'] && track['Records (Non-CN)'].split('\n') || [];
        const tutorials = track['Tutorials'] && track['Tutorials'].split('\n');

        if (records) {
          // Build combined records string with tags for CN vs global records
          const combinedRecordsArray = [...new Set([...records,...nonCNRecords])].sort();

          const finalRecordsString = combinedRecordsArray.map(obj => {
            // Check what server tag to add (global or CN)
            // (Add ᶜᴺ later once more confident that the sheet properly differenatiated all the tracks by server)
            const serverTag = nonCNRecords.includes(obj) ? "ᴳᴸᴼᴮᴬᴸ" : "";

            const splitObj = obj.split(' ');

            obj = `[${splitObj
                  .slice(0, -1)
                  .join(' ')}]${splitObj.slice(-1)} ${serverTag}`
            
            return obj;
          }).join('\n');

          embed.addFields({
            name: 'Records',
            value: finalRecordsString,
          });
        }

        if (tutorials) {
          embed.addFields({
            name: 'Tutorials',
            value: tutorials
              .map(obj => {
                let stringArray = obj.split(' ');

                return `[${stringArray
                  .slice(0, -1)
                  .join(' ')}]${stringArray.slice(-1)}`;
              })
              .join('\n'),
          });
        }

        try {
          // Add combination icon image; logic includes reverse map exceptions
          let finalImageUrl = `${imageUrl}/${track['File Id']}${
            track['File Id'].includes('_icon01') ? '' : '_icon'
          }.png`;

          embed.setImage(finalImageUrl);
        } catch (_err) {

        }

        // Once everything is built, return the embed
        // If a levenshteinEmbed was created, include that in the embeds array
        if (levenshteinEmbed) {
          return { embeds: [ levenshteinEmbed, embed ] }
        }
        else {
          return { embeds: [ embed ] }; 
        }
      }

      ////////////////////////
      // TRACK THEME SEARCH //
      ////////////////////////

      if (subCommandName === 'theme') {
        if (!searchString) {
          // If no parameters are provided, return general list

          // Get number of themes
          const uniqueThemes = Array.from(
            new Set([...tracksData.map(track => track['Theme'])])
          )
            .filter(theme => theme)
            .sort();

          embed.setTitle('Track Themes').setDescription(`
            There are a total of ${uniqueThemes.length} themes:

            ${uniqueThemes.join('\n')}
            `);
          return { embeds: [embed] };
        }

        // Otherwise, return tracks based on searched theme
        let themeTracks = tracksData.filter(
          obj =>
            obj['Theme'] &&
            obj['Theme'].trim().toLocaleLowerCase() === lowerCaseSearchString
        );

        if (!themeTracks || themeTracks.length == 0) {
          embed
            .setColor(embed_color_error)
            .setDescription(
              `No track theme found under the name "${searchString}". Were you perhaps trying to search for a track by name? Make sure to use the "/track name" command if that's the case!`
            );

          return { embeds: [embed] };
        }

        embed.setTitle(
          `Tracks - ${
            lowerCaseSearchString !== 'wkc'
              ? lowerCaseSearchString.charAt(0).toLocaleUpperCase() +
                lowerCaseSearchString.slice(1).toLocaleLowerCase()
              : lowerCaseSearchString.toLocaleUpperCase()
          } Theme`
        );

        let releasedTracks = themeTracks
          .filter(track => track['Release Date'])
          .map(track => track['Name'])
          .join('\n');
        let unreleasedTracks = themeTracks
          .filter(track => !track['Release Date'])
          .map(track => track['Name'])
          .join('\n');

        if (releasedTracks.length > 0) {
          embed.addFields({
            name: 'Released Tracks',
            value: releasedTracks,
          });
        }

        if (unreleasedTracks.length > 0) {
          embed.addFields({
            name: 'Unreleased in Global',
            value: unreleasedTracks,
          });
        }

        return { embeds: [ embed ] }; 
      }

      // If you have hit this code block, you probably ran a prefix command and didn't use one of the subcommands above...
      embed
        .setColor(embed_color_error)
        .setDescription(
          "You did not provide a valid subcommand! Use 'name' or 'theme'."
        );

      return { embeds: [embed] };
    } catch (err) {
      console.error(err);
    }
  },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { google } = require('googleapis');
const fetch = require('node-fetch');

const {
  convertToObjects,
  convertDiscordToGoogleSheetName,
  parseTrackSearchString,
  getEditDistance,
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

    // Link to Google Sheets, which gets track tiers and member times (if applicable)
    const tiersSpreadsheetInfo = {
      // // My spreadsheet
      // spreadsheetId: "1op1V759st7jQRF-heahsZMKy-985059hSRXrMI_OwC4",
      // MadCarroT's spreadsheet (change to this one once done)
      spreadsheetId: '1ibaWC_622LiBBYGOFCmKDqppDYQ4IBQiBQOMzZ3RvB4',
      ranges: ['Member Times!A4:CQ'],
    };

    // // Retrieve track data from JSON file from my website (this will be used for primary info)
    // const tracksData = await fetch(jsonUrl).then((response) =>
    //   response.json()
    // );

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // If the Spreadsheet data could not be retrieved, return appropriate description and exit command logic
      if (!global.tracks.length) {
        embed
          .setColor(embed_color_error)
          .setDescription(
            `An error has occured attempting to fetch the 'KartRider Rush+ Tracks' Spreadsheet.`
          );
        return { embeds: [embed] };
      }

      let tracksData = global.tracks;

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
            const levenshteinDistance = getEditDistance(
              lowerCaseSearchString,
              curr?.Name?.toLocaleLowerCase() || ''
            );

            if (
              levenshteinDistance <= LEVENSHTEIN_DISTANCE_MAX &&
              (!prev || levenshteinDistance < prev['levenshteinDistance'])
            ) {
              return {
                ...curr,
                levenshteinDistance,
              };
            } else {
              return prev;
            }
          }, null);

          // If a track was found, inform that the levenshtein algorithm was used in a separate embed
          if (track && track['Name']) {
            levenshteinEmbed = new MessageEmbed().setColor(embed_color_error)
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

        // Start building the embed fields
        /*
        Currently in a full track embed, there will be the following fields:

        0: Basic Info (Theme/Difficulty/License/Laps)
        1: Mode Info (Item/Relay)
        2: Release Date/Season
        3: Tier Cutoffs [from Google Sheet that's not mine]
        4: Your Recorded Record [from Google Sheet that's not mine]
        5: Records
        6: Tutorials

        Field 3 info can potentially be loaded into global variable, but field 4 will definitely have to be direct from Google Sheet and thus requires a lengthy API call; the goal here is to load the rest of the embed first so people don't have to wait an inordinate amount of time for the standard track info
        */

        // 0: Basic Info (Theme/Difficulty/License/Laps)
        const basicInfoField_0 = {
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
        };

        // 1: Mode Info (Item/Relay)
        const modeInfoField_1 = {
          name: 'Mode Info',
          value: `
**Item:** ${track['Item'] === 'TRUE' ? '☑' : '☐'}
**Relay:** ${track['Relay'] === 'TRUE' ? '☑' : '☐'}
`,
        };

        // 2: Release Date/Season
        let releaseDateField_2 = {};
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

        releaseDateField_2 = {
          name: 'Release Date/Season',
          value: releaseDateString,
        };

        // 3: Tier Cutoffs
        let tierCutoffsField_3 = null;
        let trackTiers = null;

        if (global.inverse_tier_cutoffs.length) {
          // Look to see if the map is in the tier cutoff object
          trackTiers = global.inverse_tier_cutoffs.find(
            obj => obj['Map'] === track['Name']
          );

          // Another minor check for some China server tracks (this spreadsheet will probably not be updated so it is temporary in a sense)
          if (!trackTiers) {
            if (global.inverse_china_tier_cutoffs.length) {
              // Look to see if the map is in the tier cutoff object
              trackTiers = global.inverse_china_tier_cutoffs.find(
                obj => obj['Map'] === track['Name']
              );
            }
          }

          if (trackTiers) {
            tierCutoffsField_3 = {
              name: 'Tier Cutoffs',
              value: `
**Pro:** ${trackTiers['Pro']}
**T1:** ${trackTiers['T1']}
**T2:** ${trackTiers['T2']}
**T3:** ${trackTiers['T3']}
**T4:** ${trackTiers['T4']}
`,
            };
          } else {
            tierCutoffsField_3 = {
              name: 'Tier Cutoffs',
              value: 'N/A',
            };
          }
        }

        // 4: Your Recorded Record
        let yourRecordedRecordField_4 = null;

        // The way the Inverse time sheet is designed is that you can only track your record for tracks that have a designated set of tiers
        if (trackTiers) {
          yourRecordedRecordField_4 = {
            name: 'Your Recorded Record',
            value: 'Loading...',
          };

          // Now check if the user has a recorded time for the track, but separate from the main embed logic so it can be loaded and edited in afterwards
          sheets.spreadsheets.values
            .batchGet(tiersSpreadsheetInfo)
            .then(result => {
              let timeSheetRange = result.data.valueRanges[0];

              // First option is if the command is sent via message
              // Second option is if the command is sent via slash command in a server
              // Third option is if the command is sent via slash command in a direct message
              const user =
                interaction?.author ||
                interaction?.user ||
                interaction?.member.user;

              // Additional section to get information concerning your own recorded time, if applicable
              let nameInSheet;

              nameInSheet = convertDiscordToGoogleSheetName(
                sheets,
                timeSheetRange.values[0].slice(2),
                undefined,
                user
              ).then(nameInSheet => {
                // If the user's name was found, look through the whole range to get the map time
                if (nameInSheet) {
                  let timesObj = convertToObjects(
                    timeSheetRange.values[0],
                    timeSheetRange.values.slice(1)
                  );

                  let mapObj = timesObj.find(
                    obj => obj['Map'] === track['Name']
                  );

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

                    // Replace the current record field with the loaded information
                    embed.spliceFields(
                      embed.fields.findIndex(
                        element => element.name === 'Your Recorded Record'
                      ),
                      1,
                      [
                        {
                          name: 'Your Recorded Record',
                          value: `${mapObj[nameInSheet]} (${tierLabel})`,
                        },
                      ]
                    );

                    return interaction.editReply({ embeds: [embed] });
                  }
                  else {
                    // If no map time was found for the member, remove the field (similar to how if the member was not found in the first place)
                    embed.spliceFields(
                      embed.fields.findIndex(
                        element => element.name === 'Your Recorded Record'
                      ),
                      1,
                      []
                    );

                    return interaction.editReply({ embeds: [embed] });
                  }
                }
              })
              // If the above code block hit an error, this is usually because someone who isn't in Inverse made a search, so remove the record field
              .catch((err) => {
                // Replace the current record field with the loaded information
                embed.spliceFields(
                  embed.fields.findIndex(
                    element => element.name === 'Your Recorded Record'
                  ),
                  1,
                  []
                );

                return interaction.editReply({ embeds: [embed] });
              });
            })
            .catch(err => {});
        }

        // 5: Records
        let recordsField_5 = null;

        const records =
          track['Records (CN Server)'] &&
          track['Records (CN Server)'].split('\n');
        const nonCNRecords =
          (track['Records (Global Server)'] &&
            track['Records (Global Server)'].split('\n')) ||
          [];

        if (records || nonCNRecords) {
          // Build combined records string with tags for CN vs global records
          const combinedRecordsArray = [
            ...new Set([...records, ...nonCNRecords]),
          ].sort();

          const finalRecordsString = combinedRecordsArray
            .map(obj => {
              // Check what server tag to add (global or CN)
              // (Add ᶜᴺ later once more confident that the sheet properly differenatiated all the tracks by server)
              const serverTag = nonCNRecords.includes(obj) ? 'ᴳᴸᴼᴮᴬᴸ' : '';

              const splitObj = obj.split(' ');

              obj = `[${splitObj.slice(0, -1).join(' ')}]${splitObj.slice(
                -1
              )} ${serverTag}`;

              return obj;
            })
            .join('\n');

          recordsField_5 = {
            name: 'Records',
            value: trim(finalRecordsString, 1024),
          };
        }

        // 6: Tutorials
        let tutorialsField_6 = null;

        const tutorials = track['Tutorials'] && track['Tutorials'].split('\n');

        if (tutorials) {
          tutorialsField_6 = {
            name: 'Tutorials',
            value: tutorials
              .map(obj => {
                let stringArray = obj.split(' ');

                return `[${stringArray
                  .slice(0, -1)
                  .join(' ')}]${stringArray.slice(-1)}`;
              })
              .join('\n'),
          };
        }

        // Build array of objects to determine if a field should be included in the embed based on criteria
        const fieldsCriteriaObj = [
          {
            field: basicInfoField_0,
            criteria: true,
          },
          {
            field: modeInfoField_1,
            criteria: track['Item'] != '' && track['Relay'] != '',
          },
          {
            field: releaseDateField_2,
            criteria: releaseDateString !== '',
          },
          {
            field: tierCutoffsField_3,
            criteria: tierCutoffsField_3 !== null,
          },
          {
            field: yourRecordedRecordField_4,
            criteria: yourRecordedRecordField_4 !== null,
          },
          {
            field: recordsField_5,
            criteria: recordsField_5 !== null,
          },
          {
            field: tutorialsField_6,
            criteria: tutorialsField_6 !== null,
          },
        ];

        fieldsCriteriaObj.forEach(element => {
          if (element.criteria) {
            embed.addFields(element.field);
          }
        });

        try {
          // Add combination icon image; logic includes reverse map exceptions
          let finalImageUrl = `${imageUrl}/${track['File Id']}${
            track['File Id'].includes('_icon01') ? '' : '_icon'
          }.png`;

          embed.setImage(finalImageUrl);
        } catch (_err) {}

        // Once everything is built, return the embed
        // If a levenshteinEmbed was created, include that in the embeds array
        if (levenshteinEmbed) {
          return { embeds: [levenshteinEmbed, embed] };
        } else {
          return { embeds: [embed] };
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

        return { embeds: [embed] };
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
      embed.setColor(embed_color_error).setDescription(err.toString());

      return { embeds: [embed] };
    }
  },
};

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { google } = require('googleapis');

const { prefix, embed_color, embed_color_error } = require('../../config.json');
const { convertToObjects } = require('../../utils/utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kart')
    .setDescription(
      'Provides kart details. Search by kart name, maxspeeds, or tierlist ("released" keyword optional).'
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('name')
        .setDescription(
          'Search kart by name, or provide nothing to get a random kart.'
        )
        .addStringOption(option =>
          option
            .setName('parameters')
            .setDescription('Name of kart.')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription(
          'Search for multiple karts based on name, season (search for a number), or description.'
        )
        .addStringOption(option =>
          option
            .setName('parameters')
            .setDescription('What to search for.')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('maxspeeds')
        .setDescription(
          'Shows a list of karts with the highest and lowest base max nitro speeds.'
        )
        .addBooleanOption(option =>
          option
            .setName('released')
            .setDescription(
              'Choose whether or not to only show globally released karts.'
            )
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tierlist')
        .setDescription('Search category by name.')
        .addBooleanOption(option =>
          option
            .setName('released')
            .setDescription(
              'Choose whether or not to only show globally released karts.'
            )
            .setRequired(true)
        )
    ),
  aliases: ['karts'],
  helpDescription: `Provides kart details. Search by one of the following subcommands:
  - **name**: Search kart by name, or provide nothing to get a random kart.
  - **search**: Search for multiple karts based on name, season (search for a number), or description. Returns a list of karts matching the criteria, including their name, kart type, and season of release.
  
  Example searches:
  **/kart search cotton**
  **/kart search golden gear**
  **/kart search 8**: Returns all karts with a "Season of Release" tag of "8" (may include karts that have not yet been, or will not be released).

  - **maxspeeds**: Shows a list of karts with the highest and lowest base max nitro speeds. Include the 'true' keyword to only show global released karts (ex. '/kart maxspeeds released').
  - **tierlist**: Shows a full list of item/hybrid karts with associated roles and tiers. Include the 'true' keyword to only show global released karts (ex. '${prefix}kart tierlist released'; currently does not work with slash commands).`,
  async execute(_client, interaction, args, embed, auth) {
    const imageUrl = 'https://krrplus.web.app/assets/Karts';
    const request = {
      spreadsheetId: '1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU',
      range: 'Karts Raw!A:AT',
    };

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let obj = convertToObjects(rows[0], rows.slice(1));

        // Don't include karts that don't have a name
        obj = obj.filter(kart => kart['Name']);

        // Get subcommand
        let subCommandName = interaction?.options?.getSubcommand() || args[0];

        // Get other arguments
        let searchString =
          interaction?.options?.getString('parameters') ||
          args.slice(1).join(' ');
        let lowerCaseSearchString = searchString?.toLocaleLowerCase();

        // Released parameter for maxspeeds and tierlist subcommands
        let releasedBoolean =
          interaction?.options?.getBoolean('released') || args.slice(-1)[0];

        // Retrieve object of kart matching given arguments
        let kart;

        ///////////////////////
        // KART NAME COMMAND //
        ///////////////////////

        if (subCommandName === 'name') {
          if (lowerCaseSearchString) {
            kart =
              obj.find(
                kart =>
                  kart['Name'].toLocaleLowerCase() === lowerCaseSearchString ||
                  kart['Name (CN)'] === lowerCaseSearchString ||
                  kart['Name (KR)'] === lowerCaseSearchString
              ) ||
              obj.find(
                kart =>
                  (kart['Name'] &&
                    kart['Name']
                      .toLocaleLowerCase()
                      .includes(lowerCaseSearchString)) ||
                  (kart['Name (CN)'] &&
                    kart['Name (CN)'].includes(lowerCaseSearchString)) ||
                  (kart['Name (KR)'] &&
                    kart['Name (KR)'].includes(lowerCaseSearchString))
              );
          } else {
            // Retrieve a random kart
            kart = obj[Math.floor(Math.random() * obj.length)];
          }

          if (kart) {
            embed
              .setThumbnail(`${imageUrl}/${kart['File Id']}_icon.png`)
              .setTitle(kart['Name']);

            let descriptionString = `\n`;

            // Build CH/KR string, if applicable
            if (kart['Name (CN)']) {
              // Include showcase video if applicable
              if (kart['Showcase Video (吴钟海)']) {
                descriptionString += `**CN:** [${kart['Name (CN)']}](${kart['Showcase Video (吴钟海)']})\n`;
              } else {
                descriptionString += `**CN:** ${kart['Name (CN)']}\n`;
              }
            }

            if (kart['Name (KR)']) {
              descriptionString += `**KR:** ${kart['Name (KR)']}\n`;
            }

            descriptionString += `${kart['Rarity'].split(' ')[1].trim()} ${
              kart['Kart Type']
            } Kart`;

            embed.setDescription(descriptionString);

            // Rough role of item karts in a race (unofficial; categorized by myself and potentially with suggestions of others)
            if (kart['Role (Item Karts Only)']) {
              embed.addFields({
                name: `Role ${
                  kart['Released'] === 'FALSE' ? '(Theoretical)' : ''
                }`,
                value: kart['Role (Item Karts Only)'],
              });
            }

            if (kart['Raw Total (Pre-Season 7)']) {
              embed
                .addFields({
                  name: 'Stats (Pre-Season 7)',
                  value: `
Drift:
Acceleration:
Curve:
Accel. Duration:
Nitro Charge Speed:
**Total:**
          `,
                  inline: true,
                })
                .addFields({
                  name: '---',
                  value: `
${kart['Drift (Pre-Season 7)']}
${kart['Acceleration (Pre-Season 7)']}
${kart['Curve (Pre-Season 7)']}
${kart['Accel. Duration (Pre-Season 7)']}
${kart['Nitro Charge Speed (Pre-Season 7)']}
**${kart['Raw Total (Pre-Season 7)']}**
          `,
                  inline: true,
                });
            }

            // Provide additional stat polygon info (which was acquired from Python script)
            if (kart['Accelerate']) {
              const statsArray = [
                "Accelerate",
                "Drag",
                "Steering",
                "Nitro Charge",
                "Upgraded Power",
                "Curve Drift",
                "Agility",
                "Accel. Duration",
                "Total Stats",
                "Polygon Area"
              ];

              // Filter out only karts with polygon stats
              const kartsWithPolygonStats = obj.filter(kart => kart['Accelerate']).map(kart => ({
                "Name": kart["Name"],
                "Accelerate": kart['Accelerate'],
                "Drag": kart['Drag'],
                "Steering": kart['Steering'],
                "Nitro Charge": kart['Nitro Charge'],
                "Upgraded Power": kart['Upgraded Power'],
                "Curve Drift": kart['Curve Drift'],
                "Agility": kart['Agility'],
                "Accel. Duration": kart['Accel. Duration'],
                "Total Stats": kart['Total Stats'],
                "Polygon Area": kart['Polygon Area']
                }));

              // Initialize stats object to hold sorted arrays of all the individiual stats (from highest to lowest)
              const statsObj = {}

              statsArray.forEach(stat => {
                statsObj[stat] = kartsWithPolygonStats.map(innerStat => parseFloat(innerStat[stat].replace(",", ""))).sort((a, b) => b - a);
              });

              // Get the name of the best kart in terms of overall stats
              const kartWithGreatestPolygonArea = kartsWithPolygonStats.sort((a, b) => b["Polygon Area"] - a["Polygon Area"])[0]["Name"];

              // Get the rankings of the kart in question for each individual stat relative to other karts
              const ranksArray = Object.entries(statsObj).map(stat => {
                // Convert the kart's stat number into proper number format
                let parsedKartStat = parseFloat(kart[stat[0]].replace(",", ""));
                // let numberOfSameStat = stat[1].filter(x => x == parsedKartStat).length;

                return !["Total Stats", "Polygon Area"].includes(stat[0]) ? `#${stat[1].indexOf(parsedKartStat) + 1}` : `**#${stat[1].indexOf(parsedKartStat) + 1}**`
              });

              embed.addFields({
                name: 'Stats (Polygon Analysis)',
                value: `Based on pixel measurement approximations. There are currently ${kartsWithPolygonStats.length} karts with measurements, with ${kartWithGreatestPolygonArea} being the top reference kart.`
              })

              embed
                .addFields({
                  name: 'Polygon Stat',
                  value: statsArray.map(stat => !["Total Stats", "Polygon Area"].includes(stat) ? stat : `**${stat}**`).join('\n'),
                  inline: true,
                })
                .addFields({
                  name: `Rough Value`,
                  value: statsArray.map(stat => !["Total Stats", "Polygon Area"].includes(stat) ? kart[stat] : `**${kart[stat]}**`).join('\n'),
                  inline: true,
                })
                .addFields({
                  name: `Rank`,
                  value: ranksArray.join('\n'),
                  inline: true,
                });
            }

            if (kart['Max Speed (km/h) (Nitro)']) {
              // Get an array of all karts that have a noted base max speed with nitro
              const kartSpeeds = obj
                .map(kart => kart['Max Speed (km/h) (Nitro)'])
                .filter(speed => speed)
                .sort()
                .reverse();

              // const uniqueSpeeds = Array.from(new Set(kartSpeeds));

              let valueString = `${kart['Max Speed (km/h) (Nitro)']} km/h
(#${kartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1} out of ${
                kartSpeeds.length
              } karts with recorded speeds)`;

              // Let's also get this statistic for released karts only
              if (kart['Released'] === 'TRUE') {
                const releasedKartSpeeds = obj
                  .filter(
                    kart =>
                      kart['Max Speed (km/h) (Nitro)'] &&
                      kart['Released'] === 'TRUE'
                  )
                  .map(kart => kart['Max Speed (km/h) (Nitro)'])
                  .sort()
                  .reverse();

                valueString += `
(#${releasedKartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1} out of ${
                  releasedKartSpeeds.length
                } global server karts with recorded speeds)`;
              }

              embed.addFields({
                name: 'Base Max Nitro Speed',
                value: valueString,
              });
            }

            if (kart['Special Effects']) {
              embed.addFields({
                name: 'Special Effects',
                value: `
                ${kart['Special Effects']}
                `,
              });
            }

            if (kart['Season of Release']) {
              embed.addFields({
                name: 'Season of Release',
                value: `
          S${kart['Season of Release']}
          `,
              });
            }

            if (kart['Permanent Acquire Method']) {
              embed.addFields({
                name: 'Acquire Method',
                value: `
          ${kart['Permanent Acquire Method']}
          `,
              });
            }

            if (kart['Released']) {
              embed.addFields({
                name: 'Released in Global server?',
                value: `
          ${kart['Released'].toLocaleLowerCase()}`,
              });
            }
          } else {
            embed
            .setColor(embed_color_error)
            .setDescription(
              `No kart found under the name "${searchString}".`
            );
          }

          return { embeds: [embed] };
        }

        /////////////////////////
        // KART SEARCH COMMAND //
        /////////////////////////

        if (subCommandName === 'search') {
          const rows = (await sheets.spreadsheets.values.get(request)).data
            .values;

          if (rows.length) {
            embed.setTitle('Kart Search');

            // Retrieve object of karts matching given arguments
            let kartResults;
            let searchType = '';

            if (searchString) {
              kartResults = obj.filter(kart => {
                if (parseInt(lowerCaseSearchString)) {
                  searchType = 'season';

                  return kart['Season of Release'] === lowerCaseSearchString;
                } else {
                  searchType = 'name/acquire method';

                  return (
                    kart['Name']
                      .toLocaleLowerCase()
                      .includes(lowerCaseSearchString) ||
                    kart['Permanent Acquire Method']
                      .toLocaleLowerCase()
                      .includes(lowerCaseSearchString)
                  );
                }
              });

              embed.setDescription(
                `${kartResults.length} results found for '${searchString}' (searching by ${searchType}).`
              );

              // Exit out early if no results were found
              if (kartResults.length === 0) {
                return { embeds: [embed] };
              }

              // Keeping special "⠀" character here for reference

              embed.addFields({
                name: 'Name',
                value: trim(
                  kartResults.map(kart => kart['Name']).join('\n'),
                  1024
                ),
                inline: true,
              });

              embed.addFields({
                name: 'Kart Type',
                value: trim(
                  kartResults.map(kart => kart['Kart Type']).join('\n'),
                  1024
                ),
                inline: true,
              });

              if (searchType !== 'season') {
                embed.addFields({
                  name: 'Season of Release',
                  value: trim(
                    kartResults
                      .map(kart => kart['Season of Release'])
                      .join('\n'),
                    1024
                  ),
                  inline: true,
                });
              }
            } else {
              embed.setDescription(
                `There are currently ${obj.length} karts in the spreadsheet.`
              );
            }
          } else {
            embed
              .setColor(embed_color_error)
              .setDescription(
                'An error occured retrieving the karts information.'
              );
          }

          return { embeds: [ embed ] };
        }

        ////////////////////////////
        // KART MAXSPEEDS COMMAND //
        ////////////////////////////

        if (subCommandName === 'maxspeeds') {
          const NUMBER_OF_KARTS = 15;

          let kartsWithSpeeds = obj
            .filter(kart => kart['Max Speed (km/h) (Nitro)'])
            .sort(
              (a, b) =>
                b['Max Speed (km/h) (Nitro)'] - a['Max Speed (km/h) (Nitro)'] ||
                a['Name'].localeCompare(b['Name'])
            )
            .map(kart => {
              return {
                Name: kart['Name'],
                'Max Speed (km/h) (Nitro)': kart['Max Speed (km/h) (Nitro)'],
                Released: kart['Released'],
              };
            });

          let kartSpeeds = obj
            .map(kart => kart['Max Speed (km/h) (Nitro)'])
            .filter(speed => speed)
            .sort()
            .reverse();

          if (releasedBoolean) {
            kartsWithSpeeds = kartsWithSpeeds.filter(
              kart => kart['Released'] === 'TRUE'
            );

            kartSpeeds = obj
              .filter(
                kart =>
                  kart['Max Speed (km/h) (Nitro)'] &&
                  kart['Released'] === 'TRUE'
              )
              .map(kart => kart['Max Speed (km/h) (Nitro)'])
              .sort()
              .reverse();

            embed.setTitle(
              'Top/Bottom Base Max Nitro Speed Comparisons (Global Released Karts'
            );
          } else {
            embed.setTitle('Top/Bottom Base Max Nitro Speed Comparisons');
          }

          embed
            .setDescription(
              `(Showing results from ${kartsWithSpeeds.length} karts with recorded values)`
            )
            .addFields({
              name: `Top ${NUMBER_OF_KARTS} Karts`,
              value: `${kartsWithSpeeds
                .slice(0, NUMBER_OF_KARTS)
                .map(
                  kart =>
                    `${
                      kartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1
                    }. ${kart['Name']}`
                )
                .join('\n')}`,
              inline: true,
            })
            .addFields({
              name: `Speed (km/h)`,
              value: `${kartsWithSpeeds
                .slice(0, NUMBER_OF_KARTS)
                .map(kart => kart['Max Speed (km/h) (Nitro)'])
                .join('\n')}`,
              inline: true,
            })
            .addField('\u200b', '\u200b')
            .addFields({
              name: `Bottom ${NUMBER_OF_KARTS} Karts`,
              value: `${kartsWithSpeeds
                .slice(-NUMBER_OF_KARTS)
                .reverse()
                .map(
                  kart =>
                    `${
                      kartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1
                    }. ${kart['Name']}`
                )
                .join('\n')}`,
              inline: true,
            })
            .addFields({
              name: `Speed (km/h)`,
              value: `${kartsWithSpeeds
                .slice(-NUMBER_OF_KARTS)
                .reverse()
                .map(kart => kart['Max Speed (km/h) (Nitro)'])
                .join('\n')}`,
              inline: true,
            });

          return { embeds: [embed] };
        }

        ///////////////////////////
        // KART TIERLIST COMMAND //
        ///////////////////////////

        if (subCommandName === 'tierlist') {
          const roleSortKeys = {
            Runner: 1,
            'Front Controller': 2,
            'Sub Runner': 3,
            'Mid Controller': 4,
            Support: 5,
            Flex: 6,
          };

          let validKarts = obj
            .filter(kart => kart['Role (Item Karts Only)'])
            .sort(
              (a, b) =>
                roleSortKeys[a['Role (Item Karts Only)'].split('-')[0].trim()] -
                  roleSortKeys[
                    b['Role (Item Karts Only)'].split('-')[0].trim()
                  ] ||
                parseFloat(
                  a['Role (Item Karts Only)']
                    .split('-')[1]
                    .trim()
                    .split(' ')[1]
                    .trim()
                ) -
                  parseFloat(
                    b['Role (Item Karts Only)']
                      .split('-')[1]
                      .trim()
                      .split(' ')[1]
                      .trim()
                  ) ||
                a['Name'].localeCompare(b['Name'])
            );

          let releasedValidKarts = validKarts.filter(
            kart => kart['Released'] === 'TRUE'
          );
          let unreleasedValidKarts = validKarts.filter(
            kart => kart['Released'] !== 'TRUE'
          );

          let masterTierObj = {};

          releasedValidKarts.forEach(kart => {
            let role = kart['Role (Item Karts Only)'].split('-')[0].trim();
            let tier = kart['Role (Item Karts Only)'].split('-')[1].trim();

            if (!masterTierObj[role]) {
              masterTierObj[role] = {};
            }

            if (!masterTierObj[role][tier]) {
              masterTierObj[role][tier] = [];
            }

            masterTierObj[role][tier].push(kart['Name']);
          });

          // Create the embed(s) with all the information
          // Need to spilt this into three messages due to size
          let embed1 = new MessageEmbed();
          let embed2 = new MessageEmbed();
          let embed3 = new MessageEmbed();

          // Only show released karts if secondary keyword is provided
          if (searchString.split(' ')[1] !== 'released') {
            // Add ----- under every field to separate released from unreleased karts
            Object.keys(masterTierObj).forEach(role =>
              Object.keys(masterTierObj[role]).forEach(tier =>
                masterTierObj[role][tier].push('-----')
              )
            );

            unreleasedValidKarts.forEach(kart => {
              let role = kart['Role (Item Karts Only)'].split('-')[0].trim();
              let tier = kart['Role (Item Karts Only)'].split('-')[1].trim();

              if (!masterTierObj[role]) {
                masterTierObj[role] = {};
              }

              if (!masterTierObj[role][tier]) {
                masterTierObj[role][tier] = [];
              }

              masterTierObj[role][tier].push(`*${kart['Name']}*`);
            });

            embed2.setDescription('All Karts');
          } else {
            embed2.setDescription(' Global Released Karts');
          }

          embed1.setColor(embed_color);
          embed2.setColor(embed_color);
          embed3.setColor(embed_color);

          embed1.setTitle('Item Kart Tier List (1/3)');
          embed2.setTitle('Item Kart Tier List (2/3)');
          embed3.setTitle('Item Kart Tier List (3/3)');

          // Quick link to Google Sheets for easier viewing experience
          embed1.setDescription(
            'For a better viewing experience, you can also look at this in the [Google Sheet > Item Karts Tier List tab](https://docs.google.com/spreadsheets/d/e/2PACX-1vSgBqUrUXeCtOtePJ9BxjAwrq2KKhO3M5JqvMYJx93lWTPK_9Q4GR82C9yZx1ThnmXttVWKiWQvfNy3/pubhtml?gid=1171344789&#).'
          );

          // Add information on what roles and tiers are in the first embed
          embed1
            .addFields({
              name: 'Brief Explanation of Roles and Tiers',
              value: '**Roles**',
            })
            .addFields({
              name: 'Runner',
              value:
                "Karts that want to be in the front, and have abilities that reinforce that position. This usually means an ability that grants high to full defense against one or more 'forward-attacking' offensive items, or enhanced shield generation. Usually have little to no offensive abilities. More effective with players that have good kart handling/are good at speed mode.",
            })
            .addFields({
              name: 'Front Controller',
              value:
                'Karts that want to be near the front, have offensive abilities to protect runners, and have either a minor defensive or speed boosting ability to complement the position.',
            })
            .addFields({
              name: 'Sub Runner',
              value:
                "Karts that want to be near or in the front, and have either a minor defensive or speed boosting ability to complement it. Usually have little to no offensive abilities, and are not as effective as Runners in maintaining a lead, but have high 'clutch' potential.",
            })
            .addFields({
              name: 'Mid Controller',
              value:
                'Karts that want to be near the middle or back, and have area of effect offensive abilities to greatly lock down opponents. Typically designated to karts that modify Water Bombs.',
            })
            .addFields({
              name: 'Support',
              value:
                'Karts that want to be near the middle or back, and have offensive abilities. Not as effective as Front Controllers due to their lack of defense or speed boosting.',
            })
            .addFields({
              name: 'Flex',
              value:
                'Karts that have a range of abilities that let it function well in any position.',
            })
            .addField('\u200b', '\u200b')
            .addFields({
              name: 'Tiers',
              value:
                "Goes from 0 to 5, with 0 being the 'one best kart' for that given role, and 1 to 5 being better to worse.",
            });

          let targetedEmbed = embed2;

          Object.keys(masterTierObj).forEach(role => {
            if (['Runner', 'Front Controller', 'Sub Runner'].includes(role)) {
              targetedEmbed = embed2;
            } else {
              targetedEmbed = embed3;
            }

            targetedEmbed.addField(role, '\u200b');

            Object.keys(masterTierObj[role]).forEach(tier => {
              targetedEmbed.addFields({
                name: tier,
                value: masterTierObj[role][tier].join('\n'),
                inline: true,
              });
            });

            if (!['Sub Runner', 'Flex'].includes(role)) {
              targetedEmbed.addField('\u200b', '\u200b');
            }
          });

          return { embeds: [embed1, embed2, embed3] };
        }

        // If you have hit this code block, you probably ran a prefix command and didn't use one of the subcommands above...
        embed
          .setColor(embed_color_error)
          .setDescription(
            "You did not provide a valid subcommand! Use 'name', 'search', 'maxspeeds', or 'tierlist'."
          );

        return { embeds: [embed] };
      }
    } catch (err) {
      console.error(err);
    }
  },
};

const { google } = require('googleapis');

const { convertToObjects } = require('../../utils/utils');

const Discord = require('discord.js');
const { prefix, embed_color } = require('../../config.json');

module.exports = {
  name: 'kart',
  description:
    'Provides kart details. Search by arguments or provide nothing to get a random kart.',
  helpDescription: `Provides kart details. Search by arguments or provide nothing to get a random kart.
  
  You can also search by the following:
  - **maxspeeds**: Shows a list of karts with the highest and lowest base max nitro speeds. Include the 'released' keyword to only show global released karts (ex. '/kart maxspeeds released').
  - **tierlist**: Shows a full list of item/hybrid karts with associated roles and tiers. Include the 'released' keyword to only show global released karts (ex. '${prefix}kart tierlist released'; currently does not work with slash commands).`,
  options: [
    {
      name: 'parameters',
      description: 'Name of kart.',
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    const imageUrl = 'https://krrplus.web.app/assets/Karts';
    const request = {
      spreadsheetId: '1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU',
      range: 'Karts Raw!A:AF',
    };

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        let obj = convertToObjects(rows[0], rows.slice(1));

        // Don't include karts that don't have a name
        obj = obj.filter(kart => kart['Name']);

        let searchString = args.join(' ').toLocaleLowerCase();
        // Retrieve object of kart matching given arguments
        let kart;

        if (args.length > 0) {
          // Separate search string for 'maxspeeds'
          if (searchString.split(' ')[0].toLocaleLowerCase() === 'maxspeeds') {
            const NUMBER_OF_KARTS = 15;

            let kartsWithSpeeds = obj
              .filter(kart => kart['Max Speed (km/h) (Nitro)'])
              .sort(
                (a, b) =>
                  b['Max Speed (km/h) (Nitro)'] -
                    a['Max Speed (km/h) (Nitro)'] ||
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

            if (searchString.split(' ')[1] === 'released') {
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

            console.log(kartSpeeds)

            embed
              .setDescription(
                `(Showing results from ${kartsWithSpeeds.length} karts with recorded values)`
              )
              .addFields({
                name: `Top ${NUMBER_OF_KARTS} Karts`,
                value: `${kartsWithSpeeds
                  .slice(0, NUMBER_OF_KARTS)
                  .map((kart) => `${kartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1}. ${kart['Name']}`)
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
                    (kart) =>
                      `${kartSpeeds.indexOf(kart['Max Speed (km/h) (Nitro)']) + 1}. ${kart['Name']}`
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

            return embed;
          }

          // Separate command for tier list
          if (searchString.split(' ')[0].toLocaleLowerCase() === 'tierlist') {
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
                  roleSortKeys[
                    a['Role (Item Karts Only)'].split('-')[0].trim()
                  ] -
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
            // Need to spilt this into two message due to size
            let embed1 = new Discord.MessageEmbed();
            let embed2 = new Discord.MessageEmbed();

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

              embed1.setDescription('All Karts');
            } else {
              embed1.setDescription(' Global Released Karts');
            }

            embed1.setColor(embed_color);
            embed2.setColor(embed_color);

            embed1.setTitle('Item Kart Tier List (1/2)');
            embed2.setTitle('Item Kart Tier List (2/2)');

            let targetedEmbed = embed1;

            Object.keys(masterTierObj).forEach(role => {
              if (['Runner', 'Front Controller', 'Sub Runner'].includes(role)) {
                targetedEmbed = embed1;
              } else {
                targetedEmbed = embed2;
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

            return [embed1, embed2];
          }

          kart =
            obj.find(
              kart => kart['Name'].toLocaleLowerCase() === searchString
            ) ||
            obj.find(kart =>
              kart['Name'].toLocaleLowerCase().includes(searchString)
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

          if (kart['Raw Total']) {
            embed
              .addFields({
                name: 'Stats',
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
${kart['Drift']}
${kart['Acceleration']}
${kart['Curve']}
${kart['Accel. Duration']}
${kart['Nitro Charge Speed']}
**${kart['Raw Total']}**
          `,
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

          if (kart['Special Effects (Item Karts Only)']) {
            embed.addFields({
              name: 'Special Effects',
              value: `
                ${kart['Special Effects (Item Karts Only)']}
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
          embed.setDescription(
            `No kart found under the name "${args.join(' ')}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

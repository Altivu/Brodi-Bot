const { google } = require('googleapis');

const { convertToObjects, trim } = require('../../utils/utils');

module.exports = {
  name: 'item',
  description:
    'Provides item (from Item Mode) details. Search by arguments or provide nothing to get a random item.',
  helpDescription: `Provides item (from Item Mode) details. Search by arguments or provide nothing to get a random item.
  
  You can also search by the following:
  - **category/categories**: Shows a list of item categories, as roughly by myself (subject to discussion) (ex. '/item category'). Include an additional category keyword to show more details (ex. '/item category missile').`,
  options: [
    {
      name: 'parameters',
      description:
        "Name of item. You can also type 'category' to get a category list, or further filter by category.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    // List of items that all karts can get in an Item Race
    const BASE_ITEMS = [
      'Nitro',
      'Shield',
      'UFO',
      'Water Bomb',
      'Banana Peel',
      'Cloud',
      'Magnet',
      'Water Fly',
      'Missile',
      'Super Missile',
      'Angel Wings',
      'Electromagnet',
      'Hex',
      'Lightning',
      'Barricade',
      'Timed Water Bomb',
      'Teleporter',
      'Super Fly',
    ];

    // Due to overlap in item names, some items are prefixed with 'Normal' in the special effects section, so note that here
    const NORMAL_ITEMS = [
      'Banana Peel',
      'Cloud',
      'Ice Bomb',
      'Magnet',
      'Mine',
      'Missile',
      'Nitro',
      'Shield',
      'Siren',
      'UFO',
      'Water Bomb',
      'Water Fly',
    ];

    const imageUrl = 'https://krrplus.web.app/assets/Item%20Mode%20Icons';

    // Cross-reference multiple spreadsheets to combine information on item interactions
    const request = {
      spreadsheetId: '1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU',
      ranges: [
        'Item Mode Items Raw!A:E',
        'Karts!A:P',
        'Pets!A:J',
        'Badges Raw!A:F',
      ],
    };

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const rows = (await sheets.spreadsheets.values.batchGet(request)).data
        .valueRanges;

      if (rows.length) {
        let itemsObj = convertToObjects(
          rows[0].values[0],
          rows[0].values.slice(1)
        );

        // Remove any items that don't have a name
        itemsObj = itemsObj.filter(item => item['Name']);

        let searchString = args.join(' ').toLocaleLowerCase();
        // Retrieve object of item matching given arguments
        let item;

        if (args.length > 0) {
          // Separate search string for 'category'
          if (
            ['category', 'categories'].includes(
              searchString.split(' ')[0].toLocaleLowerCase()
            )
          ) {
            // Get number of categories
            const uniqueCategories = [];

            itemsObj.forEach(item => {
              let categoryArr = item['Category'].split('/');

              categoryArr.forEach(category => {
                if (!uniqueCategories.includes(category)) {
                  uniqueCategories.push(category);
                }
              });
            });

            uniqueCategories.sort();

            // General category information
            if (!searchString.split(' ')[1]) {
              embed.setTitle('Item Categories').setDescription(`
            There are a total of ${
              uniqueCategories.length
            } item categories (roughly speaking):

            ${uniqueCategories.join('\n')}
            `);
            } else {
              // Search for specific category
              let searchedCategory = searchString.split(' ')[1];

              let foundCategory =
                uniqueCategories.find(
                  category =>
                    searchedCategory.toLocaleLowerCase() ===
                    category.toLocaleLowerCase()
                ) ||
                uniqueCategories.find(category =>
                  category
                    .toLocaleLowerCase()
                    .includes(searchedCategory.toLocaleLowerCase())
                );

              if (!foundCategory) {
                embed.setDescription(
                  `No category found under the name '${searchedCategory}'.\n\nCheck '/item categories' if you are unsure of the noted categories.`
                );
              } else {
                embed.setTitle(`Items - ${foundCategory} Category`);

                // Get all items that match the requested category
                let matchedItems = itemsObj
                  .filter(item =>
                    item['Category'].split('/').includes(foundCategory)
                  )
                  .map(item => item['Name']);

                // Split objects into base items and special items
                let baseItems = matchedItems
                  .filter(item => BASE_ITEMS.includes(item))
                  .sort();
                let enhancedItems = matchedItems
                  .filter(item => !BASE_ITEMS.includes(item))
                  .sort();

                // Build the final description string
                if (baseItems.length > 0) {
                  embed.addFields({
                    name: 'Base Items',
                    value: baseItems.join('\n'),
                  });
                }

                if (enhancedItems.length > 0) {
                  let kartsObj = convertToObjects(
                    rows[1].values[0],
                    rows[1].values.slice(1)
                  );

                  // Parse the enhanced items and look for relevant karts that have that item in its abilities
                  enhancedItems = enhancedItems.map(itemName => {
                    // Filter first by karts that simply have the item name in its abilities
                    let firstFilteredKartsObj = kartsObj.filter(kart =>
                      kart['Special Effects (Item Karts Only)'].includes(
                        itemName
                      )
                    );

                    if (NORMAL_ITEMS.includes(itemName)) {
                      itemName = `Normal ${itemName}`;
                    }

                    // Then do more concise filtering by specifically looking for karts that have that item as an offensive/proactive ability
                    let secondFilteredKartsObj = firstFilteredKartsObj
                      .filter(kart => {
                        let specialEffectsArray = kart[
                          'Special Effects (Item Karts Only)'
                        ]
                          .split('\n')
                          .filter(
                            effect =>
                              ((effect
                                .toLocaleLowerCase()
                                .includes('replace') &&
                                effect.includes(`with ${itemName}`)) ||
                                effect.includes(`chance to get ${itemName}`) ||
                                effect.includes(
                                  `chance to obtain ${itemName}`
                                ) || (effect.includes(
                                  `chance to release`
                                ) && effect.includes(itemName)) ||
                                (effect.includes(
                                  `trigger`
                                ) && effect.includes(itemName)))
                          );

                        return specialEffectsArray.length > 0;
                      })
                      .map(kart => kart['Name'])
                      .sort();

                    return `${itemName}${
                      secondFilteredKartsObj.length > 0
                        ? ' ----- ' + secondFilteredKartsObj.join(', ')
                        : ''
                    }`;
                  });

                  if (enhancedItems.length > 0) {
                    embed.addFields({
                      name: 'Enhanced Items',
                      value: enhancedItems.join('\n'),
                    });
                  }
                }
              }
            }

            return embed;
          }

          item =
            itemsObj.find(
              row => row['Name'].toLocaleLowerCase() === searchString
            ) ||
            itemsObj.find(row =>
              row['Name'].toLocaleLowerCase().includes(searchString)
            );
        } else {
          item = itemsObj[Math.floor(Math.random() * itemsObj.length)];
        }

        if (item) {
          embed
            .setThumbnail(`${imageUrl}/${item['File Id']}.png`)
            .setTitle(item['Name']);

          if (item['Description']) {
            embed.setDescription(item['Description']);
          }

          let itemSearchName = `${
            NORMAL_ITEMS.includes(item['Name']) ? 'Normal ' : ''
          }${item['Name']}`;

          // Start with karts
          let kartsObj = convertToObjects(
            rows[1].values[0],
            rows[1].values.slice(1)
          );

          kartsObj = kartsObj.filter(kart => kart['Special Effects (Item Karts Only)'] && 
            kart['Special Effects (Item Karts Only)'].includes(itemSearchName)
          );

          // Attempt to sort between offensive and defensive interactions (will definitely not be perfect as it will differentiate via keywords)
          let finalKartsObjOffensive = [];
          let finalKartsObjDefensive = [];

          kartsObj.forEach(kart => {
            let specialEffectsArray = kart[
              'Special Effects (Item Karts Only)'
            ].split('\n');

            // If the searched item is a Water Bomb/Water Fly and the effect is to enable quick boost, don't bother including it because it's too common on karts
            specialEffectsArray = specialEffectsArray.filter(
              effect =>
                effect.includes(itemSearchName) &&
                (!['Normal Water Bomb', 'Water Fly'].includes(itemSearchName) ||
                  !effect.includes('Enable Quick Boost after escaping'))
            );

            specialEffectsArray.forEach(effect => {
              if (
                effect.toLocaleLowerCase().includes('hitting') ||
                effect.toLocaleLowerCase().includes('replace') ||
                effect.toLocaleLowerCase().includes('land') ||
                effect.toLocaleLowerCase().includes('using')
              ) {
                finalKartsObjOffensive.push(`${kart['Name']} - ${effect}`);
              } else {
                finalKartsObjDefensive.push(`${kart['Name']} - ${effect}`);
              }
            });
          });

          if (finalKartsObjOffensive.length > 0) {
            embed.addFields({
              name: 'Kart Interactions (Offensive)',
              value: `
          ${trim(finalKartsObjOffensive.join('\n'), 1024)}
          `,
            });
          }

          if (finalKartsObjDefensive.length > 0) {
            embed.addFields({
              name: 'Kart Interactions (Defensive)',
              value: `
          ${trim(finalKartsObjDefensive.join('\n'), 1024)}
          `,
            });
          }

          // Special exception for Flame Missiles, as abilities that interact with it as listed as "Fire"

          if (itemSearchName === "Flame Missile") {
            itemSearchName = "Fire";
          }

          // Now look at pets
          let petsObj = convertToObjects(
            rows[2].values[0],
            rows[2].values.slice(1)
          );

          petsObj = petsObj.filter(
            pet =>
              pet['Special Effects'] &&
              pet['Special Effects'].includes(itemSearchName)
          );

          let finalPetsObj = [];

          petsObj.forEach(pet => {
            let specialEffectsArray = pet['Special Effects'].split('\n');

            specialEffectsArray = specialEffectsArray.filter(effect =>
              effect.includes(itemSearchName)
            );

            specialEffectsArray.forEach(effect => {
              finalPetsObj.push(`${pet['Name']} - ${effect}`);
            });
          });

          if (finalPetsObj.length > 0) {
            embed.addFields({
              name: 'Pet Interactions',
              value: `
          ${trim(finalPetsObj.join('\n'), 1024)}
          `,
            });
          }

          // Finally, look at badges
          let badgesObj = convertToObjects(
            rows[3].values[0],
            rows[3].values.slice(1)
          );

          badgesObj = badgesObj.filter(badge =>
            badge['Special Effects'].includes(itemSearchName)
          );

          let finalBadgesObj = [];

          badgesObj.forEach(badge => {
            let specialEffectsArray = badge['Special Effects'].split('~');

            specialEffectsArray = specialEffectsArray.filter(effect =>
              effect.includes(itemSearchName)
            );

            specialEffectsArray.forEach(effect => {
              finalBadgesObj.push(`${badge['Name']} - ${effect}`);
            });
          });

          if (finalBadgesObj.length > 0) {
            embed.addFields({
              name: 'Badge Interactions',
              value: `
          ${trim(finalBadgesObj.join('\n'), 1024)}
          `,
            });
          }
        } else {
          embed.setDescription(
            `No item found under the name "${args.join(' ')}".`
          );
        }

        return embed;
      }
    } catch (err) {
      console.error(err);
    }
  },
};

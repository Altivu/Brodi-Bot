const { google } = require("googleapis");

const { convertToObjects, trim } = require("../../utils/utils");

module.exports = {
  name: "kartsearch",
  aliases: ["kart_search, searchkart, search_kart"],
  description: "Search for multiple karts based on name, season (search for a number), or description.",
  options: [
    {
      name: "parameters",
      description: "What to search for.",
      required: false,
      type: 3, // string
    },
  ],
  async result(_client, message, args, embed, auth) {
    const request = {
      spreadsheetId: "1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU",
      range: 'Karts Raw!A:AF'
    };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(request)).data.values;

      if (rows.length) {
        embed.setTitle("Kart Search");

        let kartsObj = convertToObjects(rows[0], rows.slice(1));

        let searchString = args.join(" ").toLocaleLowerCase();
        // Retrieve object of karts matching given arguments
        let kartResults;
        let searchType = "";

        if (args.length > 0) {
          kartResults =
            kartsObj.filter(
              (kart) => {
              if (parseInt(searchString)) {
                searchType = "season";

                return kart["Season of Release"] === searchString;
              }
              else {
              searchType = "name/acquire method";

              return kart["Name"].toLocaleLowerCase().includes(searchString) || kart["Permanent Acquire Method"].toLocaleLowerCase().includes(searchString)
            }});

            embed.setDescription(`${kartResults.length} results found for '${searchString}' (searching by ${searchType}).`);

            // Exit out early if no results were found
            if (kartResults.length === 0) {
              return embed;
            }

            // Keeping special "⠀" character here for reference

            embed.addFields({
              name: "Name",
              value: trim(kartResults.map(kart => kart["Name"]).join("\n"), 1024),
              inline: true
            });

            embed.addFields({
              name: "Kart Type",
              value: trim(kartResults.map(kart => kart["Kart Type"]).join("\n"), 1024),
              inline: true
            });

            if (searchType !== "season") {
              embed.addFields({
                name: "Season of Release",
                value: trim(kartResults.map(kart => kart["Season of Release"]).join("\n"), 1024),
                inline: true
              });
            }
        } else {
          embed.setDescription(`There are currently ${kartsObj.length} karts in the spreadsheet.`);
        }
      } else {
          embed.setDescription(
          'An error occured retrieving the karts information.'
        );
      }

      return embed;
    } catch (err) {
      console.error(err);
    }
  },
};

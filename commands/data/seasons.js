const { google } = require('googleapis');

const { convertToObjects } = require('../../utils/utils');

module.exports = {
  name: 'seasons',
  description: 'Provides theme and date information for KRR+ Seasons.',
  async result(_client, message, args, embed, auth) {
    // Function to parse individual season data
    const parseSeasonData = seasonObj => {
      return `**Season**: ${seasonObj['Season']}
**Theme:** ${seasonObj['Theme']}
${
  seasonObj['End Date']
    ? `**Dates:** ${new Date(
        seasonObj['Start Date']
      ).toDateString()} - ${new Date(seasonObj['End Date']).toDateString()} (${
        seasonObj['# of Days']
      } days)`
    : ''
}
${
  seasonObj['End Date (Season Pass)']
    ? `**Season Pass:** ${new Date(
        seasonObj['Start Date (Season Pass)']
      ).toDateString()} - ${new Date(
        seasonObj['End Date (Season Pass)']
      ).toDateString()} (${seasonObj['# of Days (Season Pass)']} days)`
    : ''
}`;
    };

    const codesSpreadsheetInfo = {
      spreadsheetId: '1KwwHrfgqbVAbFwWnuMuFNAzeFAy4FF2Rars5ZxP7_KU',
      range: 'Seasons!A:H',
    };

    const sheets = google.sheets({ version: 'v4', auth });

    try {
      const rows = (await sheets.spreadsheets.values.get(codesSpreadsheetInfo))
        .data.values;

      if (rows.length) {
        let seasonsObj = convertToObjects(rows[0], rows.slice(1));

        // Split seasons object into current, past, and future seasons
        let currentSeasonArr = {};
        let previousSeasonsArr = [];
        let futureSeasonsArr = [];

        // Check today's date to determine what is past/present/future
        let todaysDate = new Date().setHours(0, 0, 0, 0);

        // new Date (track["Release Date"]).toDateString()

        seasonsObj.forEach(season => {
          if (todaysDate > new Date(season['End Date']).setHours(0, 0, 0, 0)) {
            previousSeasonsArr.push(season);
          } else if (
            todaysDate > new Date(season['Start Date']).setHours(0, 0, 0, 0)
          ) {
            currentSeasonArr = season;
          } else {
            futureSeasonsArr.push(season);
          }
        });

        // Check to make sure everything was parsed correctly
        if (!currentSeasonArr) {
          embed.setDescription(
            'An error occured retrieving the seasons information.'
          );
          return embed;
        }

        embed
          .addFields({
            name: 'Current Season',
            value: parseSeasonData(currentSeasonArr),
          })
          .addField('\u200b', '\u200b')
          .addFields({
            name: 'Previous Seasons',
            value: previousSeasonsArr
              .map(season => parseSeasonData(season))
              .join('\n\n'),
          })
          .addField('\u200b', '\u200b')
          .addFields({
            name: 'Future Seasons',
            value: futureSeasonsArr
              .map(season => parseSeasonData(season))
              .join(""),
          });
      } else {
        embed.setDescription(
          'An error occured retrieving the seasons information.'
        );
      }

      return embed;
    } catch (err) {
      console.error(err);
    }
  },
};

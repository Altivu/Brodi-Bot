const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('seasons')
    .setDescription('Provides theme and date information for KRR+ Seasons.'),

  async execute(_client, interaction, _args, embed, _auth) {
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

    try {
      if (global.seasons.length) {
        let seasonsObj = global.seasons;

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

        // Temporary stopgap; split seasons objects into further objects to prevent hitting the 1024 character cap for each field
        let previousSeasons1 = previousSeasonsArr.splice(0, 5);
        let previousSeasons2 = previousSeasonsArr;

        let futureSeasons1 = futureSeasonsArr.splice(0, 5);
        let futureSeasons2 = futureSeasonsArr;

        embed
          .addFields({
            name: 'Current Season',
            value: parseSeasonData(currentSeasonArr),
          })
          .addField('\u200b', '\u200b')
          .addFields({
            name: 'Previous Seasons',
            value: trim(previousSeasons1
              .map(season => parseSeasonData(season))
              .join('\n\n'), 1024),
          })
          // Empty space char for the name; see https://emptycharacter.com/ to get the char yourself
          .addFields({
            name: '‎',
            value: trim(previousSeasons2
              .map(season => parseSeasonData(season))
              .join('\n\n'), 1024),
          })
          .addField('\u200b', '\u200b')
          .addFields({
            name: 'Future Seasons',
            value: futureSeasons1
              .map(season => parseSeasonData(season))
              .join(""),
          })
          .addFields({
            name: '‎',
            value: futureSeasons2
              .map(season => parseSeasonData(season))
              .join(""),
          });
      } else {
        embed.setDescription(
          'An error occured retrieving the seasons information.'
        );
      }

      return { embeds: [ embed ] };
    } catch (err) {
      console.error(err);
    }
  },
};

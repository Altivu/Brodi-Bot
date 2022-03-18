const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('creatorlinks')
    .setDescription(
      'Provides links to various posts and resources from the bot creator.'
    ),
  execute(_client, _interaction, _args, embed) {
    embed
      .setTitle('Creator Posts and Resources')
      .addFields({
        name: 'KRRPlus Tables',
        value:
          'Google Sheet which contains most of the data the bot extracts from - [Link](https://docs.google.com/spreadsheets/d/e/2PACX-1vSgBqUrUXeCtOtePJ9BxjAwrq2KKhO3M5JqvMYJx93lWTPK_9Q4GR82C9yZx1ThnmXttVWKiWQvfNy3/pubhtml?gid=1171344789#)',
      })
      .addFields({
        name: 'KartRider Rush+ Unofficial Manual',
        value: `Website version of (most of) what this bot provides; also includes extra information such as outfits and accessories - [Link](https://krrplus.web.app/)`,
      })
      .addFields({
        name: 'KartRider Rush+ Tracks',
        value: `Master list of all tracks in the game (including unreleased ones); includes records/tutorial videos, and has a separate sheet for track mastery which can be updated by anyone - [Link](https://docs.google.com/spreadsheets/d/1nm4nM_EGjsNmal6DkMNffpFiYCzKKZ8qOcAkbZo0w6E/edit#gid=472175572)`,
      })
      .addFields({
        name: 'Reddit Posts - Events',
        value: `Championship Mode Guide - [Overview of Championship Mode](https://www.reddit.com/r/Kartrider/comments/irnjic/overview_of_championship_mode/)
Energy Arena Guide - [Overview of Energy Arena](https://www.reddit.com/r/Kartrider/comments/l8blb5/overview_of_energy_arena/)
Expose the Traitor Guide - [Overview of Expose the Traitor](https://www.reddit.com/r/Kartrider/comments/pkkio7/overview_of_expose_the_traitor/)
`,
      })
      .addFields({
        name: 'Reddit Posts - Comprehensive',
        value: `Item Mode Tier List Discussion - [A Brief Look at Item Karts and the Meta Going Into Season 8 (plus tier list)](https://redd.it/ofepds/)
F2P and Premium Systems Guide - [Overview of Free to Play (F2P) Gameplay + Premium Systems (heading into Season 9)](https://www.reddit.com/r/Kartrider/comments/pjyll7/overview_of_free_to_play_f2p_gameplay_premium/)
Speed Mode Overview:
[Part (1/3) - Basics](https://www.reddit.com/r/Kartrider/comments/qx4xba/part_13_basics_a_slightly_comprehensive_overview/)
[Part (2/3) - Pre and Post-L1 License](https://www.reddit.com/r/Kartrider/comments/qx4xqf/part_23_pre_and_postl1_a_slightly_comprehensive/)
[Part (3/3) - Tiers System](https://www.reddit.com/r/Kartrider/comments/qx4y78/part_33_tiers_system_a_slightly_comprehensive/)
Item Mode Overview - [A Slightly Comprehensive Overview of Item Mode (going into Season 12)](https://www.reddit.com/r/Kartrider/comments/tdp6gy/a_slightly_comprehensive_overview_of_item_mode/)
`});

    return { embeds: [embed] };
  },
};

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tutorials')
    .setDescription('Provides some links to KartRider Rush+ guides.'),
  execute(_client, _interaction, _args, embed) {
    embed
      .setTitle('Tutorials')
      .addFields({
        name: 'Speed',
        value: `Introduction to Drifting - [Drifting 101 (video by phreaky)](https://www.youtube.com/watch?v=YJuaIdPFnB4)
Intermediate Drifting Tutorial Series - [The Road to Mastering Drag Drifts (video series by 幸板砖, translated by MadCarroT)](https://www.youtube.com/watch?v=hndh4E_kbDw&list=PL3lisfoN_cJWbhh6pczZjo74HNzZHgyrG&index=1)
Burst Charge - [Cut Charge at 300 km/h - Introduction to Burst Charge (video by Bilibili丶胖神, translated by MadCarroT)](https://youtu.be/fF299ueuucQ)
Brake Drift - [Brake Drift Tutorial 고속턴 | Inverse Club (video by pond)](https://www.youtube.com/watch?v=nIyloCAg8YY)`,
      })
      .addFields({
        name: 'Item',
        value: `Item Race Strategies - [KartRider Item Race Strategies (Google Doc by shrubin & RLAgent)](https://docs.google.com/document/d/1OpNAe-TnbQQXE0U_aWogD3QAM5prftJ7SDAoMXedGtM/edit#heading=h.reqw6izic7gv)
Beginner's Item Guide - [Item Guide for Beginners (video by The Crown)](https://www.youtube.com/watch?v=Gi8hAjNkro4)
Multi-Boost vs Turbo Tap - [Comparison of Multi-Boost vs Turbo Tap (Korean video by 카러플주형)](https://youtu.be/766mx7yPmxw)`,
      })
      .addFields({
        name: 'Kart Fighting Compilations (Chinese)',
        value: `[Video 1](https://www.bilibili.com/video/BV18541147UN)
[Video 2](https://www.bilibili.com/video/BV1Ui4y147zi)`,
      })
      .addFields({
        name: 'Other',
        value: `Parts System - [Parts System explained! (Season 7 Update) (video by Kartmaestro)](https://www.youtube.com/watch?v=tJdw4_042gc)
        `,
      });

    return { embeds: [embed] };
  },
};

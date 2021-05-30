module.exports = {
  name: 'waterbomblocations',
  aliases: ['waterbomb', 'water_bomb', 'waterbombs', 'water_bombs', 'bomblocations', 'bomb_locations'],
  description: 'Provides links to Water Bombing locations videos.',
  result(_client, message, args, embed) {
    embed.setTitle("Water Bombing Locations Videos")
      .setDescription(`A compilation of (Chinese) videos by [雾滴_](https://www.bilibili.com/video/BV1ki4y1t7YE), highlighting areas in tracks where you can consider throwing Water Bombs et al. for good effect.`)
      .addFields({
        name: "Video 1 (https://www.bilibili.com/video/BV15a4y1471y)",
        value: `
      Shark's Tomb (00:06)
      Outer Orbiter (00:44)
      Specter Pass (01:13)
      Canal (02:05)
      Lumberjack Lane (02:42)
      Beguy Market (03:10)
      `,
      })
      .addFields({
        name: "Video 2 (https://www.bilibili.com/video/BV1ki4y1t7YE)",
        value: `
      Twin Gates (00:06)
      Power Core (00:43)
      Panda Paradise (01:26)
      Penguin Rock (02:11)
      Mediea's Hideaway (02:44)
      Steamfunk Factory (03:29)
      `,
      })
      .addFields({
        name: "Video 3 (https://www.bilibili.com/video/BV1Kt4y117gL)",
        value: `
      Paris Grand Prix (00:09)
      Cubeville Heights (01:07)
      Large Hot Rod Collider (02:13)
      Water Aerodrome (03:17)
      `,
      })
      .addFields({
        name: "Video 4 (https://www.bilibili.com/video/BV1TQ4y1K7gi)",
        value: `
      Louie's Dollhouse (00:06)
      Kartland Park (01:08)
      London Nights (02:14)
      Checkered Flag Falls (03:07)
      Shanghai Nights (03:47)
      Shanghai Noon (04:26)
      `,
      })
      .addFields({
        name: "Video 5 (https://www.bilibili.com/video/BV1yv411z7RH)",
        value: `
      Iceberg Speedway (00:06)
      Clock Tower (00:59)
      Dragon's Canal (01:55)
      Jump Point (02:57)
      [R] Jump Point (03:50)
      Mile High Motorway (04:41)
      `,
      })
      .addFields({
        name: "Video 6 (https://www.bilibili.com/video/BV1Uv411B7ud)",
        value: `
      Handy Harbor (00:06)
      Pharaoh's Pass (01:12)
      Dangerous Volcano Jump Zone (02:11)
      Rio Downhill (03:04)
      Dino Town (04:17)
      Beanstalk Raceway (05:11)
      `,
      })
      .addFields({
        name: "Video 7 (https://www.bilibili.com/video/BV1x54y1S7qh)",
        value: `
      Cemetery Circuit (00:06)
      Dragon's Descent (00:54)
      Crystal Quarry (01:54)
      Lava Lane (03:03)
      Terracotta Twister (04:13)
      Luie's Study (05:22)
      `,
      })
      .addFields({
        name: '"I don\'t see <<insert track name here>>."',
        value: "Check the 'track' command to see if there has been a separate video created for your desired track."
      })
      .addFields({
        name: '"Will this be on the test?"',
        value: "Yes."
      });

    return embed;
  }
};
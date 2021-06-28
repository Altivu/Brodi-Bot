module.exports = {
	name: 'tutorial',
  aliases: ['tutorials'],
	description: 'Provides some links to KartRider Rush+ guides.',
  result(_client, message, args, embed) {
    embed.setTitle("Tutorials")
    .addFields({
      name: "Speed",
      value: `[Drifting 101 (video by phreaky)](https://www.youtube.com/watch?v=YJuaIdPFnB4)
[The Road to Mastering Drag Drifts (video series by 幸板砖, translated by MadCarroT)](https://www.youtube.com/watch?v=hndh4E_kbDw&list=PL3lisfoN_cJWbhh6pczZjo74HNzZHgyrG&index=1)`
    })
    .addFields({
      name: "Item",
      value: `[KartRider Item Race Strategies (Google Doc by shrubin & RLAgent)](https://docs.google.com/document/d/1OpNAe-TnbQQXE0U_aWogD3QAM5prftJ7SDAoMXedGtM/edit#heading=h.reqw6izic7gv)
[Item Guide for Beginners (video by The Crown)](https://www.youtube.com/watch?v=Gi8hAjNkro4)`
    });

    return embed;
  }
};
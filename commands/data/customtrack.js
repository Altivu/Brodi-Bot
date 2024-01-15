const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const {
  embed_color,
  embed_color_error,
  BUTTON_INTERACTIONS_TIME_LIMIT,
} = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("customtrack")
    .setDescription("(WEST SERVER ONLY) Provides custom track information.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("search")
        .setDescription(
          "(WEST SERVER ONLY) Search for a custom track through none, one, or many parameters."
        )
        .addStringOption((option) =>
          option
            .setName("track")
            .setDescription("Name of track.")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("creator")
            .setDescription("Name of track creator.")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("laps")
            .setDescription("Number of laps.")
            .setRequired(false)
            .addChoices(
              { name: "1", value: "1" },
              { name: "2", value: "2" },
              { name: "3", value: "3" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("difficulty")
            .setDescription(
              "Difficulty of track (as set as the track creator)."
            )
            .setRequired(false)
            .addChoices(
              { name: "1", value: "1" },
              { name: "2", value: "2" },
              { name: "3", value: "3" },
              { name: "4", value: "4" },
              { name: "5", value: "5" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("tags")
            .setDescription("Tag (can only search for one specific one).")
            .setRequired(false)
            .addChoices(
              { name: "Easy", value: " easy" },
              { name: "Play", value: " play" },
              { name: "Race", value: " race" },
              { name: "High Difficulty", value: " high difficulty" },
              { name: "Consecutive Curves", value: " consecutive curves" },
              { name: "Several Shortcuts", value: " several shortcuts" },
              { name: "Ramp", value: " ramp" },
              { name: "Wake", value: " wake" },
              { name: "Long Drag", value: " long drag" },
              { name: "Defense", value: " defense" },
              { name: "Bend", value: " bend" },
              { name: "Beauty", value: " beauty" },
              { name: "Custom", value: " custom" },
              { name: "Training Camp", value: " training camp" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("theme")
            .setDescription("Name of theme.")
            .setRequired(false)
            .addChoices(
              { name: "Village", value: "village" },
              { name: "Forest", value: "forest" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("record_min")
            .setDescription(
              "Any track with a record slower than or equal to this time (must be in format XX:XX:XX)."
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("record_max")
            .setDescription(
              "Any track with a record faster than or equal to this time (must be in format XX:XX:XX)."
            )
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("track_id")
            .setDescription("Track ID generated on track creation.")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("random").setDescription("Get a random custom track.")
    ),

  async execute(_client, interaction, args, embed, _auth) {
    const imageUrl = "https://krrplus.web.app/assets/Custom%20Tracks";

    try {
      if (global.custom_tracks.length) {
        // Get subcommand
        const subCommandName = interaction?.options?.getSubcommand() || args[0];

        const createSingleCustomTrackEmbed = (track, embed) => {
          embed.setTitle(track["Track Name"]);
          embed.setThumbnail(`${imageUrl}/${track["File ID"]}.png`);

          if (track["Track Creator"]) {
            embed.setDescription(`Custom track by ${track["Track Creator"]}`);
          }

          // Basic info
          embed.addFields({
            name: "Basic Info",
            value: `
**Track Intro:** ${track["Track Intro"]}
**Theme:** ${track["Theme"]}
**Difficulty:** ${
              track["Difficulty"]
                ? "★".repeat(track["Difficulty"]) +
                  "☆".repeat(5 - track["Difficulty"])
                : ""
            }
**Laps: ** ${track["Laps"]}
`,
          });

          if (track["Tag 1"]) {
            embed.addFields({
              name: "Tags",
              value:
                track["Tag 1"] + (track["Tag 2"] ? `, ${track["Tag 2"]}` : ""),
            });
          }

          if (track["Record (as of recording)"]) {
            embed.addFields({
              name: "Record (as of recording)",
              value: track["Record (as of recording)"],
            });
          }

          if (track["Track ID"]) {
            embed.addFields({
              name: "Track ID",
              value: track["Track ID"],
            });
          }

          if (track["Notes"]) {
            embed.addFields({
              name: "Notes",
              value: track["Notes"],
            });
          }

          return embed;
        };

        //////////////////////////
        // CUSTOM TRACKS SEARCH //
        //////////////////////////

        if (subCommandName === "search") {
          const NUMBER_OF_TRACKS = 5;

          if (!interaction.options) {
            embed
              .setColor(embed_color_error)
              .setDescription(
                "This command can only be run as a slash command."
              );

            return { embeds: [embed] };
          }

          embed.setTitle("Custom Tracks - Search");

          // Start going over all of the options (records will be handled separately) due to needing to parse the string
          const optionsArray = [
            {
              header: "Track Name",
              value: interaction.options.getString("track"),
            },
            {
              header: "Track Creator",
              value: interaction.options.getString("creator"),
            },
            {
              header: "Laps",
              value: interaction.options.getString("laps"),
            },
            {
              header: "Difficulty",
              value: interaction.options.getString("difficulty"),
            },
            {
              header: "Theme",
              value: interaction.options.getString("theme"),
            },
            {
              header: "Track ID",
              value: interaction.options.getString("track_id"),
            },
          ];

          // element is from the global custom tracks variable
          // option is from what is provided through the Discord command as search parameters
          let filteredTracks = global.custom_tracks.filter((element) => {
            return optionsArray.every((option) => {
              return (
                !option["value"] ||
                element[option["header"]]
                  ?.toLocaleLowerCase()
                  .includes(option["value"]?.toLocaleLowerCase())
              );
            });
          });

          // Now filter by the remaining options (that being tags and min/max records)
          const optionTag = interaction.options.getString("tags");
          const optionRecordMin = interaction.options.getString("record_min");
          const optionRecordMax = interaction.options.getString("record_max");

          if (optionTag) {
            filteredTracks = filteredTracks.filter((element) =>
              [
                element["Tag 1"].toLocaleLowerCase(),
                element["Tag 2"].toLocaleLowerCase(),
              ].includes(optionTag)
            );
          }

          if (optionRecordMin) {
            filteredTracks = filteredTracks.filter(
              (element) =>
                element["Record (as of recording)"] &&
                element["Record (as of recording)"]
                  .split(" ")[0]
                  .localeCompare(optionRecordMin) >= 0
            );
          }

          if (optionRecordMax) {
            filteredTracks = filteredTracks.filter(
              (element) =>
                element["Record (as of recording)"] &&
                element["Record (as of recording)"]
                  .split(" ")[0]
                  .localeCompare(optionRecordMax) <= 0
            );
          }

          // If no results were found, then exit early
          if (filteredTracks.length === 0) {
            embed.setDescription("No results found.");

            return { embeds: [embed] };
          }

          // If only one result was found, then return that and do not go through the entire search embed creation process
          if (filteredTracks.length === 1) {
            embed = createSingleCustomTrackEmbed(filteredTracks[0], embed);

            return { embeds: [embed] };
          }

          // Sort by alphabetical order
          filteredTracks = filteredTracks.sort((a, b) =>
            a["Track Name"].localeCompare(b["Track Name"])
          );

          // Build the full search embed
          embed.setDescription(
            `Number of tracks fitting criteria: ${filteredTracks.length.toString()}
            (Navigation buttons are available for ${BUTTON_INTERACTIONS_TIME_LIMIT} seconds)`
          );

          let currentIndex = 0;

          // Build function to create the embed information since it will be called frequently if used in conjunction with the buttons
          const createSearchEmbedInformation = () => {
            embed.setFields([
              {
                name: `Track Name`,
                value: `${filteredTracks
                  .slice(currentIndex, currentIndex + NUMBER_OF_TRACKS)
                  .map(
                    (element) =>
                      `${
                        filteredTracks.findIndex(
                          (i) => element["Track ID"] === i["Track ID"]
                        ) + 1
                      }. ${element["Track Name"]}`
                  )
                  .join("\n")}`,
                inline: true,
              },
              {
                name: "Creator",
                value: `${filteredTracks
                  .slice(currentIndex, currentIndex + NUMBER_OF_TRACKS)
                  .map((element) => element["Track Creator"])
                  .join("\n")}`,
                inline: true,
              },
              {
                name: "Track ID",
                value: `${filteredTracks
                  .slice(currentIndex, currentIndex + NUMBER_OF_TRACKS)
                  .map((element) => element["Track ID"])
                  .join("\n")}`,
                inline: true,
              },
            ]);
          };

          createSearchEmbedInformation();

          // Add buttons to allow for traversing the list (slash command only)

          // Get user object
          const user = interaction?.user;

          // Create a specific filter for capturing the button:
          // 1. The button is tied to this specific interaction
          // 2. The interaction was requested by the user that is actually clicking the button
          const filter = (i) => {
            return (
              i?.message?.interaction?.id === interaction.id &&
              i?.user?.id === user?.id
            );
          };

          const collector = interaction.channel.createMessageComponentCollector(
            {
              filter,
              time: BUTTON_INTERACTIONS_TIME_LIMIT * 1000,
            }
          );

          collector.on("collect", async (i) => {
            const previousIndex = currentIndex;

            // Navigation button logic
            if (i.customId === "first") {
              currentIndex = 0;
            } else if (i.customId === "back") {
              currentIndex -= Math.min(NUMBER_OF_TRACKS, currentIndex);
            } else if (i.customId === "forward") {
              currentIndex += Math.min(
                NUMBER_OF_TRACKS,
                filteredTracks.length - currentIndex
              );
            } else if (i.customId === "last") {
              currentIndex =
                filteredTracks.length -
                (filteredTracks.length % NUMBER_OF_TRACKS);
            }

            // If a button pressed was a navigational one, then update the existing embed accordingly
            if (previousIndex !== currentIndex) {
              createSearchEmbedInformation();

              // Re-label selection buttons
              ButtonBuilder.from(selectionRow.components[0]).setLabel(
                `${currentIndex + 1}.`
              );
              ButtonBuilder.from(selectionRow.components[1]).setLabel(
                `${currentIndex + 2}.`
              );
              ButtonBuilder.from(selectionRow.components[2]).setLabel(
                `${currentIndex + 3}.`
              );
              ButtonBuilder.from(selectionRow.components[3]).setLabel(
                `${currentIndex + 4}.`
              );
              ButtonBuilder.from(selectionRow.components[4]).setLabel(
                `${currentIndex + 5}.`
              );

              // Disable/re-enable buttons based on currentIndex
              ButtonBuilder.from(selectionRow.components[0]).setDisabled(
                filteredTracks.length - currentIndex < 1
              );
              ButtonBuilder.from(selectionRow.components[1]).setDisabled(
                filteredTracks.length - currentIndex < 2
              );
              ButtonBuilder.from(selectionRow.components[2]).setDisabled(
                filteredTracks.length - currentIndex < 3
              );
              ButtonBuilder.from(selectionRow.components[3]).setDisabled(
                filteredTracks.length - currentIndex < 4
              );
              ButtonBuilder.from(selectionRow.components[4]).setDisabled(
                filteredTracks.length - currentIndex < 5
              );

              ButtonBuilder.from(navigationRow.components[0]).setDisabled(
                currentIndex === 0
              );
              ButtonBuilder.from(navigationRow.components[1]).setDisabled(
                currentIndex === 0
              );
              ButtonBuilder.from(navigationRow.components[2]).setLabel(
                `(Page ${
                  Math.ceil(currentIndex / NUMBER_OF_TRACKS) + 1
                } of ${Math.ceil(filteredTracks.length / NUMBER_OF_TRACKS)})`
              );
              ButtonBuilder.from(navigationRow.components[3]).setDisabled(
                currentIndex >= filteredTracks.length - NUMBER_OF_TRACKS
              );
              ButtonBuilder.from(navigationRow.components[4]).setDisabled(
                currentIndex >= filteredTracks.length - NUMBER_OF_TRACKS
              );

              await i.update({
                embeds: [embed],
                components: [selectionRow, navigationRow],
              });
            } else {
              // Otherwise, one of the track selection buttons was probably pressed, so create a new embed with the track information
              if (i.customId.includes("track_")) {
                const buttonIndex =
                  currentIndex + parseInt(i.customId.split("_")[1]);

                const track = filteredTracks[buttonIndex - 1];

                let singleCustomTrackEmbed = new EmbedBuilder();
                singleCustomTrackEmbed.setColor(embed_color);

                singleCustomTrackEmbed = createSingleCustomTrackEmbed(
                  track,
                  singleCustomTrackEmbed
                );

                await i.reply({
                  content: `Selection button "${buttonIndex}." pressed.`,
                  embeds: [singleCustomTrackEmbed],
                });
              }
            }
          });

          // Logic for when the collector expires (disable the buttons)
          collector.on("end", (collected) => {
            selectionRow.components.forEach((button) =>
              ButtonBuilder.from(button).setDisabled(true)
            );
            navigationRow.components.forEach((button) =>
              ButtonBuilder.from(button).setDisabled(true)
            );

            interaction.editReply({
              embeds: [embed],
              components: [selectionRow, navigationRow],
            });
          });

          // Build the row of track selection buttons
          const selectionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("track_1")
              .setLabel(`${currentIndex + 1}.`)
              .setStyle("Primary")
              .setDisabled(filteredTracks.length < 1),
            new ButtonBuilder()
              .setCustomId("track_2")
              .setLabel(`${currentIndex + 2}.`)
              .setStyle("Primary")
              .setDisabled(filteredTracks.length < 2),
            new ButtonBuilder()
              .setCustomId("track_3")
              .setLabel(`${currentIndex + 3}.`)
              .setStyle("Primary")
              .setDisabled(filteredTracks.length < 3),
            new ButtonBuilder()
              .setCustomId("track_4")
              .setLabel(`${currentIndex + 4}.`)
              .setStyle("Primary")
              .setDisabled(filteredTracks.length < 4),
            new ButtonBuilder()
              .setCustomId("track_5")
              .setLabel(`${currentIndex + 5}.`)
              .setStyle("Primary")
              .setDisabled(filteredTracks.length < 5)
          );

          // Build the row of navigation buttons
          const navigationRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("first")
              .setLabel("⏪")
              .setStyle("Secondary")
              .setDisabled(filteredTracks.length <= NUMBER_OF_TRACKS),
            new ButtonBuilder()
              .setCustomId("back")
              .setLabel("◀️")
              .setStyle("Secondary")
              .setDisabled(filteredTracks.length <= NUMBER_OF_TRACKS),
            new ButtonBuilder()
              .setCustomId("null")
              .setLabel(
                `(Page ${
                  Math.ceil(currentIndex / NUMBER_OF_TRACKS) + 1
                } of ${Math.ceil(filteredTracks.length / NUMBER_OF_TRACKS)})`
              )
              .setStyle("Secondary")
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId("forward")
              .setLabel("▶️")
              .setStyle("Secondary")
              .setDisabled(filteredTracks.length <= NUMBER_OF_TRACKS),
            new ButtonBuilder()
              .setCustomId("last")
              .setLabel("⏩")
              .setStyle("Secondary")
              .setDisabled(filteredTracks.length <= NUMBER_OF_TRACKS)
          );

          return { embeds: [embed], components: [selectionRow, navigationRow] };
        }

        //////////////////////////
        // CUSTOM TRACKS RANDOM //
        //////////////////////////
        if (subCommandName === "random") {
          track =
            global.custom_tracks[
              Math.floor(Math.random() * global.custom_tracks.length)
            ];

          const resultEmbed = createSingleCustomTrackEmbed(track, embed);

          return { embeds: [resultEmbed] };
        }
      }
    } catch (err) {
      console.error(err);

      embed.setColor(embed_color_error).setDescription(err.toString());

      return { embeds: [embed] };
    }
  },
};

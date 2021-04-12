// Copied from https://stackoverflow.com/a/63767962, with modifications
convertToObjects = (headers, rows) => {
  return rows.reduce(
    (ctx, row) => {
      ctx.objects.push(
        ctx.headers.reduce((item, header, index) => {
          if (header !== "") {
            item[header] = row[index];
          }

          return item;
        }, {})
      );
      return ctx;
    },
    { objects: [], headers }
  ).objects;
};

// Copied from https://discordjs.guide/additional-info/rest-api.html#urban-dictionary
trim = (str, max) =>
  str.length > max ? `${str.slice(0, max - 3)}...` : str;

// Time format
convertTimeToMilliseconds = (time, separator = ":") => {
  const bIsNegative = time[0] === "-";

  const timeArray = time.split(separator);

  return (
    (bIsNegative ? -1 : 1) *
    (Math.abs(parseInt(timeArray[0], 10) * 6000) +
      parseInt(timeArray[1], 10) * 100 +
      parseInt(timeArray[2], 10))
  );
};

convertMillisecondsToTime = (milliseconds, separator = ":") => {
  const bIsNegative = milliseconds < 0;
  const absMilliseconds = Math.abs(milliseconds);

  const minutes = Math.floor(absMilliseconds / 6000);
  const seconds = Math.floor((absMilliseconds - minutes * 6000) / 100);
  const newMilliseconds = absMilliseconds - minutes * 6000 - seconds * 100;

  return `${bIsNegative ? "-" : ""}${minutes
    .toString()
    .padStart(2, "0")}${separator}${seconds
    .toString()
    .padStart(2, "0")}${separator}${newMilliseconds
    .toString()
    .padStart(2, "0")}`;
};

convertDiscordToGoogleSheetName = async (sheets, requestNames, args, user) => {
  const namesRows = (await sheets.spreadsheets.values.batchGet(requestNames))
    .data.valueRanges;

  // Discord Servers
  if (namesRows[0].values.length) {
    let discordServersObj = convertToObjects(
      namesRows[0].values[0],
      namesRows[0].values.slice(1)
    );

    // TODO: Logic to check if user is in the server so they can check relevant sheets
  }

  let nameInSheet;

  // Name Mapping
  if (namesRows[1].values.length) {
    // Tier cutoff information JSON object
    let nameMappingObj = convertToObjects(
      namesRows[1].values[0],
      namesRows[1].values.slice(1)
    );

    // If arguments are provided, search the sheet based on those arguments; otherwise, try to find the info based on the user's username/tag
    if (args.length > 0) {
      let nameToSearch = args.join(" ");

      let nameObj = nameMappingObj.find(
        (name) =>
          name["Username"]
            .toLocaleLowerCase()
            .includes(nameToSearch.toLocaleLowerCase()) ||
          name["Tag"]
            .toLocaleLowerCase()
            .includes(nameToSearch.toLocaleLowerCase()) ||
          name["Time Sheet Name"]
            .toLocaleLowerCase()
            .includes(nameToSearch.toLocaleLowerCase())
      );

      if (nameObj) {
        nameInSheet = nameObj["Time Sheet Name"];
      }
    } else {
      let nameObj = nameMappingObj.find(
        (name) =>
          name["Username"].toLocaleLowerCase() ===
            user.username.toLocaleLowerCase() ||
          name["Tag"].toLocaleLowerCase() ===
            user.tag.split("#")[0].toLocaleLowerCase()
      );

      if (nameObj) {
        nameInSheet = nameObj["Time Sheet Name"];
      }
    }
  }

  if (!nameInSheet) {
    throw new Error(
      `No info found${args.length > 0 ? " for '" + args.join(" ") + "'" : ""}.`
    );
  }

  return nameInSheet;
};

module.exports = {
  convertToObjects,
  trim,
  convertTimeToMilliseconds,
  convertMillisecondsToTime,
  convertDiscordToGoogleSheetName
};
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
  if (!time) return;

  const bIsNegative = time[0] === "-";

  // const timeArray = time.split(separator);

  // Because people keep putting the times in the sheet incorrectly, I'll have to split by either a colon or a period
  const timeArray = time.split(/:|\./);

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

// Look for name in Google Sheet(s) given either a name to search, or no parameters (which then searches based on the user's username/tag)
// memberTimesNames should be an array of names, currently from MadCarroT's Inverse Club Time Sheet > Member Times sheet
// searchString is for when you are searching for a specific name through a parameter
// user is when you have a specific Discord user object, usually from commands that get the data of the user who ran it
// searchString and user are usually an "either or" thing for this function
convertDiscordToGoogleSheetName = async (
  sheets,
  memberTimesNames,
  searchString,
  user
) => {
  // Sheet info for the KRR+ Name Mapping Google Sheet which is used to map user ids/usernames/tags to the (Inverse) Time Sheet
  // https://docs.google.com/spreadsheets/d/1RKQQOx_WtgyU8o2d1BV9r1pF-dvg3UmP7CsZpJzUkks/edit#gid=0
  const nameMappingSheetInfo = {
    spreadsheetId: "1RKQQOx_WtgyU8o2d1BV9r1pF-dvg3UmP7CsZpJzUkks",
    ranges: ["Discord Servers!A:B", "Name Mapping!A:E"],
  };

  const namesRows = (await sheets.spreadsheets.values.batchGet(nameMappingSheetInfo))
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

    // If arguments are provided, search the sheet based on those arguments; otherwise, try to find the info based on the user's id/username/tag
    // If a "mentioned" user is input as the argument for the info command, it will be returned in the format <@#>, where # is the id
    if (searchString) {
      let searchResults = memberTimesNames.find(name => name.toLocaleLowerCase().includes(searchString.toLocaleLowerCase())) || nameMappingObj.find(
        (name) =>
          (name["User ID"] && searchString.includes(name["User ID"])) ||
          (name["Username"] && name["Username"]
            .toLocaleLowerCase()
            .includes(searchString.toLocaleLowerCase())) ||
          (name["Tag"] && name["Tag"]
            .toLocaleLowerCase()
            .includes(searchString.toLocaleLowerCase())) ||
          (name["Time Sheet Name"] && name["Time Sheet Name"]
            .toLocaleLowerCase()
            .includes(searchString.toLocaleLowerCase()))
      );

      if (typeof(searchResults) === "string") {
        nameInSheet = searchResults;
      } else if (typeof(searchResults) === "object") {
        nameInSheet = searchResults["Time Sheet Name"];
      }
    } else {
      // Compare directly to the user's data to see if they are in the Time Sheet
      // The first part of the full OR block compares with the Name Mapping sheet, whereas the second part checks with the Time Sheet sheet
      let searchResults = nameMappingObj.find(
        (name) =>
          name["User ID"] === user.id ||
          (name["Username"] && name["Username"].toLocaleLowerCase() ===
          user.username.toLocaleLowerCase()) ||
          (name["Tag"] && name["Tag"].toLocaleLowerCase() ===
          user.tag.split("#")[0].toLocaleLowerCase())
      ) || memberTimesNames.find(name => name.toLocaleLowerCase() === user.username.toLocaleLowerCase() || name.toLocaleLowerCase() === user.tag.split("#")[0].toLocaleLowerCase());

      if (typeof(searchResults) === "string") {
        nameInSheet = searchResults;
      } else if (typeof(searchResults) === "object") {
        nameInSheet = searchResults["Time Sheet Name"];
      }
    }
  }

  if (!nameInSheet) {
    throw new Error(
      `No info found${searchString ? " for '" + args.join(" ") + "'." : ". Are you a member of Inverse who has filled out the time sheet?"}`
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
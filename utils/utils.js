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

  // // Discord Servers
  // if (namesRows[0].values.length) {
  //   let discordServersObj = convertToObjects(
  //     namesRows[0].values[0],
  //     namesRows[0].values.slice(1)
  //   );

  //   // TODO: Logic to check if user is in the server so they can check relevant sheets
  // }

  // Sort the memberTimesNames array prior to searching, as there are some members whose full names are a substring of other members' names...
  memberTimesNames.sort();

  // Trim and set string to lowercase for searching
  const lowerCaseSearchString = searchString?.trim()?.toLocaleLowerCase();

  // Set name in sheet variable to return
  let nameInSheet = undefined;

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
      let searchResults = memberTimesNames.find(name => name.toLocaleLowerCase().includes(lowerCaseSearchString)) || nameMappingObj.find(
        (name) =>
          (name["User ID"] && lowerCaseSearchString.includes(name["User ID"])) ||
          (name["Username"] && name["Username"]
            .toLocaleLowerCase()
            .includes(lowerCaseSearchString)) ||
          (name["Tag"] && name["Tag"]
            .toLocaleLowerCase()
            .includes(lowerCaseSearchString)) ||
          (name["Time Sheet Name"] && name["Time Sheet Name"]
            .toLocaleLowerCase()
            .includes(lowerCaseSearchString))
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
      `No info found${searchString ? " for '" + searchString + "'." : ". Are you a member of Inverse who has filled out the time sheet? If so, check with the developer to see that your name is properly mapped."}`
    );
  }

  return nameInSheet;
};

// Get a number and return an equivalent spreadsheet column letter(s) (such as in Excel or Google Sheets)
// Ex. 1 = A, 27 = AA
// Copied from https://stackoverflow.com/a/64456745 and modified accordingly
numbertoColumnLetters = (num) => {
    let letters = '';

    while (num >= 0) {
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters;
        num = Math.floor(num / 26) - 1;
    }

    return letters
}

// Return a slightly cleaned up track search string to make it easier to match with a proper track name
// Note: will be returned as lower case
parseTrackSearchString = (searchString) => {
  searchString = searchString.toLowerCase();

  // There are "iPhone apostrophes" which are different from standard, so replace those prior to searching so we don't get missing results
  searchString = searchString.replace(/’/g, "'");

  // Add some manual "corrections" based on common search terms made by users that I've seen
  searchString = searchString.replace('reverse', '[r]');

  if (
    searchString == 'up n down' ||
    searchString == 'up n'
  ) {
    searchString = "up 'n' down";
  } else if (
    searchString == '[r] up n down' ||
    searchString == '[r] up n'
  ) {
    searchString = "[r] up 'n' down";
  } else if (searchString == 'rio') {
    searchString = 'rio downhill';
  }

  return searchString;
}

// Get an object of tiers given a track name, time, and tierCutoffsObj
getTiersFromTrackAndTimeAndTierCutoffsObj = (track, playerTime, tierCutoffsObj) => {
  if (!playerTime) {
    playerTime = "00.00.00";
  }

  // No nonsense here; assume that all provided parameters are valid without error checking, as it should have been done prior to running this function
  const trackObj = tierCutoffsObj.find(obj => obj["Map"] === track);

  const returnObj = [];

  const incompleteTime = "00.00.00";
  const belowT4Time = "99.99.99";

  let tierMilliseconds = 0;
  let differentialMilliseconds = convertTimeToMilliseconds(playerTime, ".");
  let differentialTime = convertMillisecondsToTime(differentialMilliseconds, ".");

  // Add additional outlier for Incomplete
  returnObj.push({
    tier: "Incomplete",
    tierTime: incompleteTime,
    tierMilliseconds,
    differentialTime,
    differentialMilliseconds
  })

  for (const [tier, tierTime] of Object.entries(trackObj).slice(1)) {
    tierMilliseconds = convertTimeToMilliseconds(tierTime, ".");
    differentialMilliseconds = convertTimeToMilliseconds(playerTime, ".") - tierMilliseconds;
    differentialTime = convertMillisecondsToTime(differentialMilliseconds, ".");

    returnObj.push({
      tier,
      tierTime,
      tierMilliseconds,
      differentialTime,
      differentialMilliseconds
    })
  }

  tierMilliseconds = convertTimeToMilliseconds(belowT4Time, ".");
  differentialMilliseconds = convertTimeToMilliseconds(playerTime, ".") - tierMilliseconds;
  differentialTime = convertMillisecondsToTime(differentialMilliseconds, ".");

  // Add additional outlier for Below T4
  returnObj.push({
    tier: "Below T4",
    tierTime: belowT4Time,
    tierMilliseconds,
    differentialTime,
    differentialMilliseconds
  })

  return returnObj;
}

//////////////////////////
// LEVENSHTEIN DISTANCE //
//////////////////////////

// Copied from https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript

// Compute the edit distance between the two given strings
getEditDistance = (a, b) => {
  if (a.length === 0) return b.length; 
  if (b.length === 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) == a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

module.exports = {
  convertToObjects,
  trim,
  convertTimeToMilliseconds,
  convertMillisecondsToTime,
  convertDiscordToGoogleSheetName,
  numbertoColumnLetters,
  parseTrackSearchString,
  getTiersFromTrackAndTimeAndTierCutoffsObj,

  getEditDistance
};
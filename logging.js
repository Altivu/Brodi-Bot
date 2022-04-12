const { google } = require("googleapis");

const { convertToObjects } = require("./utils/utils");

exports.logData = async (payload, auth) => {
    const spreadsheetId = "10GrZcNEavKKv2QlVt-yd3HxEvL7iyF4v-jBdPVAfj5U";
    const range = "Bot Logs!A2:F";
    const valueInputOption = "USER_ENTERED";
    
    // Payload expected layout (matches columns in sheet)
    // Date, User, Command Type, Command, Options, Server, Result
    // const resource = { values: [[new Date(),  "User", "Slash", "Command", "Options", "Server", "Result"]] }
    // Note that it is a nested array ( [[ <<content>> ]] )
    const resource = { values: payload };

    const sheets = google.sheets({ version: "v4", auth });

    try {
      // Do not record bot creator's command logs (due to excessive testing)
      // This is hard-coded and not that great but it'll hopefully suffice for now
      if (resource.values[0][1] === "Altivu") return;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption,
        resource,
      }),
        (err, _res) => {
          if (err) return console.error(err);
        };
    } catch (err) {
      console.log(err);
    }

    return;
  }

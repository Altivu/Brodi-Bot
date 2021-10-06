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
      const response =
        (await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption,
          resource,
        }),
        (err, res) => {
          if (err) return console.error(err);
        });
    } catch (err) {
      console.log(err);
    }

    return;
  }

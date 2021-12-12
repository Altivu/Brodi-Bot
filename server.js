// Uptime code retrieved from https://www.freecodecamp.org/news/create-a-discord-bot-with-javascript-nodejs/

const express = require("express");
const cron = require("node-cron");

const server = express();

server.all("/", (req, res) => {
  res.send("Bot is running!")
})

function keepAlive() {
  server.listen(3000, () => {
    console.log("Server is ready.")
  })
}

function synchronizeGoogleSheetsData(crontabString, client, oAuth2Client) {
  cron.schedule(crontabString,  () => {
    console.log(`Running synchronizeGoogleSheetsData function at ${new Date()}...`);
    client.commands.get("synchronize").execute(client, null, [], null, oAuth2Client);
  });
}

module.exports = {
  keepAlive,
  synchronizeGoogleSheetsData
}
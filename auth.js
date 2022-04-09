const { google } = require("googleapis");

const dotenv = require('dotenv');
dotenv.config();

const credentials = {
  "installed": {
    "client_id": process.env.CLIENT_ID,
    "project_id": process.env.PROJECT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
    "client_secret": process.env.CLIENT_SECRET,
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
}

const token = {
  "access_token": process.env.ACCESS_TOKEN,
  "refresh_token": process.env.REFRESH_TOKEN,
  "scope": "https://www.googleapis.com/auth/spreadsheets",
  "token_type": "Bearer",
  "expiry_date": 1617765211513
}

let oAuth2Client;

/**
 * Create an OAuth2 client with the given credentials
 * @param {Object} credentials The authorization client credentials.
 * @return {OAuth2Client} Authorized client.
 */
exports.authorize = () => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.setCredentials(token);

  console.log("Authorized to Google API.")

  return oAuth2Client;
}
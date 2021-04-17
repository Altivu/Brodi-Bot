const {
  prefix
} = require("./config.json");

module.exports = {
  content: undefined,
  tts: false,
  nonce: undefined,
  embed: {
    title: null,
    type: 'rich',
    description: `Please run the command using the '${prefix}' prefix before trying slash commands again.`,
    url: null,
    timestamp: null,
    color: 13874500,
    fields: [],
    thumbnail: null,
    image: null,
    author: null,
    footer: null
  },
  embeds: [
    {
      title: null,
      type: 'rich',
      description: `Please run the command using the '${prefix}' prefix before trying slash commands again.`,
      url: null,
      timestamp: null,
      color: 13874500,
      fields: [],
      thumbnail: null,
      image: null,
      author: null,
      footer: null
    }
  ],
  username: undefined,
  avatar_url: undefined,
  allowed_mentions: undefined,
  flags: undefined
}
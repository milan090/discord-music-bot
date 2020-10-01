const { prefix } = require('../config.json');

async function stop(message, songConstruct){
  songConstruct.songs = [];
  songConstruct.playing = false;
  await songConstruct.connection.disconnect();
  songConstruct.connection = null;
  return message.channel.send(`The bot has been disconnected from the voice channel. Use command \`${prefix}play\` to play again.`);
}

module.exports = {
  stop
};
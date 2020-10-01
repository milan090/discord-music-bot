const playSongs = require('./playSongs');

async function skip(message, songConstruct){
  const {songs} = songConstruct;

  songs.shift();
  message.channel.send("Skipped the currently playing song.");
  return playSongs(message, songConstruct);
}

module.exports = {
  skip
};
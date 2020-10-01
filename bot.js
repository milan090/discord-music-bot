const Discord = require('discord.js');
const { getYoutubeVideoInfo } = require('./api/youtube');
const {
  prefix,
  token
} = require('./config.json');

// Commands
const { play } = require('./commands/play');
const { skip } = require('./commands/skip');
const { stop } = require('./commands/stop');
const { remove } = require('./commands/remove.js');
const { seek } = require('./commands/seek.js');

const client = new Discord.Client();
const songConstructs = {}; // Handles the song queues for all guilds

client.once('ready', () => {
  console.log("Ready");
})

client.on('message', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return; //Check if the message was not sent by bot
  if (!message.member.voice.channel) return message.reply("You need to be connected to a voice channel first!");
  // The user should be connected to a voice channel
  
  const args = message.content.slice(prefix.length).split(' ');
  const command = args.shift(); //Removes the first item (command) from the args:<Array>

  let songConstruct = songConstructs[message.guild.id];

  if (!songConstruct) {   //If a songconstruct for the guild does not exist, create it!
    const newSongConstruct = {
      connection: null,
      volume: 5,
      songs: [],
      playing: false
    };
    songConstructs[message.guild.id] = songConstruct = newSongConstruct; 
    //Sets the songConstruct for the guild
  }
  
  switch (command) {
    case "play":
      const songName = args.join(' ');
      const songInfo = await getYoutubeVideoInfo(songName.toLowerCase());
      if (!songInfo) return message.channel.send("No such song.");
      songConstruct.songs.push(songInfo);
      await play(message, songConstruct);
      break;

    case "skip":
      const { songs } = songConstruct;
      if (!songs.length) return message.channel.send(`No songs currently in queue. Add some with \`${prefix}addsong song_name\``);
      if (songs.length === 1) {
        message.channel.send("No more songs in queue. Disconnecting bot audio.");
        return stop(message, songConstruct);
      } 
      await skip(message, songConstruct);
      break;

    case "stop":
      await stop(message, songConstruct);
      break;

    case "remove":
      await remove(message, songConstruct, args[0]);
      break;

    case "seek":
      if (!songConstruct.songs[0]) return message.reply("No songs currently playing!");
      if (!args[0]) return message.reply("Specify I time to seek into");
      seek(message, songConstruct, args[0]);
      break;

    case "queue":
      if (songConstruct.songs.length === 0) return message.reply(`0 Songs in Queue`);
      message.channel.send(`
      __Song Queue__
        \`\`\`${songConstruct.songs.map((song, i) => `${i+1} ${song.title}`).join('\n')}\`\`\`
      `)
      break;
    
    case 'help':
      const embed = new Discord.MessageEmbed()
        .setTitle("Help for TheByteSlash Music BOT")
        .setColor(0x00ff00)
        .setDescription(`
          \`\`\`${prefix}play <song name> : Use this to play any song.\n${prefix}skip : Skips the currently playing song.\n${prefix}stop : Deletes the song queue and disconnects the bot.\n${prefix}queue : Displays the list of songs to be played.\n${prefix}remove N: Will remove a song in the queue at position N\n${prefix}seek mm:ss : Skips the song track to mm:ss time
          \`\`\`
        `)
      message.channel.send(embed);
      break;
  
    default:
      message.reply(`Use command \`${prefix}help\` for help on how to use the bot.`)
      break;
  }
});

client.login(token);
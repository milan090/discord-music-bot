const Discord = require("discord.js");
const { prefix, token } = require("../config.json");
const { getYoutubeVideoInfo } = require("./api/youtube");


// Commands
const { play } = require("./commands/play");
const { skip } = require("./commands/skip");
const { stop } = require("./commands/stop");
const { remove } = require("./commands/remove.js");
const { seek } = require("./commands/seek.js");
const { changeOrder } = require("./commands/changeOrder.js");
const { queue } = require("./commands/queue");
const { suggest } = require("./commands/suggest");

const client = new Discord.Client();
const songConstructs = new Map(); // Handles the song queues for all guilds

client.once("ready", () => {
  console.log("Ready");
});

client.on("message", async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix)) return; //Check if the message was not sent by bot
  if (!message.member.voice.channel)
    return message.reply("You need to be connected to a voice channel first!");
  // The user should be connected to a voice channel

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift(); //Removes the first item (command) from the args:<Array>
  let argString = message.content.slice(prefix.length).trim().slice(command.length).trim();
  if(argString == "") argString = null;

  let songConstruct = songConstructs.get(message.guild.id);

  if (!songConstruct) {
    //If a songconstruct for the guild does not exist, create it!
    const newSongConstruct = {
      connection: null,
      volume: 5,
      songs: [],
      playing: false,
    };

    songConstructs.set(message.guild.id, newSongConstruct);
    //Sets the songConstruct for the guild
    songConstruct = newSongConstruct;
  }

  switch (command) {
  case "play": {
    const songName = argString;
    const songInfo = await getYoutubeVideoInfo(songName);
    if (!songInfo) return message.channel.send("No such song.");
    songConstruct.songs.push(songInfo);
    await play(message, songConstruct);
    break;
  }

  case "skip": {
    const { songs } = songConstruct;
    if (!songs.length)
      return message.channel.send(
        `No songs currently in queue. Add some with \`${prefix}addsong song_name\``
      );
    if (songs.length === 1) {
      message.channel.send(
        "No more songs in queue. Disconnecting bot audio."
      );
      return stop(message, songConstruct);
    }
    await skip(message, songConstruct);
    break;
  }

  case "stop":
    await stop(message, songConstruct);
    break;

  case "remove":
    await remove(message, songConstruct, args[0]);
    break;

  case "seek":
    if (!songConstruct.songs[0])
      return message.reply("No songs currently playing!");
    if (!args[0]) return message.reply("Specify I time to seek into");
    seek(message, songConstruct, args[0]);
    break;

  case "queue":
    await queue(message, songConstruct);
    break;

  case "change": {
    const newSongs = await changeOrder(
      message,
      songConstruct,
      args[0],
      args[1]
    );
    if (Array.isArray(newSongs)) {
      songConstruct = { ...songConstruct, songs: newSongs };
      songConstructs.set(message.guild.id, songConstruct);
      message.channel.send("Song Queue changed! \n");
      queue(message, songConstruct);
    }
    break;
  }

  case "suggest":
    await suggest(message);
    break;

  case "help": {
    const embed = new Discord.MessageEmbed()
      .setTitle("Help for TheByteSlash Music BOT")
      .setColor(0x00ff00).setDescription(`
          \`\`\`${prefix}play <song name> : Use this to play any song.\n${prefix}skip : Skips the currently playing song.\n${prefix}stop : Deletes the song queue and disconnects the bot.\n${prefix}queue : Displays the list of songs to be played.\n${prefix}remove N: Will remove a song in the queue at position N\n${prefix}seek mm:ss : Skips the song track to mm:ss time\n${prefix}chaneg <SONG_INDEX> <CHANGE_TO_INDEX>: changes the song order\n${prefix}suggest : Gives a random song
          \`\`\`
        `);
    message.channel.send(embed);
    break;
  }

  default:
    message.reply(
      `Use command \`${prefix}help\` for help on how to use the bot.`
    );
    break;
  }
});

client.login(token);

const ytdl = require('@distube/ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// Command Configuration
this.config = {
  name: "music",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Modified by ChatGPT",
  description: "Search and download music using ytdl-core",
  commandCategory: "Utilities",
  usages: "music <song name>",
  cooldowns: 5,
};

// Search YouTube
async function searchYouTube(keyword) {
  const results = await ytSearch(keyword);
  const videos = results.videos.slice(0, 10); // Get top 10 results
  return videos.map(video => ({
    id: video.videoId,
    title: video.title,
    url: video.url,
    duration: video.timestamp,
    views: video.views,
    channel: video.author.name
  }));
}

// Download Audio
async function downloadAudio(videoUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    });

    const file = fs.createWriteStream(outputPath);
    stream.pipe(file);

    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}

// Command Execution
this.run = async function ({ args, api, event, Users }) {
  const send = (msg, callback) => api.sendMessage(msg, event.threadID, callback, event.messageID);
  if (args.length === 0) return send("❎ Please enter a song name!");

  const keyword = args.join(" ");
  const savePath = `${__dirname}/cache/${event.senderID}.mp3`;

  try {
    let name = await Users.getNameUser(event.senderID);
    const results = await searchYouTube(keyword);

    if (results.length === 0) return send(`❎ No results found for "${keyword}"`);

    let msg = "";
    results.forEach((video, index) => {
      msg += `${index + 1}. ${video.title}\nChannel: ${video.channel}\nDuration: ${video.duration}\nViews: ${video.views}\n\n`;
    });

    send(`🎵 Search Results:\n${msg}\nReply with the number to select a song.`, (err, info) => {
      if (err) return send(`❎ Error: ${err.message}`);
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        results,
        savePath
      });
    });

  } catch (error) {
    send(`❎ Error: ${error.message}`);
  }
};

// Handle Replies
this.handleReply = async function ({ api, event, handleReply: _ }) {
  const send = (msg, callback) => api.sendMessage(msg, event.threadID, callback, event.messageID);

  if (event.senderID !== _.author) return;

  try {
    const startTime = Date.now();
    const index = parseInt(event.body) - 1;
    const video = _.results[index];

    if (!video) return send("❎ Invalid selection!");

    send(`⏳ Downloading "${video.title}"...`);

    // Download Audio
    await downloadAudio(video.url, _.savePath);

    const processTime = Math.floor((Date.now() - startTime) / 1000);

    send({
      body: `🎶 Song Info:\n- Title: ${video.title}\n- Channel: ${video.channel}\n- Duration: ${video.duration}\n- Views: ${video.views}\n- Processed in: ${processTime}s\nEnjoy!`,
      attachment: fs.createReadStream(_.savePath)
    }, () => {
      fs.unlinkSync(_.savePath); // Remove cache file after sending
    });

  } catch (error) {
    send(`❎ Error: ${error.message}`);
  }
};

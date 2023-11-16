var player;
var globalStartTime = 0;
var globalEndTime = null; // Default end time is null
var globalDuration;
var globalPlaybackSpeed = 1;
var playlist = [];

// cd '~/Documents/Music/Tambourine Bay Winds/Library'
// ls -1  *-???????????.mp3 | sed -E 's/\.mp3$//;s/^(.*)-(.{11})$/\1:\2/'
var defaultPlaylist = `
Amparito Roca by Jaime Texidor_arr. James Curnow:R-6OO5JAOMg
Amparito Roca Conducted:4rIHVjJfggg
Asian Folk Rhapsody by Richard L. Saucedo:IVgsQo98lVY
Baba Yetu Conducted:cnU0yIhcGjc
`.split('\n').map(line => line.trim()).filter(line => line != "");
// [
//     'EFEOG4PfkqY:105:220:0.9',
//     '9z-K3yxu9lQ:0::2',
//     'oj6GfEMAi0s'
//     // Add more videos to the playlist as needed
// ];

function onYouTubeIframeAPIReady() {
    console.info("onYouTubeIframeAPIReady")
    // Create the player instance
    // player = new YT.Player('player', {
    //     events: {
    //         'onReady': onPlayerReady,
    //         'onStateChange': onPlayerStateChange
    //     }
    // });
    globalStartTime = 105
    globalEndTime = 220
    player = new YT.Player('player', {
      width: 640,
      height: 480,
      videoId: 'EFEOG4PfkqY',
      playerVars: {
        autoplay: 1,
        start: globalStartTime,
        end: globalEndTime,
      },
      events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
          'onPlaybackRateChange': onPlaybackRateChange,
      }
  });    
}

function initializePlayerFromString(paramsString) {
  console.info("initializePlayerFromString: " + paramsString)
    var paramsArray = paramsString.split(':');
    var title = paramsArray[0];
    var videoId = paramsArray[1];
    var startTime = parseFloat(paramsArray[2]) || 0;
    var endTime = parseFloat(paramsArray[3]) || null;
    var playbackSpeed = parseFloat(paramsArray[4]) || 1;

    updatePlayer(title, videoId, startTime, endTime, playbackSpeed);
}

function updatePlayer(title, videoId, startTime, endTime, playbackSpeed) {
  console.info("updatePlayer")
    // Set defaults if parameters are missing
    globalStartTime = startTime || 0;
    globalEndTime = endTime || null
    globalPlaybackSpeed = playbackSpeed || 1;

    // Update player properties
    var kwargs = {
      videoId: videoId,
      startSeconds: globalStartTime,
      endSeconds: 60
    }
    if (globalEndTime) {
      kwargs["endSeconds"] = globalEndTime
    }
    player.loadVideoById(kwargs);
    $("#title").text(title)
    window.title = title
}

function onPlayerReady(event) {
  console.info("onPlayerReady")

  // Set-up timer for progress update
  startProgressUpdate()

  var playlistElement = $('#playlist');
  var item = playlistElement[0].children[0].getAttribute('data-item')
  initializePlayerFromString(item)
}

function onPlayerStateChange(event) {
  console.info("onPlayerStateChange: " + event.data)
  // switch(event.data) {
  //   case -1:
  //   case YT.PlayerState.CUED:
      globalDuration = player.getDuration()
      globalEndTime = globalEndTime || globalDuration;
      $('#progress-slider').slider("option", "max", globalDuration)
      $("#slider-range").slider("option", "max", globalDuration)
      $("#slider-range").slider('values', [globalStartTime, globalEndTime]);
      player.setPlaybackRate(globalPlaybackSpeed);
  // }
  var currentTime = player.getCurrentTime();
  $("#progress-slider").slider('value', currentTime);
  updateSliders();
}

function setupSliders() {
  console.info("setupSliders")
    $("#slider-range").slider({
        range: true,
        min: 0,
        max: 1,
        step: 0.1,
        values: [globalStartTime, globalEndTime],
        slide: function (event, ui) {
            globalStartTime = ui.values[0];
            globalEndTime = ui.values[1];
            // player.seekTo(globalStartTime, true);
            updateRangeValue();
        },
        // stop: function () {
        //     player.playVideo();
        // }
    });

    $("#speed-slider").slider({
        min: -2, // logarithmic scale: 0.25 to 2
        max: 1,
        step: 0.05,
        value: Math.log2(globalPlaybackSpeed), // initial speed is 1
        slide: function (event, ui) {
            globalPlaybackSpeed = Math.pow(2, ui.value);
            player.setPlaybackRate(globalPlaybackSpeed);
        }
    });

    $("#progress-slider").slider({
        range: "min",
        min: 0,
        max: 1,
        step: 0.1,
        value: 0,
        slide: function (event, ui) {
            player.seekTo(ui.value, true);
        }
    });

}

function updateSliders() {
  console.info("updateSliders")
  updateRangeValue();
  updateProgressValue();
}

function updateRangeValue() {
  console.info("updateRangeValue")
    $('#range-value').text(formatTime(globalStartTime) + ' - ' + formatTime(globalEndTime));
}

function onPlaybackRateChange() {
  console.info("updateSpeedValue")
    globalPlaybackSpeed = player.getPlaybackRate();
    $("#speed-slider").slider('value', Math.log2(globalPlaybackSpeed))
    $('#speed-value').text((globalPlaybackSpeed * 100).toFixed() + '%');
}

function updateProgressValue() {
  console.info("updateProgressValue")
    $('#progress-value').text(formatTime(player.getCurrentTime(), 1) + ' / ' + formatTime(globalDuration));
}

function formatTime(time, dp=0) {
    var minutes = Math.floor(time / 60);
    // var pow = Math.pow(10, dp)
    var seconds = (time % 60).toFixed(dp)
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function startProgressUpdate() {
  console.info("startProgressUpdate")
    setInterval(function () {
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            var currentTime = player.getCurrentTime();
            $('#progress-slider').slider('value', currentTime);
            updateProgressValue();
        }
    }, 250); // Update 1/4 second
}

// Populate the playlist
$(document).ready(function () {
  console.info("ready")

  // Setup sliders after the document is ready
  setupSliders();

  console.info("retrieving playlist")
  $.ajax({
    url: 'playlist.txt', // Adjust the file path as needed
    dataType: 'text',
    success: function (data) {
        // Split the text file content into an array of lines
        var playlist = data.split('\n').map(
          line => line.trim()
        ).filter(
          line => line !== '' && line[0] != '#' && !line.startsWith("title:")
        );
        populatePlaylist(playlist);
        var num = playlist.length
        console.info(`loaded playlist with ${num} items`)
    },
    error: function (error) {
        console.error('Error loading playlist:', error);
        populatePlaylist(defaultPlaylist);
    }
  });


});

function populatePlaylist(playlist) {
  console.info("populatePlaylist")
  var playlistElement = $('#playlist');
  playlist.forEach(function (item, index) {
      var parts = item.split(':')
      var listItem = $('<li>').text(parts[0]).attr('title', parts[1]).attr('data-item', item);
      listItem.on('click', function () {
          initializePlayerFromString(item);
      });
      playlistElement.append(listItem);
  });

  // Load YouTube API
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

}

function allowDrop(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  var data = event.dataTransfer.getData("text");
  var url = data.trim();
  if (url.startsWith("https://www.youtube.com/") || url.startsWith("http://www.youtube.com/")) {
      // Assuming the URL is in the format "https://www.youtube.com/watch?v=VIDEO_ID"
      var urlParams = new URLSearchParams(url.split('?', limit=2)[1]);
      var videoId = urlParams.get('v');
      addToPlaylist(videoId);
  } else {
      console.error("Invalid YouTube URL");
  }
}

function addToPlaylist(videoId) {
  var playlistElement = $('#playlist');
  var listItem = $('<li>').text('Video ' + (playlistElement.children().length + 1)).attr('title', videoId);
  listItem.on('click', function () {
      initializePlayerFromString(videoId + ":0::1");
  });
  playlistElement.append(listItem);

  // If this is the first video added, play it immediately
  if (playlistElement.children().length === 1) {
      initializePlayerFromString(videoId + ":0:null:1");
  }
}

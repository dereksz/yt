var player;
var globalStartTime = 0;
var globalEndTime = null; // Default end time is null
var globalDuration;
var globalPlaybackSpeed = 1;

var playlist = [
    'EFEOG4PfkqY:105:220:0.9',
    '9z-K3yxu9lQ:0::2',
    'your_other_video_id:start_time:end_time:playback_speed'
    // Add more videos to the playlist as needed
];

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
    var videoId = paramsArray[0];
    var startTime = parseFloat(paramsArray[1]) || 0;
    var endTime = parseFloat(paramsArray[2]) || null;
    var playbackSpeed = parseFloat(paramsArray[3]) || 1;

    updatePlayer(videoId, startTime, endTime, playbackSpeed);
}

function updatePlayer(videoId, startTime, endTime, playbackSpeed) {
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
}

function onPlayerReady(event) {
  console.info("onPlayerReady")
    // Update global variables
    startProgressUpdate()
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
        min: -2, // logarithmic scale: 0.25 to 4
        max: 2,
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
    $('#progress-value').text(formatTime(player.getCurrentTime()) + '/' + formatTime(globalDuration));
}

function formatTime(time) {
    var minutes = Math.floor(time / 60);
    var seconds = Math.round(time % 60);
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
    }, 200); // Update every second
}

// Populate the playlist
$(document).ready(function () {
  console.info("ready")
    var playlistElement = $('#playlist');
    playlist.forEach(function (item, index) {
        var listItem = $('<li>').text('Video ' + (index + 1));
        listItem.on('click', function () {
            initializePlayerFromString(item);
        });
        playlistElement.append(listItem);
    });

    // Setup sliders after the document is ready
    setupSliders();
});

// Load YouTube API
var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


function allowDrop(event) {
  event.preventDefault();
}

function handleDrop(event) {
  event.preventDefault();
  var data = event.dataTransfer.getData("text");
  var url = data.trim();
  if (url.startsWith("https://www.youtube.com/") || url.startsWith("http://www.youtube.com/")) {
      // Assuming the URL is in the format "https://www.youtube.com/watch?v=VIDEO_ID"
      var videoId = url.split("v=")[1];
      initializePlayerFromString(videoId + ":0:null:1"); // Default values for start time, end time, and speed
  } else {
      console.error("Invalid YouTube URL");
  }
}
var player;
var globalStartTime = 0;
var globalEndTime = null; // Default end time is null
var globalPlaybackSpeed = 1;

var playlist = [
    'EFEOG4PfkqY:105:220:0.9',
    '9z-K3yxu9lQ:0::1',
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
    player = new YT.Player('player', {
      width: 640,
      height: 480,
      videoId: 'EFEOG4PfkqY',
      playerVars: {
        autoplay: 1,
        start: 105,
        end: 220,
      },
      events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
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
    globalEndTime = endTime 
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

    // Update sliders
    $('#speed-slider').slider('option', 'max', Math.log2(2));
    $('#progress-slider').slider('option', 'max', player.getDuration());

    $("#slider-range").slider('values', [globalStartTime, globalEndTime]);
    $("#speed-slider").slider('value', Math.log2(globalPlaybackSpeed));
}

function onPlayerReady(event) {
  console.info("onPlayerReady")
    // Update global variables
    globalEndTime = globalEndTime || player.getDuration();
    player.setPlaybackRate(globalPlaybackSpeed);
    setupSliders()
    player.playVideo();
}

function onPlayerStateChange(event) {
  console.info("onPlayerStateChange")
    if (event.data === YT.PlayerState.PLAYING) {
        var currentTime = player.getCurrentTime();
        $('#progress-slider').slider('value', currentTime);
        updateProgressValue();
        if (currentTime < globalStartTime || currentTime > globalEndTime) {
            player.seekTo(globalStartTime, true);
        }
    }
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
            player.seekTo(globalStartTime, true);
            updateRangeValue();
        },
        stop: function () {
            player.playVideo();
        }
    });

    $("#speed-slider").slider({
        min: -1, // logarithmic scale: 0.5 to 2
        max: 1,
        step: 0.1,
        value: Math.log2(globalPlaybackSpeed), // initial speed is 1
        slide: function (event, ui) {
            globalPlaybackSpeed = Math.pow(2, ui.value);
            player.setPlaybackRate(globalPlaybackSpeed);
            updateSpeedValue();
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
            updateProgressValue();
        }
    });

}

function updateSliders() {
  console.info("updateSliders")
  updateRangeValue();
  updateSpeedValue();
  updateProgressValue();
}

function updateRangeValue() {
  console.info("updateRangeValue")
    $('#range-value').text(formatTime(globalStartTime) + ' - ' + formatTime(globalEndTime));
    $('#slider-range').slider('option', 'max', globalEndTime);
}

function updateSpeedValue() {
  console.info("updateSpeedValue")
    var speedPercentage = globalPlaybackSpeed * 100;
    $('#speed-value').text(speedPercentage.toFixed() + '%');
}

function updateProgressValue() {
  console.info("updateProgressValue")
    var currentTime = player.getCurrentTime();
    $('#progress-value').text(formatTime(currentTime));
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
    }, 100); // Update every second
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

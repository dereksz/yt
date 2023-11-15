var player;
var globalStartTime = 0;
var globalEndTime = null; // Default end time is null
var globalDuration;
var globalPlaybackSpeed = 1;

// cd '~/Documents/Music/Tambourine Bay Winds/Library'
// ls -1  *-???????????.mp3 | sed -E 's/\.mp3$//;s/^(.*)-(.{11})$/\1:\2/'
var playlist = `
Amparito Roca by Jaime Texidor_arr. James Curnow:R-6OO5JAOMg
Amparito Roca Conducted:4rIHVjJfggg
Asian Folk Rhapsody by Richard L. Saucedo:IVgsQo98lVY
Baba Yetu Conducted:cnU0yIhcGjc
Baba Yetu (from Civilization IV) by Christopher Tin_arr. Johnnie Vinson:-nbMkiO_nY0
Baba Yetu Live _ Cadogan Hall 2016:noneMROp_E8
Baba Yetu Phonetic Lyrics (for English speakers):_Dq4B2Pem0k
Baba Yetu - Stellenbosch University Choir:PCa8RxaOPW8
Bohemian Rhapsody Conducted:ekBl0NGZvBM
Botany Bay flute:NYar7AGEpKA
Down by the Salley Gardens arranged by Michael Sweeney:24joVXNDz4A
Down By the Salley Gardens arranged by Michael Sweeney:9z-K3yxu9lQ
Fanfare for the Third Planet by Richard L. Saucedo:Ebjq4AIhOr8
German Dance - Beethoven:8uY_g5JYRxQ
German Dance (in A Major) [Solo Piano] - Ludwig van Beethoven (1770-1827):_hgN7kT_bwM
Jump, Jive an' Wail by Louis Prima_arr. Johnnie Vinson:Dzh6jAospic
Korean Folk Rhapsody by James Curnow:i1i3FOYGidU
Lincolnshire Posy Movt 1 Conducted:IPMf9KQeo9Q
Louis Prima  - - - - Jump,Jive An' Wail.:aJxoRIjyNlw
Nettleton arranged by Johnnie Vinson:UTKxFG4GXB8
Nettleton arranged by Johnnie Vinson:XDbr9A9rLmw
Robert Schumann -The Merry Peasant:OT4d0EdSFuU
Salvation is Created by Pavel Chesnokov_arr. Michael Brown:BN3x9p138dA
Suite from The Planets Conducted:m7kIipseKmk
The Great Escape (March) arr. Johnnie Vinson:dFjnTCp4PqE
Three Ayres from Gloucester by Hugh M. Stuart_arr. Robert Longfield:0ojD6K_O45s
Three Czech Folk Songs - Johnnie Vinson_ Hal Leonard:EFEOG4PfkqY
Three Czech Folk Songs - Mvmt 2:EFEOG4PfkqY:105:220:0.9
Two Movements from Lincolnshire Posy by Percy Grainger_arr. Michael Sweeney:oj6GfEMAi0s
Valdres (Concert March) by Hanssen_arr. Curnow:kpmPYV5c0QQ
Woody Herman And His Orchestra - The Golden Wedding [La Cinquantaine]:hfejxyi8G2I
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
    var playlistElement = $('#playlist');
    playlist.forEach(function (item, index) {
        var parts = item.split(':')
        var listItem = $('<li>').text(parts[0]).attr('title', parts[1]);
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

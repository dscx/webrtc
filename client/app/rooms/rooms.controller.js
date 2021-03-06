'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, $location, WebRTC, $timeout){

// -------------------- SCOPE VARIABLES -------------------- //
  // the room name
  $scope.room = $location.path().replace('/', '');
  // the main element
  $scope.main = {};
  // list of connected streams
  $scope.sidebarVideos = {links:{}, length:0};
  // timeout that checks for new connections
  $scope.promise = {};
  // keep track of state of users audio/video
  $scope.media = {
    audio: true,
    video: true
  };


// -------------------- SCOPE FUNCTIONS -------------------- //
  // Toggle own video streams
  $scope.toggleMyVideo = function(){
    console.log(WebRTC);
    WebRTC.toggleVideo();
    $scope.media.video = !$scope.media.video;
  };
  // Toggle own audio streams
  $scope.toggleMyAudio = function(){
    WebRTC.toggleAudio();
    $scope.media.audio = !$scope.media.audio;
  };


// -------------------- SCOPE EVENTS -------------------- //
  // when a stream disconnects
  $scope.$on('socket:left', function (ev, data) {
    // find the video element of stream
    var removeVid = angular.element.find('.video.individual[data-pid='+ data.pid +']')[0];
    // remove video
    angular.element(removeVid).remove();
  });

  // when user navigates to a non-existant room
  $scope.$on('socket:invalid-room', function(){
    // go home
    $scope.$destroy();
    $location.path('/');
  });

  // when the user disconnects
  $scope.$on('$destroy', function(){
    // stop polling for changes
    $timeout.cancel($scope.promise);
    // disconnect WebRTC
    WebRTC.destroy();
  });

  // when a sidebar video is clicked
  angular.element('.sidebar-videos').on('click', '.video.individual', function(event){
    // get the clicked source
    var clickSrc = event.target.src;
    var clickMute = event.target.muted;
    // get the main source
    var mainSrc = $scope.main.src;
    var mainMute = $scope.main.muted;
    // swap clicked with main
    $scope.main.src = clickSrc;
    $scope.main.muted = clickMute;
    console.log('Is main muted?', $scope.main.muted);

    event.target.src = mainSrc;
    event.target.muted = mainMute;
    console.log('Is sidebar muted?', event.target.muted);
  });

// -------------------- PRIVATE FUNCTIONS -------------------- //

  // set user stream on the main video
  var setMain = function(){
    // start user stream
    var stream = WebRTC.myStream();
    console.log('stream', stream);
    //using settimeout to wait until user stream is available
    if(stream === null && WebRTC.error.video === undefined){
      $timeout(function(){
        setMain();
      }, 1000);
      
    } else if(stream === null){
      console.log(WebRTC.error);
      $location.path('/');
      
    // when user stream is initialized
    } else {
      // find main video
      $scope.main = angular.element.find('.main')[0];
      $scope.main.muted = "true";
      //from components/socket/adapter.js, attach stream to element
      attachMediaStream($scope.main, stream);
    }
  };

  // set new sidebar videos
  var setSidebar = function(){
    // get saved object of streams 
    var sidebarVideos = $scope.sidebarVideos;
    // get pids of streams
    var keys = Object.keys(sidebarVideos.links);

    // if a new video has been added
    if(keys.length > sidebarVideos.length){
      // find sidebar
      var sidebarElem = angular.element.find('.sidebar-videos')[0];
      // find new videos
      for (var i = sidebarVideos.length; i < keys.length; i++) {
        // get pid of stream
        var pid = keys[i];
        // make a video element with the pid data
        var vidElem = angular.element('<video class="video individual" autoplay data-pid="'+keys[i]+'" ng-click="console.log(\'hi\')"></video>');
        // get stream
        var stream = sidebarVideos.links[pid];
        // append video elemnt to DOM
        angular.element(sidebarElem).append(vidElem);
        // attach stream to video
        attachMediaStream(vidElem[0], stream);
      }
      // number of streams updated
      sidebarVideos.length = keys.length;
    } 
  };

  // check for new videos every second
  var updateStreams = function(){
    // set timeout in variable so we can access it later
    $scope.promise = $timeout(function(){
      // populate streams
      $scope.sidebarVideos.links = WebRTC.getStreams;
      // check if new videos and add if needed
      setSidebar();
      // check again in one second
      updateStreams();
    }, 1000);
  };

// -------------------- START IT ALL OFF -------------------- //
  // Join WebRTC room
  WebRTC.join($scope.room);
  console.log($scope.room);

  // Set main video
  setMain();
  // Set other videos, and check for changes.
  updateStreams();
  
});
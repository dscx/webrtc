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


// -------------------- SCOPE FUNCTIONS -------------------- //
  // Toggle own video streams
  $scope.toggleMyVideo = function(){
    console.log(WebRTC);
    WebRTC.toggleVideo();
  };
  // Toggle own audio streams
  $scope.toggleMyAudio = function(){
    WebRTC.toggleAudio();
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
    var clicked = event.target.src;
    // get the main source
    var main = $scope.main.src;
    // swap clicked with main
    $scope.main.src = clicked;
    event.target.src = main;
  });

// -------------------- PRIVATE FUNCTIONS -------------------- //

  // set user stream on the main video
  var setMain = function(){
    // start user stream
    var stream = WebRTC.myStream();
    //using settimeout to wait until user stream is available
    if(!stream){
      $timeout(function(){
        setMain();
      }, 1000);

    // when user stream is initialized
    } else {
      // find main video
      $scope.main = angular.element.find('.main')[0];

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
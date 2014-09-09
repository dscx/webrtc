'use strict';
angular.module('webrtcApp')
.controller('RoomController', function($scope, $location, WebRTC, $timeout){

  $scope.room = {};
  $scope.room.name = $location.path().replace('/', '');
  $scope.myStream = {};
  $scope.main = {};
  WebRTC.join($scope.room.name);
  //using settimeout to wait until user stream is available
  $scope.setInitial = function(){
    var stream = WebRTC.myStream();
    console.log('stream', stream);
    if(stream === null && WebRTC.error.video === undefined){
      $timeout(function(){
        $scope.setInitial();
      }, 1000);
    } else if(stream === null){
      $location.path('/');
    } else {
      console.log(WebRTC.error);
      $scope.main = stream;
      $scope.myStream = stream;
      //Need access to raw element for cross browser support
      var mainElem = angular.element.find('.main')[0];

      //from components/socket/adapter.js
      attachMediaStream(mainElem, $scope.main);
    }
  };

  $scope.setInitial();
  $scope.sidebarVideos = {links:{}, length:0};
  $scope.setAvideo = function(){
    var keys = Object.keys($scope.sidebarVideos.links);
    // if a new video has been added
    if(keys.length > $scope.sidebarVideos.length){
      // find sidebar
      var sidebarElem = angular.element.find('.sidebar-videos')[0];
      // find new videos
      for (var i = $scope.sidebarVideos.length; i < keys.length; i++) {
        var vidElem = angular.element('<video class="video individual" autoplay data-pid="'+keys[i]+'" ng-click="console.log(\'hi\')"></video>');
        angular.element(sidebarElem).append(vidElem);
        attachMediaStream(vidElem[0], $scope.sidebarVideos.links[keys[i]]);
      }
      $scope.sidebarVideos.length = keys.length;
    } 
  };

  $scope.$on('socket:left', function (ev, data) {
    var removeVid = angular.element.find('.video.individual[data-pid='+ data.pid +']')[0];
    angular.element(removeVid).remove();
  });
  $scope.$on('socket:invalid-room', function(){
    $scope.$destroy();
    $location.path('/');
  });
  $scope.promise = {};
  $scope.updateStreams = function(){
    $scope.promise.update = $timeout(function(){
      $scope.sidebarVideos.links = WebRTC.getStreams;
      $scope.setAvideo();
      $scope.updateStreams();
    }, 1000);
  };


  $scope.updateStreams();

  angular.element('.sidebar-videos').on('click', '.video.individual', function(event){
    var clicked = event.target.src;
    var main = angular.element.find('.video.main')[0].src;
    angular.element.find('.video.main')[0].src = clicked;
    event.target.src = main;
  });

  //Pauses own video streams
  $scope.toggleMyVideo = function(){
    WebRTC.toggleVideo();
  };

  $scope.toggleMyAudio = function(){
    WebRTC.toggleAudio();
  };
  $scope.$on('$destroy', function(){
    $timeout.cancel($scope.promise.update);
    WebRTC.destroy();
  });
  console.log($scope.room.name);

});
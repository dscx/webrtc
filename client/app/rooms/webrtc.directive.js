'use strict';
angular.module('webrtcApp')
.directive('webrtcVideo', function(WebRTC){
  var link = function(scope, element, attrs){
    //The below method defines where the video 
    //is attached on the dom
    //must return the element from the callback
    console.log(scope.supplantMain);
    var createVid = function(){
        var vid = document.createElement('video');
        vid.class="video individual";
        vid.autoplay = true;
        return vid;
      };
  };
  return {
    link:link
  };
});
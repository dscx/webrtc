// 'use strict';
// angular.module('webrtcApp')
// .directive('webrtcVideo', function(WebRTC){
//   var link = function(scope, element, attrs){
//     //The below method defines where the video 
//     //is attached on the dom
//     //must return the element from the callback
//     var createVid = function(){
//         var vid = document.createElement('video');
//         vid.style = 'width:1000px; height:1000px';
//         vid.autoplay = true;
//         return vid;
//       };
//     console.log('set onaddstream');
//     WebRTC.pc.onaddstream= function(stream,vid){
//       var vid = vid || createVid();
//       element.append(vid);
//       console.log('ADDING: ', vid);
//       attachMediaStream(vid, stream);
//     };

//     var vid = createVid();
//     element.append(vid);
//     WebRTC.getMedia(vid);
//     WebRTC.status = true;
//   };
//   return {
//     link:link
//   };
// });
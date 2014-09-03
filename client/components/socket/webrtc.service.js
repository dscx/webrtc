'use strict';

angular.module('webrtcApp')
.factory('RtcSock', function(socketFactory){
  var ioSocket = io('/rooms', {
    path:'/socket.io-client'
  });

  var socket = socketFactory({
    ioSocket:ioSocket
  });

  var offer = function(data, callback){
    socket.emit('offer', data);
    socket.on('answer', function(response){
      console.log('received response'+ response);
      if(response){
        callback(response);
      }
    });
  };
  var setListeners = function(callback){
    socket.on('offer', function(request){
      callback(request, function(answer){
        var response = {
          answer:answer,
          pid:request.pid,
          room:request.room
        };
        console.log('emmiting response', response);
        console.log('request was ', request);
        socket.emit('answer', response);        
      });
    });
  };
  var reqRoom = function(room, callback){
    socket.emit('room', {room: room});
    socket.on('confirm', function(response){
      if(response.participants > 1){
        console.log(response.participants, 'in room sending offers');
        callback();
      }
    });
  };
  return {
    socket:socket,
    offer: offer,
    listen: setListeners,
    reqRoom: reqRoom,
  };
})
.factory('WebRTC', function(RtcSock){
    var stream = {};

    var pc = new RTCPeerConnection({'iceServers':[{'urls':'stun:stun.iptel.org'}]});

    function error(err){
      console.log('ERROR HERE ===>' + err);
    }

    pc.onaddstream = null;

    var initializeCall = function(callback){
      pc.createOffer(function(offer){
        pc.setLocalDescription(new RTCSessionDescription(offer), function(){
          console.log(offer);
          RtcSock.offer(offer, callback);
        }, error);
      }, error);
    };
    var answerOffer = function(received, callback){
      var receivedOffer = received.offer;

      console.log('in answer offer');
      pc.setRemoteDescription(new RTCSessionDescription(receivedOffer), function(){
        console.log('precreate ans');
        pc.createAnswer(function(answer){
          console.log('My answer is:' + answer);
          pc.setLocalDescription(new RTCSessionDescription(answer), function(){
            console.log('setting ans', answer);
            callback(answer);
          }, error);
        }, error);
      }, error);    
    };

    var listen = function(){
        RtcSock.listen(answerOffer);
    };
    var offer = function(){
      initializeCall(function(answer){
        console.log('processing: ', answer);
        pc.setRemoteDescription(new RTCSessionDescription(answer), function(){});
      });
    };
    pc.onnegotiationneeded = function(){
      offer();
    };
    var getMedia = function(elem){
      console.log('Called get media');
      getUserMedia({
        audio:false, 
        video:true,
        requestedMediaTypes:true
      }, function(mediaStream){

        // onaddstream(function(){
        //   var vid = document.createElement('video');
        //   vid.style = "width:1000px; height:1000px";
        //   vid.autoplay = true;
        //   document.body.appendChild(vid);
        //   return vid;
        // });

        pc.onaddstream(mediaStream, elem);

        //local media stream
        console.log('Adding Stream');
        pc.addStream(mediaStream);
        stream = mediaStream;
      }, function(err){
        console.log(err);
      });
    };

    listen();

    return {
      getMedia:getMedia,
      status: false,
      stream:stream,
      connect: function(room){
        console.log('RROM IS', room);
        RtcSock.reqRoom(room, offer);
      },
      pc:pc
    };

});
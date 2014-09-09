'use strict';

angular.module('webrtcApp')
.factory('RtcSock', function(socketFactory){
  var ioSocket = io('/rooms', {
    path:'/socket.io-client'
  });

  var socket = socketFactory({
    ioSocket:ioSocket
  });
  socket.forward('left');
  socket.forward('invalid-room');
  return {
    socket:socket
  };
})
.factory('WebRTC', function(RtcSock, $timeout){
  var room = null;
  //var videoDiv = document.getElementById('videos');
  var contraint = {video:true, audio:true};
  var peers = {};
  var streams = {};
  var myPid;
  var myStream = null;
  var myRTClocal = [];

  var error = {
    codes:['PERMISSION_DENIED', 'NOT_SUPPORTED_ERROR', 'MANDATORY_UNSATISFIED_ERROR']
  };
  function getErrString(err){
    var codes = error.codes;
    for(var i = 0; i < codes.length; i++){
      if(err[codes[i]] !== undefined){
        return codes[i];
      }
    }



    return 'UNKOWN';
  }
  function joinRoom(rm){
    room = rm;
    //Connects to meeting room
    RtcSock.socket.emit('room', {room:room});
  }
  myMedia();
  RtcSock.socket.on('error', function(err){
    trace('SOCK ERROR ===>' + err);
  });

  //Gets own media stream, and appends onto the dom
  var myStreamCounter = 0;
  function myMedia(){
    myStreamCounter++;
    getUserMedia(contraint, function(stream){
      myStream = stream;
      if(hasVideo(stream)){
        trace('created stream' + stream.id);
        myRTClocal[myPid+'id:'+myStreamCounter]=stream;
      }
    }, function(err){
      error.video = getErrString(err);
    });
  }

  //Temporary handler for users with no video stream
  //Sets an error object that the rooms controller will check
  function hasVideo(stream){
    if(stream.getVideoTracks().length < 1){
      error.video = 'No video tracks';
      return false; 
    } else {
      return true;
    }
  }

  function addLocal(pc){
    if(!myStream){
      timeouts.addLocal = $timeout(function(){
        addLocal(pc);
      }, 500);
    } else {
      pc.addStream(myStream);
      pc.haslocal = true;
    }
  }
  //Creates an RTC connection for a point to point connection
  function createRTC(pid){
    //{'iceServers':[{'urls':'stun:stun.iptel.org'}]}
    var pc = new RTCPeerConnection({'iceServers':[{'urls':'stun:stun.iptel.org'}]});
    trace('Created new Peer connection. l:54');
    var gotSDP = false;
    var iceCandidates = [];
    //media(pc,pid);
    addLocal(pc);
    
    //attaches remote stream to dom
    //var elem;
    pc.onaddstream = function(remoteStream){
      //elem = elem|| createElement();
      //trace('Adding RemoteStream', elem);
      //attachMediaStream(elem, remoteStream);
      //if(streams[pid] === undefined){
        console.log('added stream', remoteStream);
        streams[pid] = remoteStream.stream;
      //}
    };
    function setLocalDescription(description){
      pc.setLocalDescription(description);
    }

    function sendAnswer(callback){
      pc.createAnswer(function(description){
        setLocalDescription(description);
        // trace('Sending answer description' + description.sdp);
        callback(description);
      }, trace);
    }

    function sendOffer(callback){
      // !myRTClocal[pid]
      //media(pc, pid);
      if(!pc.haslocal){
        timeouts.hasLocal = $timeout(function(){
          sendOffer(callback);
        },500);
      } else {
        pc.createOffer(function(description){
          setLocalDescription(description);
          // trace('Sending offer description' + description.sdp);
          callback(description);
        }, trace);
      }
    }

    function onOffer(description, callback){
      console.log(description);
      gotSDP = true;
      // trace('setting remote description', description.sdp);
      try{
        pc.setRemoteDescription(new RTCSessionDescription(description), function(success){
          sendAnswer(callback);
        }, function(err){
          trace('ERROR 87 ====>' + err);
        });
      } catch(e){
        trace('e ====>' + e);
      }
    }

    function onAnswer(description){
      gotSDP = true;
      // trace('Received answer' + description.sdp);
      try {
        pc.setRemoteDescription(new RTCSessionDescription(description));
      } catch(e){
        trace('e ======>' + e);
      }
    }

    //Needed to help establish direct connections
    function onLocalIceCandidates(callback){
      pc.onicecandidate = function(event){
        if (event.candidate) {
          callback(event.candidate);
          //remotePeerConnection.addIceCandidate(new RTCIceCandidate(event.candidate));
          // trace("Local ICE candidate: \n" + event.candidate.candidate);
        }
      };
    }

    function onRemoteIceCandidates(candidate){
      if(gotSDP){
        console.log('adding ice');
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        timeouts.hasSDP = $timeout(function(){
          onRemoteIceCandidates(candidate);
        }, 100);
      }
    }
    return {
      pc:pc,
      sendOffer:sendOffer,
      onOffer:onOffer,
      onAnswer:onAnswer,
      onLocalIceCandidates:onLocalIceCandidates,
      onRemoteIceCandidates:onRemoteIceCandidates
    };
  }
  RtcSock.socket.on('connect', function(){
    console.log('Connected to io server');
  });

  //receives participant data from server on confirmation
  RtcSock.socket.on('confirm', function(data){
    myPid = data.pid;
    peers = {};
    //Adding all participant ids to the peers object, with their RTCpeerconnections
    if(data.pids.length > 0){
      var p = data.pids;
      p.forEach(function(v){
        peers[v]= createRTC(v);
      });
    }
    startCall();
    //Add rpc connecion for new participants
    RtcSock.socket.on('new', function(data){
      trace('adding new connection');
      if(myPid !== data.pid){
        peers[data.pid] = createRTC(data.pid);
      }
    });
  });
  //Deletes user RPC connection when they disconnect
  RtcSock.socket.on('left', function(data){
    delete peers[data.pid];
  });

  //Iterates through peers , sending requests for each
  function sendOffers(){
    // trace('sending offers to ' + Object.keys(peers));
    Object.keys(peers).forEach(function(pid){
      var recipient = pid;
      var sender = myPid;
      //Add a media stream to peer connection
      // media(peers[pid].pc);
      peers[pid].onLocalIceCandidates(function(candidate){
        RtcSock.socket.emit('ice', {candidate:candidate, recipient:recipient, sender:myPid, room:room});
      });
      peers[pid].sendOffer(function(offer){
        RtcSock.socket.emit('offer', {offer:offer, sender:sender, recipient:recipient, room:room});
      });
    });
  }


  RtcSock.socket.on('offer', function(data){
      //Adds the new peer if they aren't in the list
    if(!peers[data.sender]){
      peers[data.sender] = createRTC(data.sender);
    }
    var rtc = peers[data.sender];

    //Add a local media stream to the peer connection
    rtc.onLocalIceCandidates(function(candidate){
      RtcSock.socket.emit('ice', {candidate:candidate, sender:myPid, recipient:data.sender, room:room });
    });
    

    console.log(data);
    rtc.onOffer(data.offer, function(ans){
      RtcSock.socket.emit('answer', { answer:ans, sender:myPid, recipient:data.sender, room:room });

      // if(rtc.pc.offerCount === 0){
      //   //rtc.pc.offerCount++;
      //   rtc.sendOffer(function(offer){
      //      RtcSock.socket.emit('offer', {offer:offer, sender:myPid, recipient:data.sender, room:room});
      //   });
      // } else {
      //   rtc.pc.offerCount = 0;
      // }
    });
  });

  RtcSock.socket.on('ice', function(data){
     //Adds the new peer if they aren't in the list
    if(peers[data.sender]){
      var rtc = peers[data.sender];
      rtc.onRemoteIceCandidates(data.candidate);
    }
  });

  RtcSock.socket.on('answer', function(data){
    peers[data.sender].onAnswer(data.answer);
  });






  //Does not trigger above
  function media(pc, pid){
    getUserMedia(contraint, function(localStream){
      pc.addStream(localStream);
      pc.haslocal = true;
      myRTClocal[pid] = localStream;
    }, trace);
  }

  function startCall(){
    trace('Starting call');
    sendOffers();
  }

  function getStreams(){
    return streams;
  }

  function getMyStream(){
    return myStream;
  }

  //The below pauses all streams
  function toggleVideo(){
   Object.keys(myRTClocal).forEach(function(key){
      toggleVideoStream(myRTClocal[key]);
    });
  }

  function toggleAudio(){
    Object.keys(myRTClocal).forEach(function(key){
      toggleAudioStream(myRTClocal[key]);
    });
  }

  //Toggles specific stream
  function toggleAudioStream(stream){
    trace('toggle audio of'+ stream.id);
    try {
    stream.getAudioTracks().forEach(function(track){
      console.log(track);
      track.enabled = !track.enabled;
    });
    } catch(e){
      trace('e ===>'+e);
    }
  }

  function toggleVideoStream(stream){
    trace('toggle video of'+ stream.id);
    stream.getVideoTracks()[0].enabled =
      !(stream.getVideoTracks()[0].enabled);
  }

  function destroy(){
    for(var p in timeouts){
      $timeout.cancel(timeouts[p]);
    }
  }
  return {
    join:joinRoom,
    getStreams:streams,
    start:startCall,
    myStream:getMyStream,
    toggleAudio:toggleAudio,
    toggleVideo:toggleVideo,
    toggleAudioStream:toggleAudioStream,
    toggleVideoStream:toggleVideoStream,
    destroy:destroy
  };
});
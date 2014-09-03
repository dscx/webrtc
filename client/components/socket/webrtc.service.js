'use strict';

angular.module('webrtcApp')
.factory('RtcSock', function(socketFactory){
  var ioSocket = io('/rooms', {
    path:'/socket.io-client'
  });

  var socket = socketFactory({
    ioSocket:ioSocket
  });


  return {
    socket:socket
  };
})
.factory('WebRTC', function(RtcSock){
  var room = 1234;
  var videoDiv = document.getElementById('videos');
  var contraint = {video:true, audio:false};
  var peers = {};
  var myPid;
  RtcSock.socket.on('error', function(err){
    trace('SOCK ERROR ===>' + err);
  });
  //Creates element that stream will be stored in
  function createElement(){
    var elem = document.createElement('video');
    elem.style="height:500px; width:500px";
    elem.autoplay = true;
    elem.addEventListener('loadedmetadata', function(){
      trace("Remote video currentSrc: " + this.currentSrc +
          ", videoWidth: " + this.videoWidth +
          "px,  videoHeight: " + this.videoHeight + "px");
    });
    videoDiv.appendChild(elem);
    return elem;
  }

  //Gets own media stream, and appends onto the dom
  function myMedia(){
    var elem = createElement();
    elem.id = "my-video";
    getUserMedia(contraint, function(stream){
      attachMediaStream(elem, stream);
    }, function(err){
      trace('ERROR: '+err);
    });
  }

  function toggleMyVideo(){
    var elem = document.getElementById('my-video');
    if(elem && elem.tagName === 'VIDEO'){
      elem.remove();
    } else {
      elem && trace('ERROR: Something went wrong if value => '+elem.tagName);
      myMedia();
    }
  }

  function error(err){
    trace('ERROR: '+ err);
  }


  //Creates an RTC connection for a point to point connection
  function createRTC(){
    //{'iceServers':[{'urls':'stun:stun.iptel.org'}]}
    var pc = new RTCPeerConnection({'iceServers':[{'urls':'stun:stun.iptel.org'}]});
    trace('Created new Peer connection. l:54');
    
    //attaches remote stream to dom
    var elem;
    pc.onaddstream = function(remoteStream){
      elem = elem|| createElement();
      trace('Adding RemoteStream', elem);
      attachMediaStream(elem, remoteStream);
    };

    function setLocalDescription(description){
      pc.setLocalDescription(description);
    }

    function sendAnswer(callback){
      pc.createAnswer(function(description){
        setLocalDescription(description);
        trace('Sending answer description' + description.sdp);
        callback(description);
      }, trace);
    }

    function sendOffer(callback){
      pc.createOffer(function(description){
        setLocalDescription(description);
        trace('Sending offer description' + description.sdp);
        callback(description);
      }, trace);
    }

    function onOffer(description, callback){
      console.log(description);
      trace('setting remote description', description.sdp);
      try{
        pc.setRemoteDescription(new RTCSessionDescription(description), function(success){
          trace('from setremote' + success);
          sendAnswer(callback);
        }, function(err){
          trace('ERROR 87 ====>' + err);
        });
      } catch(e){
        trace('e ====>' + e);
      }
      trace('after setting remote description');
    }

    function onAnswer(description){
      trace('Received answer' + description.sdp);
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
          trace("Local ICE candidate: \n" + event.candidate.candidate);
        }
      };
    }

    function onRemoteIceCandidates(candidate){
      pc.addIceCandidate(new RTCIceCandidate(candidate));
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

    //Connects to meeting room
    RtcSock.socket.emit('room', {room:room});
  });

  //receives participant data from server on confirmation
  RtcSock.socket.on('confirm', function(data){
    myPid = data.pid;
    peers = {};
    //Adding all participant ids to the peers object, with their RTCpeerconnections
    if(data.pids.length > 0){
      var p = data.pids;
      p.forEach(function(v){
        peers[v]= createRTC();
      });
    }
    //Add rpc connecion for new participants
    RtcSock.socket.on('new', function(data){
      trace('adding new connection');
      if(myPid !== data.pid){
        peers[data.pid] = createRTC();
      }
    });
  });
  //Deletes user RPC connection when they disconnect
  RtcSock.socket.on('left', function(data){
    delete peers[data.pid];
  });

  //Iterates through peers , sending requests for each
  function sendOffers(){
    trace('sending offers to ' + Object.keys(peers));
    Object.keys(peers).forEach(function(pid){
      var recipient = pid;
      var sender = myPid;
      //Add a media stream to peer connection
      media(peers[pid].pc);
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
      trace('before setting peer');
      peers[data.sender] = createRTC();
      trace('after setting peer');
    }
    var rtc = peers[data.sender];

    //Add a local media stream to the peer connection
    rtc.onLocalIceCandidates(function(candidate){
      RtcSock.socket.emit('ice', {candidate:candidate, sender:myPid, recipient:data.sender, room:room });
    });
    media(rtc.pc);

    console.log(data);
    rtc.onOffer(data.offer, function(ans){
      trace('sending answer', ans);
      RtcSock.socket.emit('answer', { answer:ans, sender:myPid, recipient:data.sender, room:room });
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
  function media(pc){
    getUserMedia(contraint, function(localStream){
      pc.addStream(localStream);
    }, trace);
  }

  function startCall(){
    trace('Starting call');
    sendOffers();
  }
});
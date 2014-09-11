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

  // -------------------- FACTORY VARIABLES -------------------- //
  //initializing variables that will be used throughout factory
  var room = null;

  //specifes what streams will be requested, both keys are required, value true or false
  var contraint = {video:true, audio:true};

  //Contains a pid (participant id) mapping to a an RTCpeerconnection
  var peers = {};

  //Contains a pid mapping to a MediaStream 
  var streams = {};
  var myPid;
  var myStream = null;

  //References to all local streams created via getMedia(). The local user's streams
  var myRTClocal = [];
  var myStreamCounter = 0;

  //Timeouts holds promises for all timeouts that we call in this factory
  var timeouts = {};
  var error = {
    codes:['PERMISSION_DENIED', 'NOT_SUPPORTED_ERROR', 'MANDATORY_UNSATISFIED_ERROR']
  };

  // -------------------- GETUSERMEDIA FUNCTIONS -------------------- //
  myMedia();

  //Gets own media stream, and appends onto the dom
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
  //Used to check if video stream is present on local stream
  function hasVideo(stream){
    if(stream.getVideoTracks().length < 1){
      error.video = 'No video tracks';
      return false; 
    } else {
      return true;
    }
  }

  function getErrString(err){
    var codes = error.codes;
    for(var i = 0; i < codes.length; i++){
      if(err[codes[i]] !== undefined){
        return codes[i];
      }
    }
    return 'UNKNOWN';
  }
 
  RtcSock.socket.on('error', function(err){
    trace('SOCK ERROR ===>' + err);
  });

  // -------------------- RTCPEER HELPER FUNCTIONS -------------------- //

 //Adds local stream to rtcpeerconnection
 //uses timeout to check if there is a local stream available to add
 //blocks the creation of the peer connection until a stream is added
 //The local stream needs to be added before connection with peer can begin
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

  // -------------------- RTCPeerConnection Builder -------------------- //

  //Creates an RTC connection for a point to point connection
  //This can be changed into a factory
  function createRTC(pid){
    var pc = new RTCPeerConnection({'iceServers':[{'urls':'stun:stun.iptel.org'}]});
    trace('Created new Peer connection. l:54');

    //Flag used to check that a remote description is present 
    //on the RTCPeerConnection object 
    var gotSDP = false;
    var iceCandidates = [];

    addLocal(pc);
    
    pc.onaddstream = function(remoteStream){
        console.log('added stream', remoteStream);
        streams[pid] = remoteStream.stream;
    };

    //Sets the sdp for the local user, this needs to happen
    //before offer is sent
    function setLocalDescription(description){
      pc.setLocalDescription(description);
    }

    /*
      Below function order will match webrtc workflow/order 
      for sending offers, and answering offers.

      Note: The callback arguments are there for the signalling
      They allow us to get access to the session description
      and put it on the wire to the server via RtcSock
    */

    // ------ RTCPeerConnection Offers ------//

    //Verifies a local stream is added, if not, waits 
    //Creates an offer with session description info
    //the createOffer function takes a callback, it passes the description
    function sendOffer(callback){
      if(!pc.haslocal){
        timeouts.hasLocal = $timeout(function(){
          sendOffer(callback);
        },500);
      } else {
        pc.createOffer(function(description){
          setLocalDescription(description);

          //Sending the description to the server via RtcSock
          callback(description);
        }, trace);
      }
    }

    //Try/Catch block required for errors due to socket.io providing incorrect
    //error descriptions

    //Accepts description from peer, sets it as the remote description
    function onAnswer(description){
      gotSDP = true;
      // trace('Received answer' + description.sdp);
      try {
        pc.setRemoteDescription(new RTCSessionDescription(description));
      } catch(e){
        trace('e ======>' + e);
      }
    }

    // ------ RTCPeerConnection Answers ------//

    //Similar to onAnswer, this function saves the session description of
    //the remote peer
    function onOffer(description, callback){
      gotSDP = true;
      // trace('setting remote description', description.sdp);
      try{
        pc.setRemoteDescription(new RTCSessionDescription(description), function(success){
          //Sending the description to the server via RtcSock
          sendAnswer(callback);
        }, function(err){
          trace('ERROR 87 ====>' + err);
        });
      } catch(e){
        trace('e ====>' + e);
      }
    }

    //Similar to sendOffer, creates a description and sets its own
    //local description before sending to remote peer
    function sendAnswer(callback){
      pc.createAnswer(function(description){
        setLocalDescription(description);
        // trace('Sending answer description' + description.sdp);
        callback(description);
      }, trace);
    }

    // ------ ICESERVER FUNCTIONS ------//

    /*
      Ice servers are used to find stun / turn servers which facilitate directly connecting
      to peers and traversing through NAT 
    */

    //Negotiates with ice server to find candidates to facilitate connection
    //When a candidate is found, it shares it with the remote peer
    function onLocalIceCandidates(callback){
      pc.onicecandidate = function(event){
        if (event.candidate) {
          callback(event.candidate);
        }
      };
    }

    //Important: Do not add the remote candidates until a remote description
    //has been received by remote peer, this function blocks until remote sdp is
    //received. Then adds the candidate 
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

  // -------------------- SOCKET EVENTS -------------------- //
  // -------- CONNECTION -------- //

  RtcSock.socket.on('connect', function(){
    console.log('Connected to our-meeting server');
  });

  //This function is called in the controller, once a roomHash
  //has been provided
  function joinRoom(rm){
    room = rm;

    //Connects to meeting room
    RtcSock.socket.emit('room', {room:room});
  }

  //Server emits confirm after a room is joined
  //receives participant data from server on confirmation
  //myPid is the local users participant id, it is unique for each user
  RtcSock.socket.on('confirm', function(data){
    myPid = data.pid;
    peers = {};
    
    //Each peer must have their own RTCPeerConnection 
    if(data.pids.length > 0){
      var p = data.pids;
      p.forEach(function(v){
        peers[v]= createRTC(v);
      });
    }

    //Begins sending offers to each peer
    startCall();

    //Below only listens AFTER confirm event has been received
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

  // -------- WEBRTC SIGNALLING -------- //

  /*
    Sender, recipient, room below are not requiered by webrtc.
    They are used to provide an address, so that the server can route to
    the correct peer.
  */

  RtcSock.socket.on('offer', function(data){

    //Adds the new peer if they aren't in the list
    if(!peers[data.sender]){
      peers[data.sender] = createRTC(data.sender);
    }
    var rtc = peers[data.sender];

    //Add a local media stream to the peer connection
    rtc.onLocalIceCandidates(function(candidate){
      RtcSock.socket.emit('ice', {
        candidate:candidate,
        sender:myPid,
        recipient:data.sender,
        room:room
      });
    });
    
    rtc.onOffer(data.offer, function(ans){
      RtcSock.socket.emit('answer', {
        answer:ans, 
        sender:myPid,
        recipient:data.sender,
        room:room
      });
    });
  });

  RtcSock.socket.on('answer', function(data){
    peers[data.sender].onAnswer(data.answer);
  });

  RtcSock.socket.on('ice', function(data){
     //Adds the new peer if they aren't in the list
    if(peers[data.sender]){
      var rtc = peers[data.sender];
      rtc.onRemoteIceCandidates(data.candidate);
    }
  });

  // -------------------- CALL START LOGIC -------------------- //  
  function startCall(){
    trace('Starting call');
    sendOffers();
  }

  //Iterates through peers , sending requests for each
  function sendOffers(){
    // trace('sending offers to ' + Object.keys(peers));
    Object.keys(peers).forEach(function(pid){
      var recipient = pid;
      var sender = myPid;
      //Add a media stream to peer connection
      // media(peers[pid].pc);
      peers[pid].onLocalIceCandidates(function(candidate){
        RtcSock.socket.emit('ice', {
          candidate:candidate,
          recipient:recipient,
          sender:myPid,
          room:room});
      });

      peers[pid].sendOffer(function(offer){
        RtcSock.socket.emit('offer', {
          offer:offer,
          sender:sender,
          recipient:recipient,
          room:room});
      });
    });
  }

  // -------------------- CONTROLLER ONLY FUNCTIONS -------------------- //  
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

  //Cancels all timeouts that are currently running, when the controller
  //is destroyed
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
    destroy:destroy,
    error:error
  };
});
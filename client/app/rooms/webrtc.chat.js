'use strict';

function ChatController($scope, socket) {
  $scope.href = $(location).attr("href");
  $scope.roomNumber = $scope.href.substr($scope.href.lastIndexOf('/') + 1);
  $scope.myUsername = '';
  
  $('.chat-container').mouseover(function() {
    if ($scope.myUsername.length === 0) {
      socket.emit('roomNumber', $scope.roomNumber);
    }
  });

  socket.on('connect', function() {
    socket.socket.reconnect();
    socket.emit('roomNumber', $scope.roomNumber);
  });

  socket.on('message', function(obj) {
    console.log("Chat: Message Received");
    appendMessage(obj.user, obj.text);
  });

  socket.on('user', function(obj) {
    console.log("Chat: User");
    if ($scope.myUsername === "") {
      $scope.myUsername = obj.user;
      console.log($scope.myUsername);
      $('.un').empty();
      $('.un').val($scope.myUsername);
    }
  });

  // changes the username:
  $('.un').on("keyup change", function() {
    $scope.myUsername = this.value;
  });
  
  $('.chat-send-button').on('click', function() {
    console.log("Chat: Submit clicked");
    var message = $('.chat-text').val();
    appendMessage($scope.myUsername, message);
    socket.emit('message', {
      'user': $scope.myUsername,
      'text': message,
      'roomNumber': $scope.roomNumber
    });
    return false;
  });

  function appendMessage(username, message) {
    var previousStyle = $('.messages').children().last().attr('class');
    if (previousStyle === 'styleA') {
      var currentStyle = 'styleB';
    } else {
      var currentStyle = 'styleA';
    }

    var styledMessage = $('<div class="' + currentStyle + '"></div>').append(username + ': ' + message);
    $('.messages').append(styledMessage);

    //scroll to bottom of chat after appending new message:
    $('.messages').scrollTop($('.messages')[0].scrollHeight);
    $('.chat-text').val('');
  };

}


  












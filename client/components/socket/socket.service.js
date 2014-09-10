/* global io */
'use strict';

angular.module('webrtcApp')
  .factory('socket', function(socketFactory, $rootScope) {

    // socket.io now auto-configures its connection when we ommit a connection url

    var ioSocket = io('/chat', {
        path: '/socket.io-client'
      });
      var socket = socketFactory({
        ioSocket: ioSocket
      });

      socket.on('error', function(err){
        console.log('ERROR', err);
      });

    return {
      socket: socket,

      /**
       * Register listeners to sync an array with updates on a model
       *
       * Takes the array we want to sync, the model name that socket updates are sent from,
       * and an optional callback function after new items are updated.
       *
       * @param {String} modelName
       * @param {Array} array
       * @param {Function} cb
       */
       on: function (eventName, callback) {
        socket.on(eventName, function () {  
          var args = arguments;
          $rootScope.$apply(function () {
              callback.apply(socket, args);
            });
          });
        },
        emit: function (eventName, data, callback) {
          socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
              if (callback) {
                callback.apply(socket, args);
              }
            });
          });
        }
    };
  });

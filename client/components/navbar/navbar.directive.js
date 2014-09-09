'use strict';

angular.module('webrtcApp')
  .directive('navBar', function($location, $http){
    function link(scope, element, attr){
      var search = element.find('.room-search');
      search.on('submit', function(e){
        e.preventDefault();
        scope.resetError();
        var room = scope.room.search;
        if(room.length > 1 && room.match(/^[a-z0-9]+$/i)){
          $http.get('/search', {params:{room:room}})
            .success(function(resp){
              if(resp.url){
                $location.path('/'+resp.url);
              } else {
                console.log(resp);
                scope.resetError();
                scope.room.error = !!resp.error;
                scope.room[resp.error] = true;
              }
            });
        }
      });
    }
    return {
      templateUrl:'components/navbar/navbar.html',
      restrict:'EA',
      link:link
    };
  });
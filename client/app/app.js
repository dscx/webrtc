'use strict';

angular.module('webrtcApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    // $httpProvider.interceptors.push('authInterceptor');
  })
//This is not used but will be left for future possibilities
  // .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
  //   return {
  //     // Add authorization token to headers
  //     request: function (config) {
  //       config.headers = config.headers || {};
  //       if ($cookieStore.get('token')) {
  //         config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
  //       }
  //       return config;
  //     },

  //     // Intercept 401s and redirect you to login
  //     responseError: function(response) {
  //       if(response.status === 401) {
  //         $location.path('/login');
  //         // remove any stale tokens
  //         $cookieStore.remove('token');
  //         return $q.reject(response);
  //       }
  //       else {
  //         return $q.reject(response);
  //       }
  //     }
  //   };
  // })

  .run(function ($rootScope, $location) {
    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('socket:invalid-room', function(){
      $location.path('/');
    });
  });
+(function () {
    'use strict';

    var mainModule = angular.module('animateApp', ['ngRoute', 'ngAnimate']);

    mainModule.config(function ($routeProvider) {
        $routeProvider.when("/animate1", {
            templateUrl: "/Animate/Animate1",
            controller:'animate1Ctrl'

        })
        $routeProvider.when("/animate2", {
            templateUrl: "/Animate/Animate2",
            controller:'animate2Ctrl'
        })
    });
    
    mainModule.controller('animate1Ctrl', ['$scope',function ($scope) {
        $scope.welcome = Date.now();
    }])

    mainModule.controller('animate2Ctrl', ['$scope', function ($scope) {
        $scope.welcome = "this is from animate 2 controller";
    }])

})()
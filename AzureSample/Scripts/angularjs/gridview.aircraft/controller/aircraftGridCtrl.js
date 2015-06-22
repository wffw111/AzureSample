
+(function () {
    'use strict';

    var tdbApp = angular.module('AzureSampleApp');

    if (angular.isDefined(tdbApp)) {

        tdbApp.factory('source', ['gridViewData', 'columnData', 'paginationData',
            function (gridViewData, columnData, paginationData) {
                return {
                    gridViewData: gridViewData,
                    columnData: columnData,
                    paginationData: paginationData
                }
            }]);

        tdbApp.controller('aircraftGridCtrl', ['$scope', '$http', 'source', 'globalModalDialog', '$q',
            'preferenceFactory', '$rootScope', 'configurationSer', function ($scope, $http, source,
                globalModalDialog, $q, preferenceFactory, $rootScope, configurationSer) {
                $scope.grid = new source.gridViewData();
                $scope.grid.name = "The Aircraft Grid View";

                $scope.grid.pagination = new source.paginationData({
                    sectionSize: 5,
                    pageSize: 30,
                    currentPage: 1,
                });

                $scope.grid.addConfig.templateUrl = '/Aircraft/AddTemplate';
                $scope.grid.addConfig.title = 'New Aircraft';
                $scope.grid.editConfig.templateUrl = '/Aircraft/EditTemplate';

                //var configSerObj = {
                //    url: window.location.pathname,
                //    targetName: $scope.grid.name,
                //    name: 'Barcode Grid Config',
                //    userEmail: $rootScope.currentUser
                //}
                //$scope.configModel = undefined;

                $scope.grid.configUrl = '/api/Config/AircraftColumn';
                $scope.grid.initialize();

                $scope.rowRightMenu = {
                    menuTemplateUrl: '/RightMenuTemp/GridRowRightMenuTemp',
                }


            }]);

        tdbApp.controller('aircraftAddCtrl', ['$scope', 'generalSer',
            function ($scope, generalSer) {
                $scope.tempUrl = '/Aircraft/EditBodyTemplate';
                $scope.grid.addConfig.title = 'Add New Aircraft';
                $scope.model = {};
                $scope.add = function (callback) {
                    if (angular.isDefined($scope.$parent.add) && angular.isFunction($scope.$parent.add)) {
                        $scope.$parent.add(callback, $scope.model);
                    }
                }
            }]);

        tdbApp.controller('aircraftEditCtrl', ['$scope', 'generalSer',
            function ($scope, generalSer) {
                $scope.tempUrl = '/Aircraft/EditBodyTemplate';
                $scope.grid.editConfig.title = 'Edit Aircraft';
            }])



    }

})()

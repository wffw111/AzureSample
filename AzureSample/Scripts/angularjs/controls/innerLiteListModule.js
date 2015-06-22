+(function () {
    'use strict';

    var innerLiteListModule = angular.module('control.innerLitelist', ['_base']);

    innerLiteListModule.service('liteListItem', function () {
        function liteListItem(data,key) {
            this.selected = false;
            this.data = data;
            if (key) {
                this.ID = data[key];
            }
        }
        return liteListItem;
    })

    innerLiteListModule.service('liteListData', ['$q', '$http', 'liteListItem', function ($q, $http, liteListItem) {
        function liteListData(config) {
            this.dataPool = [];
            this.config = config;
            this.fk = config.fk;
            this.key = config.key;
            this.isTable = config.isTable;
            this.tableHeaders = config.tableHeaders;
            if (config.rowTemplate) {
                this.rowTemplate = config.rowTemplate;
            }
            if(config.listMenuTemplate)
                this.listMenuTemplate = config.listMenuTemplate;
        }

        liteListData.prototype.loadingData = function () {
            var _this = this;
            var deferred = $q.defer();
            var fk = _this.fk;
            var key = _this.key;
            if (angular.isDefined(fk)) {
                var url = _this.config.dataSource.get +
                    (fk ? ("(" + fk + ")/" + _this.config.queryItemsName) : "");
                if (_this.config.expandQuery && _this.config.expandQuery.get) {
                    if (url.indexOf('?') == -1) {
                        url += '?' + _this.config.expandQuery.get;
                    }
                    else {
                        url += '&' + _this.config.expandQuery.get;
                    }
                }
                $http.get(url).then(function (response) {
                    if (response.data && response.data.value) {
                        _this.dataPool = [];
                        if (angular.isArray(response.data.value) && response.data.value.length > 0) {
                            angular.forEach(response.data.value, function (obj, index) {
                                var item = new liteListItem(obj,key);
                                _this.dataPool.push(item);
                            });
                        }
                        deferred.resolve();
                    }
                }, function (reject) {
                    deferred.reject(reject);
                });
            }
            return deferred.promise;
        }

        liteListData.prototype.toggleSelected = function (item, event) {
            var _this = this;
            if (item.selected == true) {
                item.selected = false;
            }
            else {
                angular.forEach(_this.dataPool, function (obj, index) {
                    if (item === obj) {
                        item.selected = true;
                    }
                    else {
                        obj.selected = false;
                    }
                })
            }
        }

        liteListData.prototype.unSelectAll = function () {
            var _this = this;
            angular.forEach(_this.dataPool, function (obj, index) {
                obj.selected = false;
            })
        }

        liteListData.prototype.initialize = function () {
            var _this = this;
            _this.loadingData();
        }

        return liteListData;
    }])

    innerLiteListModule.directive('innerLiteList', function () {
        return {
            restrict: 'AE',
            templateUrl: '/AgControlTemp/LiteListAG',
            link: function (scope, element, attrs) {
            }
        }
    })

    innerLiteListModule.directive('liteListItem', function () {
        return {
            restrcit: 'AE',
            scope: true,
            template: '<div ng-include="getTemplate()"></div>',
            link: function (scope, element, attrs) {
                scope.getTemplate = function () {
                    if (angular.isDefined(attrs.itemTemplate)) {
                        return attrs.itemTemplate;
                    }
                }
            }
        }
    })

    innerLiteListModule.directive('liteListRow', function () {
        return {
            restrcit: 'AE',
            scope: true,
            replace: true,
            template: '<tr ng-include="getTemplate()"></tr>',
            link: function (scope, element, attrs) {
                scope.getTemplate = function () {
                    if (angular.isDefined(attrs.itemTemplate)) {
                        return attrs.itemTemplate;
                    }
                }
                //scope.toggleSelected = function (item) {
                //    if (angular.isDefined(item)) {
                //        item.selected = !item.selected;
                //    }
                //}
            }
        }
    })

})()
+(function () {
    'use strict';

    var multiSelectionDropdownModule = angular.module('control.multiSelectionDropdown', []);

    multiSelectionDropdownModule.service('multiDropdownData', function () {
        function dropdownData(data, selected) {
            this.selected = selected || false;
            this.data = data;
        }
        return dropdownData;
    })

    multiSelectionDropdownModule.directive('multiDropdown', ['multiDropdownData', '$http', '$q', 'globalFocusItem', 'generalSer',
        function (multiDropdownData, $http, $q, globalFocusItem, generalSer) {
        return {
            restrict: 'AE',
            scope: {
                models: '=',
                resourceModel:'=',
                loadingUrl: '=',
                loadingMethod:'=',
                valueKey: '=',
                textKey: '=',
            },
            templateUrl: '/AgControlTemp/MultiSelectionDropDown',
            link: function (scope, element, attrs) {
                scope.dataPool = [];
                scope.panelActive = false;
                scope.searchKey = '';
                scope.tempModel = [];
                scope.showSelect = false;
                scope.showText = 'All';

                scope.optionFilter = function () {
                    return function (item) {
                        if (scope.showSelect) {
                            if (!item.selected)
                                return false;
                        }
                        if (!angular.isDefined(scope.searchKey) || scope.searchKey == '')
                            return true;
                        if (angular.isDefined(item.data && angular.isDefined(item.data[scope.textKey]))
                            && item.data[scope.textKey] != null) {
                            return item.data[scope.textKey].toLowerCase().indexOf(scope.searchKey.toLowerCase()) >= 0;
                        }
                    }
                }

                scope.toggleDropPanel = function (e, show) {
                    if (angular.isDefined(e)) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    if (angular.isDefined(show)) {
                        scope.panelActive = show;
                    }
                    else {
                        scope.panelActive = !scope.panelActive;
                    }
                    if (scope.panelActive) {
                        var focusItem = {
                            close: function () {
                                scope.panelActive = false;
                                if (scope.searchKey)
                                    scope.searchKey = '';
                            },
                            element: element
                        }
                        globalFocusItem.register(focusItem);
                    }
                    else {
                        globalFocusItem.close(element);
                    }
                }

                element.on('click', '.drop-panel', function (e) {
                    e.stopPropagation();
                })
                
                scope.toggleSelection = function (e, item) {
                    if (angular.isDefined(e)) {
                        if (e.stopPropagation)
                            e.stopPropagation();
                    }
                    if (angular.isDefined(item)) {
                        if (angular.isDefined(item.selected)) {
                            item.selected = !item.selected;
                        }
                        else {
                            item.selected = true;
                        }

                    }
                }
                scope.selectAll = function () {
                    angular.forEach(scope.dataPool, function (obj, index) {
                        obj.selected = true;
                    })
                }
                scope.clearAll = function () {
                    angular.forEach(scope.dataPool, function (obj, index) {
                        obj.selected = false;
                    })
                }
                scope.toggleShowSelect = function () {
                    scope.showSelect = !scope.showSelect;
                    scope.showText = scope.showSelect ? 'Selected' : 'All';
                }

                scope.close = function () {
                    scope.toggleDropPanel(undefined, false);
                }

                scope.removeSearchKey = function () {
                    scope.searchKey = '';
                }

                scope.selectItemCount = function () {
                    var count = 0;
                    angular.forEach(scope.dataPool, function (obj, index) {
                        if (obj.selected) {
                            count += 1;
                        }
                    })
                    if (count > 0) {
                        if (count < scope.dataPool.length) {
                            var descripton = '';
                            if (count == 1)
                                descripton = ' item selected';
                            else
                                descripton = ' items selected'
                            return count + descripton;
                        }
                        else
                            return 'All ' + count + ' items selected'
                    }
                    else {
                        return 'no item selected'
                    }
                }

                scope.$watch('dataPool', function (nVal, oVal) {
                    if (nVal === oVal)
                        return;
                    if (nVal === scope.tempModel) {
                        scope.tempModel = [];
                    }
                    else {
                        var selectedOptions = generalSer.findObject('selected', true, scope.dataPool);
                        scope.tempModel = [];
                        if (selectedOptions) {
                            angular.forEach(selectedOptions, function (obj, index) {
                                scope.tempModel.push(obj.data);
                            })
                        }
                        scope.models = scope.tempModel;
                    }
                }, true);

                scope.$watch('models', function (nVal, oVal) {
                    if (nVal === oVal) {
                        return;
                    }
                    if (nVal === scope.tempModel) {
                        scope.tempModel = [];
                    }
                    else {
                        angular.forEach(scope.dataPool, function (obj, index) {
                            obj.selected = false;
                        })
                        scope.tempModel = scope.dataPool;
                        angular.forEach(nVal, function (obj, index) {
                            for (var i = 0; i < scope.tempModel.length; i++) {
                                if (obj[scope.valueKey] === scope.tempModel[i].data[scope.valueKey]) {
                                    scope.tempModel[i].selected = true;
                                    break;
                                }
                            }
                        })
                    }
                }, true)

                scope.$watch('loadingUrl', function (nVal, oVal) {
                    if (nVal === oVal)
                        return;
                    initialize();
                });

                initialize();

                function initialize() {
                    if (angular.isDefined(scope.loadingUrl)) {
                        $http({
                            method: scope.loadingMethod || 'GET',
                            url: scope.loadingUrl,
                        }).then(function (response) {
                            if (response.data && response.data.value) {
                                if (Array.isArray(response.data.value)) {
                                    initializeModel(response.data.value);
                                }
                            }
                        })
                    }
                    else if (angular.isDefined(scope.resourceModel)) {
                        initializeModel(scope.resourceModel);
                        //scope.$watch('resourceModel', function (nVal, oVal) {
                        //    if(Array.isArray(nVal) && nVal.length >0)

                        //},true)
                    }
                }

                function initializeModel(models) {
                    if (scope.dataPool.length > 0) {
                        scope.dataPool = [];
                    }
                    angular.forEach(models, function (obj, index) {
                        var wrapData = new multiDropdownData(obj);
                        scope.dataPool.push(wrapData);
                    });
                    var bindModelKey = '';
                    if (angular.isDefined(attrs.bindModelKey)) {
                        bindModelKey = attrs.bindModelKey;
                    }
                    angular.forEach(scope.models, function (obj, index) {
                        for (var i = 0; i < scope.dataPool.length; i++) {
                            if (bindModelKey) {
                                if (obj[bindModelKey] === scope.dataPool[i].data[scope.valueKey] ||
                                    obj[bindModelKey] === scope.dataPool[i].data[scope.textKey]) {
                                    scope.dataPool[i].selected = true;
                                    break;
                                }
                            }
                            else {
                                if (obj[scope.valueKey] === scope.dataPool[i].data[scope.valueKey] ||
                                obj[scope.textKey] === scope.dataPool[i].data[scope.textKey]) {
                                    scope.dataPool[i].selected = true;
                                    break;
                                }
                            }
                        }
                    })
                }
            }
        }
    }])

})()
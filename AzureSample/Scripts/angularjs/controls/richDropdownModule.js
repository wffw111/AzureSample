+(function () {
    'use strict';

    var richDropdownModule = angular.module('control.richDropdown', []);

    richDropdownModule.service('filterService', ['dataApi', '$q', function (dataApi, $q) {
        function loadExaminer(scope) {
            return scope.totalItems <= scope.pageSize && scope.searchKey.length > scope.previousSearchKey.length &&
                scope.searchKey.indexOf(scope.previousSearchKey) == 0;
        }

        return function (scope) {
            var deferred = $q.defer();
            if (scope.loadOnceOnly || loadExaminer(scope)) {
                if (angular.isArray(scope.dataPool)) {
                    if (angular.isDefined(scope.searchKey) && scope.searchKey != '') {
                        var returnData = [];
                        angular.forEach(scope.dataPool, function (d, index) {
                            var compareValue = d[scope.textKey];
                            if (angular.isDefined(compareValue)) {
                                if (compareValue.toLowerCase()
                                    .indexOf(scope.searchKey.toLowerCase()) == 0) {
                                    returnData.push(d);
                                }
                            }
                        })
                        //return returnData;
                        deferred.resolve(returnData);
                    }
                    else
                        deferred.resolve(scope.dataPool);
                }
                else
                    deferred.reject();
            }
            else if (scope.loadOnceOnly == false || !angular.isDefined(scope.loadOnceOnly)) {
                if (angular.isDefined(scope.searchKey)) {
                    dataApi.load(scope).then(function () {
                        deferred.resolve(scope.dataPool);
                    })
                }
            }
            scope.previousSearchKey = scope.searchKey;
            return deferred.promise;
        }
    }])

    richDropdownModule.factory('dataApi', ['$http', '$q', function ($http, $q) {
        return {
            load: function (scope, addPage) {
                var deferred = $q.defer();
                if (!scope.loading) {
                    scope.loading = true;
                    if (addPage) {
                        scope.currentPage += 1;
                    }
                    else {
                        scope.currentPage = 1;
                    }
                    var url = this.assembleOdataDefaultQuery(scope);
                    $http({
                        method: scope.loadMethod,
                        url: url
                    }).then(function (response) {
                        if (response.data) {
                            if (angular.isDefined(response.data['odata.count'])) {
                                var newTotalItem = parseInt(response.data['odata.count']);
                                if (isNaN(newTotalItem))
                                    scope.totalItems = undefined;
                                else {
                                    scope.totalItems = newTotalItem;
                                }
                                if (!angular.isDefined(scope.loadOnceOnly)) {
                                    if (angular.isDefined(scope.totalItems)) {
                                        if (scope.totalItems > scope.pageSize)
                                            scope.loadOnceOnly = false
                                        else
                                            scope.loadOnceOnly = true;
                                    }
                                    else {
                                        scope.loadOnceOnly = true;
                                    }
                                }
                            }
                            else {
                                scope.totalItems = undefined;
                                scope.loadOnceOnly = true;
                            }
                            if (angular.isDefined(response.data.value)
                                && angular.isArray(response.data.value)) {
                                if (scope.currentPage == 1) {
                                    scope.dataPool = response.data.value;
                                }

                                else {
                                    angular.forEach(response.data.value, function (obj, index) {
                                        scope.dataPool.push(obj);
                                    })
                                }
                                //scope.dataFilterPool = scope.dataPool;
                            }
                        }
                        deferred.resolve();
                    }, function (error) {
                        deferred.reject(error);
                    }).finally(function () {
                        scope.loading = false;
                    });
                }
                //}
                return deferred.promise;
            },
            getSingleItem: function (scope, value) {
                var _this = this;
                var deferred = $q.defer();
                if (!angular.isDefined(value) || value == null) {
                    deferred.reject();
                }
                else {
                    var url = '';
                    if (scope.loadingUrl) {
                        url = '/odata' + scope.loadingUrl
                        + '(' + value + ')';
                    }
                    else
                        deferred.reject();
                    $http({
                        method: scope.loadMethod,
                        url:url
                    }).then(function (response) {
                        if (response.data) {
                            var data = _this.clearSingleItem(response.data);
                            if (angular.isDefined(data))
                                deferred.resolve(data);
                            else
                                deferred.reject();
                        }
                    }, function (error) {
                        deferred.reject(error);
                    });
                }

                return deferred.promise;
            },
            createItem: function (scope, item) {
                var _this = this;
                var deferred = $q.defer();
                if (angular.isDefined(item)) {
                    var url = '';
                    if (scope.creatingUrl) {
                        url = '/odata' + scope.creatingUrl;
                        $http.post(url, item).then(function (response) {
                            if (response.data) {
                                var data = _this.clearSingleItem(response.data);
                                if (angular.isDefined(data))
                                    deferred.resolve(data);
                                else
                                    deferred.reject();
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                    else
                        deferred.reject();
                }
                return deferred.promise;
            },
            editItem: function (scope, item) {
                var _this = this;
                var deferred = $q.defer();

            },
            assembleOdataDefaultQuery: function (scope) {
                var url = '';
                if (scope.loadingUrl) {
                    url = '/odata' + scope.loadingUrl
                    + '?$inlinecount=allpages';

                    var filterQuery = ''
                    if (angular.isDefined(scope.searchKey) && scope.searchKey != '') {
                        filterQuery = '&$filter=startswith(' + scope.textKey + ',\'' + scope.searchKey + '\')'
                    }
                    if (filterQuery) {
                        url += filterQuery + ' and ' + scope.textKey + ' ne null&$orderby=' +
                        scope.textKey + '&$top=' + scope.pageSize
                    }
                    else {
                        url += '&$filter=' + scope.textKey + ' ne null&$orderby=' +
                        scope.textKey + '&$top=' + scope.pageSize
                    }

                    if (angular.isDefined(scope.totalItems)) {
                        var totalPage = scope.getTotalPages();
                        if (scope.currentPage <= totalPage && scope.currentPage > 0) {
                            url += '&$skip=' + ((scope.currentPage - 1) * scope.pageSize);
                        }
                    }
                }
                return url;
            },
            clearSingleItem: function (data) {
                if (typeof data == 'object' && !angular.isArray(data)) {
                    if (data.hasOwnProperty('odata.metadata')) {
                        delete data['odata.metadata'];
                    }
                    return data;
                }
            }
        }
    }])

    richDropdownModule.directive('richDropdown', ['globalFocusItem', '$q', 'dataApi', 'filterService', 'generalSer',
        function (globalFocusItem, $q, dataApi, filterService, generalSer) {
            //#region private method


            function initialize(scope, initialVale) {
                return filterService(scope).then(function (data) {
                    //scope.dataFilterPool = data;
                    return findSelectedItem(scope, initialVale);
                })
            }

            function findSelectedItem(scope, value) {
                var deferred = $q.defer();
                if (angular.isDefined(value) && value != '') {
                    if (scope.dataPool.length > 0) {
                        var obj = generalSer.findObject(scope.valueKey, value, scope.dataPool);
                        if (angular.isDefined(obj) && obj.length > 0) {
                            scope.selectedItem = obj[0];
                            deferred.resolve();
                        }
                        else {
                            dataApi.getSingleItem(scope, value).then(function (data) {
                                scope.selectedItem = data;
                                deferred.resolve();
                            }, function () {
                                scope.selectedItem = undefined;
                                deferred.reject();
                            })
                        }
                    }
                    else {
                        dataApi.getSingleItem(scope, value).then(function (data) {
                            scope.selectedItem = data;
                            deferred.resolve();
                        }, function () {
                            scope.selectedItem = undefined;
                            deferred.reject();
                        })
                    }
                }
                else
                    deferred.reject();
                return deferred.promise;
            }
            //#endregion

            return {
                restrict: 'AE',
                templateUrl: '/AGControlTemp/RichDropDown',
                scope: {
                    bindTarget: '=',
                    reInitialize: '='
                },
                link: function (scope, element, attrs) {

                    //#region initialize key and text
                    scope.valueKey = attrs.valueKey;
                    scope.textKey = attrs.textKey;
                    if (!scope.valueKey || !scope.textKey)
                        return;
                    scope.name = attrs.name;

                    //#endregion

                    //#region initialize scope properties
                    scope.pageSize = 50,
                    scope.dataPool = [],
                    scope.dataFilterPool = [],
                    scope.pancelActive = false,
                    scope.menuActive = false,
                    scope.totalItems = undefined,
                    scope.currentPage = 1,
                    scope.getTotalPages = function () {
                        if (angular.isDefined(scope.totalItems)) {
                            var result;
                            if (scope.totalItems % scope.pageSize > 0)
                                result = scope.totalItems == 0 ? 0 : parseInt(scope.totalItems / scope.pageSize) + 1;
                            else {
                                result = scope.totalItems == 0 ? 0 : parseInt(scope.totalItems / scope.pageSize);
                            }
                            return result;
                        }
                    }
                    scope.selectedItem = undefined;
                    scope.previousTop = 0;
                    scope.searchKey = '';
                    scope.previousSearchKey = '';
                    scope.loadOnceOnly = undefined;
                    scope.needAdjustSelectItemPos = false;
                    scope.locker = false;


                    var menuPanelSelector = '.drop-menu-wrapper .panel';
                    var dropPanel = element.find('.drop-panel');
                    var dropPanelBody = element.find('.drop-panel-body');
                    var textInput = element.find('input[type="text"]');
                    var textLabel = element.find('.input-content-label');
                    var listItemSelector = '.list-group-item';

                    if (angular.isDefined(attrs.creatingTemplateUrl)) {
                        scope.bodyTempUrl = attrs.creatingTemplateUrl;
                    }
                    if (angular.isDefined(attrs.creatingUrl)) {
                        scope.creatingUrl = attrs.creatingUrl
                        scope.forms = {};
                    }
                    if (angular.isDefined(attrs.loadingUrl)) {
                        scope.loadingUrl = attrs.loadingUrl;
                    }
                    if (angular.isDefined(attrs.loadingMethod)) {
                        scope.loadMethod = attrs.loadingMethod
                    }
                    else {
                        scope.loadMethod = 'GET';
                    }

                    if (angular.isDefined(scope.reInitialize)) {
                        scope.$watch('reInitialize', function (nVal, oVal) {
                            initialize(scope, scope.bindTarget);
                        });
                    }

                    scope.modalPanelUrl = '/AgControlTemp/RichDropDownModalPanel'

                    //#endregion

                    //#region watch section

                    scope.$watch('selectedItem', function (nVal, oVal) {
                        if (nVal === oVal) {
                            return;
                        }
                        if (scope.panelActive)
                            adjustSelectedElement(nVal, oVal);

                        if (angular.isDefined(nVal) && nVal != null) {
                            if (!scope.hasOwnProperty('bindTarget')) {
                                scope.bindTarget = undefined;
                            }
                            if (scope.bindTarget != nVal[scope.valueKey]) {
                                scope.bindTarget = nVal[scope.valueKey];
                                //console.log(scope.bindTarget);
                            }
                        }
                        else {
                            scope.bindTarget = undefined;
                        }
                    })

                    scope.$watch('searchKey', function (nVal, oVal) {
                        if (nVal === oVal)
                            return;
                        if (scope.panelActive) {
                            filterService(scope).then(function (data) {
                                scope.dataFilterPool = data;
                            })
                        }
                    })

                    scope.$watch('bindTarget', function (nVal, oVal) {
                        if (nVal === oVal)
                            return;
                        if (!angular.isDefined(nVal))
                            return;
                        if (angular.isDefined(scope.selectedItem)) {
                            if (nVal != scope.selectedItem[scope.valueKey]) {
                                findSelectedItem(scope, nVal).then(function () {
                                    //console.log(nVal);
                                })
                            }
                        }
                        else {
                            findSelectedItem(scope, nVal).then(function () {
                                //console.log(nVal);
                            })
                        }
                    })

                    //#endregion

                    scope.chooseItem = function (item) {
                        scope.selectedItem = item;
                    }

                    scope.arrowKeySelectItem = function (keyNo) {
                        if (keyNo == 38) {
                            if (angular.isDefined(scope.selectedItem)) {
                                var index = scope.dataFilterPool.indexOf(scope.selectedItem);
                                if (index > 0) {
                                    scope.selectedItem = scope.dataFilterPool[index - 1];
                                }
                            }
                        }
                        else if (keyNo = 40) {
                            if (angular.isDefined(scope.selectedItem)) {
                                var index = scope.dataFilterPool.indexOf(scope.selectedItem);
                                if (index < scope.dataFilterPool.length - 1) {
                                    scope.selectedItem = scope.dataFilterPool[index + 1];
                                }
                            }
                            else {
                                if (scope.dataFilterPool.length > 0) {
                                    scope.selectedItem = scope.dataFilterPool[0];
                                }
                            }
                        }
                    }

                    scope.toggleDropPanel = function (e, show) {
                        if (angular.isDefined(e)) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        if (!angular.isDefined(show)) {
                            show = !scope.panelActive
                        }
                        if (show) {
                            var focusItem = {
                                close: function () {
                                    scope.panelActive = false;
                                    if (angular.isDefined(scope.loadOnceOnly)) {
                                        if (!scope.loadOnceOnly) {
                                            scope.dataPool = [];
                                            scope.dataFilterPool = [];
                                            scope.totalItems = 0;
                                            scope.currentPage = 1;
                                        }
                                        else {
                                            scope.dataFilterPool = [];
                                        }
                                    }

                                    if (scope.searchKey)
                                        scope.searchKey = '';
                                    scope.previousTop = 0;
                                },
                                element: dropPanel
                            }
                            globalFocusItem.register(focusItem);
                            scope.panelActive = true;

                            filterService(scope).then(function (data) {
                                scope.needAdjustSelectItemPos = true;
                                scope.dataFilterPool = data;
                                if (angular.isDefined(scope.selectedItem)) {
                                    var index = generalSer.findObjectIndex(scope.valueKey,
                                        scope.selectedItem[scope.valueKey], scope.dataFilterPool);
                                    if (index < 0) {
                                        scope.dataFilterPool.unshift(scope.selectedItem);
                                    }
                                }
                                textInput.focus();

                            })
                            if (scope.loadOnceOnly == true) {
                                scope.needAdjustSelectItemPos = true;
                            }
                        }
                        else {
                            //if (angular.isDefined(globalFocusItem.currentMenu) &&
                            //    globalFocusItem.currentMenu.element === element) {
                            globalFocusItem.close();
                            //}
                        }
                    }

                    scope.preventBlur = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    scope.toggleMenuActive = function (e, show) {
                        if (angular.isDefined(e)) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        if (!angular.isDefined(show)) {
                            show = !scope.menuActive
                        }
                        var dropMenu = element.find('.drop-menu-wrapper').first();
                        if (show) {

                            var focusItem = {
                                close: function () {
                                    scope.menuActive = false;
                                    if (scope.forms.richDropDownForm) {
                                        scope.forms.richDropDownForm.$setPristine();
                                    }
                                },
                                element: dropMenu
                            }
                            globalFocusItem.register(focusItem);
                            scope.menuActive = true;
                        }
                        else {
                            globalFocusItem.close();
                            //}
                        }
                    }

                    if (scope.creatingUrl) {
                        scope.newItem = {};
                        scope.creatingMenuSubmit = function (e, callback) {
                            if (angular.isDefined(e))
                                e.preventDefault();
                            dataApi.createItem(scope, scope.newItem).then(function (data) {
                                scope.selectedItem = data;
                                scope.newItem = {};
                                if (callback && typeof callback === 'function')
                                    callback();
                            })
                        }
                    }

                    dropPanelBody.on('scroll', function (e) {
                        var scrollTop = dropPanelBody[0].scrollTop;
                        if (scope.previousTop >= scrollTop)
                            return;
                        var clientHeight = dropPanelBody[0].clientHeight;
                        var scrollHeight = dropPanelBody[0].scrollHeight;
                        scope.previousTop = scrollTop;
                        if (clientHeight + scrollTop >= scrollHeight - 100) {
                            scope.bottomloadData();
                        }
                    })
                    //#endregion

                    //#region keyboard event handle

                    scope.keyDownHandler = function (e) {
                        switch (e.which) {
                            case 9: case 16: case 17: case 18: case 20: case 27: case 13:
                                return;
                            case 40: case 38:
                                scope.arrowKeySelectItem(e.which);
                                break;
                            default:
                                if (!scope.panelActive) {
                                    scope.toggleDropPanel(undefined, true);
                                }
                                scope.selectedItem = undefined;
                        }
                    }

                    scope.keyUpHanlder = function (e) {
                        switch (e.which) {
                            case 9: case 16: case 17: case 18: case 20: case 13:
                                return;
                            case 27:
                                return;
                            case 46:
                                scope.searchKey = '';
                            default:
                                break;
                        }
                    }

                    //#endregion

                    scope.bottomloadData = function (e) {
                        if (e) {
                            e.stopPropagation();
                        }
                        if (scope.currentPage < scope.getTotalPages()) {
                            dataApi.load(scope, true);
                        }
                    }
                    //scope.loadData();

                    scope.$on('onRepeatLast', function () {
                        if (scope.needAdjustSelectItemPos) {
                            adjustSelectedElement(scope.selectedItem);
                            scope.needAdjustSelectItemPos = false;
                        }
                    })

                    if (angular.isDefined(scope.bindTarget) && scope.bindTarget != null) {
                        initialize(scope, scope.bindTarget);
                    }

                    scope.changeHeight = function () {
                        if (scope.dataFilterPool.length <= 0) {
                            return 0;
                        }
                    }

                    //#region private method
                    function adjustSelectedElement(item, oItem) {
                        var index = -1, oIndex = -1;
                        if (angular.isDefined(item))
                            index = generalSer.findObjectIndex(scope.valueKey, item[scope.valueKey], scope.dataFilterPool);
                        if (angular.isDefined(oItem))
                            oIndex = generalSer.findObjectIndex(scope.valueKey, oItem[scope.valueKey], scope.dataFilterPool);
                        if (index >= 0) {
                            if (scope.loadOnceOnly && oIndex == -1) {
                                var elements = dropPanelBody.find(listItemSelector + '.selected');
                                elements.removeClass('selected');
                            }
                            else if (oIndex >= 0) {
                                var previouseElement = dropPanelBody.find(listItemSelector).eq(oIndex);
                                previouseElement.removeClass('selected');
                            }

                            var selectedElement = dropPanelBody.find(listItemSelector).eq(index);
                            selectedElement.addClass('selected');

                            if (selectedElement) {
                                var top = selectedElement.position().top;
                                var height = selectedElement.outerHeight();
                                var scrollTop = dropPanelBody.scrollTop();
                                var clientHeight = dropPanelBody[0].clientHeight;
                                if (top + height > clientHeight) {
                                    var diff = top + scrollTop + height - clientHeight;
                                    dropPanelBody.scrollTop(diff);
                                }
                                else if (top < 0) {
                                    var diff = scrollTop + top;
                                    dropPanelBody.scrollTop(diff);
                                }
                            }
                        }
                    }

                    //#endregion


                }
            }
        }])

    richDropdownModule.directive('richLabel', ['$http', function ($http) {
        return {
            restrict: 'AE',
            scope: {
                bindTarget: '=',
                loadingMethod: '@'
            },
            template: '<span class="rf-label">{{text}}</span>',
            link: function (scope, element, attrs) {

                if (angular.isDefined(attrs.loadingUrl)) {
                    scope.loadingUrl = attrs.loadingUrl;
                }
                if (angular.isDefined(attrs.valueKey)) {
                    scope.valueKey = attrs.valueKey;
                }
                if (angular.isDefined(attrs.textKey)) {
                    scope.textKey = attrs.textKey;
                }
                if (angular.isDefined(attrs.loadingMethod)) {
                    scope.loadingMethod = attrs.loadingMethod;
                }
                else {
                    scope.loadingMethod = 'GET';
                }
                scope.text = '';

                scope.$watch('bindTarget', function (nVal, oVal) {
                    initialize();
                })

                initialize();

                function initialize() {
                    if (!angular.isDefined(scope.bindTarget) || scope.bindTarget == null)
                        return;
                    var key = scope.bindTarget;
                    if (!angular.isNumber(key)) {
                        key = "'" + key + "'";
                    }
                    if (scope.loadingUrl) {
                        var url = '/odata' + scope.loadingUrl + '(' + key + ')';
                        $http({
                            method: scope.loadingMethod,
                            url: url
                        }).then(function (response) {
                            if (response && response.data) {
                                if (response.data[scope.textKey] || response.data[scope.textKey] == 0)
                                    scope.text = response.data[scope.textKey];
                            }
                        })
                    }
                }
            }
        }
    }])

})();
+(function () {
    'use strict';

    angular.module('_base', [])

    .value('valueTypes', {
        string: 'string',
        decimal: 'decimal',
        money: 'money',
        int: 'int',
        percentage: 'percentage',
        datetime: 'datetime',
        guid: 'guid',
        timespan: 'timespan',
        custom: 'custom'
    })

.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('httpInteceptor');
    $httpProvider.defaults.timeout = 50000;
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';

    // Disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = '0';

}])

.filter('percentage', ['$window', function ($window) {
    return function (input, decimals, suffix) {
        decimals = angular.isNumber(decimals) ? decimals : 3;
        suffix = suffix || '%';
        if (isNaN(input)) {
            return '';
        }
        return Math.round(input * Math.pow(10, decimals + 2)) / Math.pow(10, decimals) + suffix;
    }
}])

.filter('timespan', ['$window', function ($window) {
    return function (input, string, suffix) {
        if (angular.isString(input) && input != '') {
            input = input.toLowerCase();
            if (input.indexOf('pt') > -1) {
                input = input.replace('pt', '');
                input = input.replace(/[hms]/g, ',');
                var eles = input.split(',');
                if (eles != null && eles.length > 0) {
                    var value = '';
                    for (var i = 0; i < 3; i++) {
                        if ((eles.length >= (i+1))) {
                            if (i > 0) {
                                var loopCount = 2 - eles[i].length;
                                for (var j = 0; j < loopCount; j++) {
                                    eles[i] = '0' + eles[i];
                                }
                            }
                            if (value.length > 0) {
                                value += ':'
                            }
                            value += eles[i];
                        }
                        else {
                            if (value.length > 0) {
                                value += ':00';
                            }
                        }
                    }
                    return value;
                } 
            }
        }
    }

}])

.filter('hourspan', ['$window', function ($window) {
    return function (input, string, suffix) {
        if (angular.isString(input) && input != '') {
            input = input.toLowerCase();
            if (input.indexOf('pt') > -1) {
                input = input.replace('pt', '');
                input = input.replace(/[hms]/g, ',');
                var eles = input.split(',');
                if (eles != null && eles.length > 0) {
                    var value = '';
                    for (var i = 0; i < 1; i++) {
                        value = eles[i];
                    }
                    if (value != '')
                        value = parseInt(value);
                    return value;
                }
            }
        }
    }
}])

.factory('httpInteceptor', ['$q', 'ajaxErrorHandler', function ($q, ajaxErrorHandler) {
    ajaxErrorHandler.setUnauthUrl('/Auth/HandleUnauthorize');
    return {
        response: function (response) {
            console.log(new Date() + " " + 'response');
            return response;
        },
        responseError: function (rejection) {

            console.log(new Date() + " " + 'response error');
            return ajaxErrorHandler.errorHandler(rejection, $q);
        }
    }
}])

.factory('toggleTokenEmbadFrame', ['$q', 'globalModalDialog', function ($q, globalModalDialog) {
    return {
        frame: {},
        toggle: function (isAppend) {
            var _this = this.frame;
            var id = 'tdb_tokenembadframe';
            var $iframe = $('#' + id);
            if ($iframe && $iframe.length > 0) {
                var defer = $iframe.data('auth.deferred');
                if (defer === _this.tokenDeferred) {
                    _this.tokenDeferred.resolve();
                }
                _this.tokenDeferred = undefined;
                $iframe.remove();
                setTimeout(function () {
                    globalModalDialog.ok();
                }, 1000);
            }
            if (isAppend) {
                //_this.$refreshModal = $(refreshModalTpl);
                //_this.$refreshModal.appendTo('body');
                //if (!angular.isDefined(globalModalDialog.dialogScope))
                //    globalModalDialog.dialogScope = {};
                globalModalDialog.openLoading('We are working on your token, please wait for seconds.');

                _this.tokenDeferred = $q.defer();
                $iframe = $('<iframe/>', {
                    src: '/Auth/EmbadFrame',
                    id: id,
                    'class': 'hiddenIframe'
                });
                $iframe.data('auth.deferred', _this.tokenDeferred);
                $('body').append($iframe);
                return true;
            }
            return false;
        }
    }

}])

.factory('ajaxErrorHandler', ['toggleTokenEmbadFrame', 'globalModalDialog', function (toggleTokenEmbadFrame, globalModalDialog) {
    var msg = '';
    var unauthUrl = '';
    return {
        setUnauthUrl: function (url) {
            if (angular.isDefined(url)) {
                unauthUrl = url;
                return this;
            }
            else {
                return unauthUrl;
            }
        },
        errorHandler: function (rejection, $q) {
            var deferred = $q.defer();
            if (rejection.status) {
                switch (rejection.status) {
                    case 404:
                        msg = 'Response 404, the item your are looking for is not found\n';
                        break;
                    case 500:
                        msg = 'Response 500, there are some errors on server, please try later\n';
                        break;
                    case 400:
                        msg = 'Response 400, bad request\n';
                        break;
                }
                if (rejection.status == 401) {
                    var isRefreshToken = toggleTokenEmbadFrame.toggle(true);
                    $.when(toggleTokenEmbadFrame.frame.tokenDeferred).then(function () {
                    }, function () {
                        deferred.reject(rejection)
                    });
                }
                else {
                    deferred.reject(rejection)
                }
            }
            //if (/application\/json/.test(rejection.getResponseHeader('Content-Type'))) {
            //    if (rejection.responseText) {
            //        var errorObj = $.parseJSON(error.responseText);
            //        msg += errorObj.message || errorObj.Message;
            //    }
            //}
            if (rejection && rejection.data && rejection.data.Message) {
                msg += rejection.data.Message;
            }
            if (msg && rejection.status != 404)
                globalModalDialog.openNotice(msg);
            return deferred.promise;
        }
    }
}])

.factory('globalModalDialog', ['$q', function ($q) {
    return {
        dialogScope: {
            dialogActive: false,
            dialogType: {
                confirm: 'Confirm',
                notice: 'Notice',
                loading: 'Loading'
            },
            currentDialogType: ''
        },
        deferred: undefined,
        openConfirm: function (content) {
            this.dialogScope.currentDialogType = this.dialogScope.dialogType.confirm;
            this.deferred = $q.defer();
            this.dialogScope.content = content;
            this.dialogScope.dialogActive = true;
            return this.deferred.promise;
        },
        openNotice: function (content) {
            this.dialogScope.currentDialogType = this.dialogScope.dialogType.notice;
            this.dialogScope.content = content;
            this.dialogScope.dialogActive = true;
            return false;
        },
        openLoading: function (content) {
            this.dialogScope.currentDialogType = this.dialogScope.dialogType.loading;
            this.deferred = $q.defer();
            this.dialogScope.content = content;
            this.dialogScope.dialogActive = true;
            return this.deferred.promise;
        },
        ok: function () {
            this.dialogScope.closeModal();
            this.deferred.resolve();
        },
        no: function () {
            this.dialogScope.closeModal();
            this.deferred.reject();
        },
        setDialogScope: function (scope) {
            this.dialogScope = scope;
        }
    }
}])

.factory('_extender', function () {
    var _extender = _extender || function (child, father) {
        for (var prop in father) if (father.hasOwnProperty(prop)) {
            child[prop] = father[prop];
        }
        function _base() {
            this.Constructor = child;
        }
        _base.prototype = father.prototype;
        child.prototype = new _base();
    }
    return _extender;
})

.factory('generalSer', ['$window', '$document', function ($window, $document) {
    return {
        ramdonStr: function (length) {
            var chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            length = length || 8;
            var randomstring = '';
            for (var i = 0; i < length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                if (i == 0) {
                    if (rnum <= 9)
                        rnum = rnum + 10;
                }
                randomstring += chars.substring(rnum, rnum + 1);
            }
            return randomstring;
        },
        idExist: function (id) {
            if (id) {
                var idSelector = '#' + id;
                if (angular.element(idSelector).length) {
                    return true;
                }
            }
            return false;
        },
        findObject: function (propName, value, array, nameCollection) {
            var propNames;
            if (nameCollection)
                var propNames = this.getNameArrayCollection(propName);
            else
                propNames = propName;
            var obj = [];
            for (var i = 0; i < array.length; i++) {
                var val = array[i];
                if (nameCollection) {
                    angular.forEach(propNames, function (pName, index) {
                        val = val[pName];
                    })
                }
                else {
                    val = val[propNames];
                }
                if (angular.isDefined(val) && value) {
                    if (typeof val === "string") {
                        if (val.toLowerCase() == value.toLowerCase()) {
                            obj.push(array[i]);
                        }
                    }
                    else {
                        if (val == value) {
                            obj.push(array[i]);
                        }
                        else if (angular.equals(val, value)) {
                            obj.push(array[i]);
                        }
                    }
                }
            }
            return obj;
        },
        findObjectIndex: function (propName, value, array, nameCollection) {
            var idx = -1;
            var isSet = false;
            var propNames;
            if (nameCollection)
                var propNames = this.getNameArrayCollection(propName);
            else
                propNames = propName;
            for (var i = 0; i < array.length; i++) {
                var val = array[i];
                if (nameCollection) {
                    angular.forEach(propNames, function (pName, index) {
                        val = val[pName];
                    })
                }
                else {
                    val = val[propNames];
                }
                if (angular.isDefined(val) && value) {
                    if (typeof val === "string" && typeof value === "string") {
                        if (val.toLowerCase() == value.toLowerCase()) {
                            if (!isSet) {
                                idx = i;
                                isSet = true;
                                break;
                            }
                        }
                    }
                    else {
                        if (val == value) {
                            if (!isSet) {
                                idx = i;
                                isSet = true;
                                break;
                            }
                        }
                        else if (angular.equals(val, value)) {
                            if (!isSet) {
                                idx = i;
                                isSet = true;
                                break;
                            }
                        }
                    }
                }
            }

            return idx;
        },
        findLastObjIndex: function (propName, value, array) {
            var index = -1;
            for (var i = 0; i < array.length; i++) {
                var val = array[i][propName];
                if (typeof val === 'string' && typeof value === 'string') {
                    if (val.toLowerCase() === value.toLowerCase()) {
                        index = i;
                    }
                    else break;
                }
                else {
                    if (val === value) {
                        index = i
                    }
                    else
                        break;

                }
            }
            return index;
        },
        arrayAlterPos: function (array, oldIndex, newIndex) {
            var item = array.splice(oldIndex, 1);
            if (item && Array.isArray(item) && item.length > 0)
                array.splice(newIndex, 0, item[0]);
        },
        arrayAlterPosV2: function (array, object, newIndex) {
            var oldIndex = array.indexOf(object);
            this.arrayAlterPos(array, oldIndex, newIndex);
        },
        getNameTreeCollection: function (name, separator) {
            if (!separator)
                separator = '/';
            var returnTree = [];
            var temp;
            var nameCollection = name.split(separator);
            angular.forEach(nameCollection, function (name, i) {
                if (i > 0)
                    temp = returnTree[i - 1] + separator + name;
                else
                    temp = name;
                returnTree.push(temp);
            })
            return returnTree;
        },
        getNameArrayCollection: function (name, separator) {
            if (!separator)
                separator = '/';
            var temp;
            var nameCollection = name.split(separator);
            return nameCollection;
        },
        removeItemFromArray: function (array, object) {
            try {
                var index = array.indexOf(object);
                if (index > -1) {
                    array.splice(index, 1);
                }
            }
            catch (e) {
                console.log(e);
                return false;
            }
            return true;
        },
        checkTextSelect: function () {
            var selectText = '';
            if ($window.getSelection) {
                selectText = $window.getSelection();
            }
            else if ($document.getSelection) {
                selectText = $document.getSelection();
            }
            else if ($document.selection) {
                selectText = $document.selection.createRange().text;
            }
            if (selectText == '')
                return false;
            else
                return true;
        }
    }

}])

.directive('ngEnter', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('keypress', function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        var func = $parse(attrs.ngEnter);
                        func(scope, { e: event });
                        //scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    }
}])

.directive('ngEnterSubmit', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            if (!angular.isDefined(attrs.ngEnterSubmit)) {
                return;
            }
            element.on('keypress', 'input[type="text"],input[type="number"]', function (event) {
                if (event.which === 13) {
                    event.preventDefault();
                    var invalid = scope.$eval(attrs.ngEnterInvalid);
                    if (!invalid) {
                        var func = $parse(attrs.ngEnterSubmit);
                        func(scope, { $event: event });
                    }
                }
            })
        }
    }
}])

.directive('clickExceptHere', ['$document', function ($document) {
    return {
        restrict: 'A',
        //scope:{
        //    callback: '&clickExceptHere'
        //},
        link: function (scope, element, attr) {
            element.on('click', function (e) {
                e.stopPropagation();
            });
            $document.on('click', function (e) {
                if (angular.isDefined(attr.clickExceptHere)) {
                    scope.$apply(attr.clickExceptHere);
                }

            })
        }
    }
}])

.directive('universalModal', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        replace: false,
        transclude: true,
        scope: true,
        templateUrl: '/AgControlTemp/UniversalModal',
        link: function (scope, element, attrs, ctrl, transclude) {
            if (angular.isDefined(scope.modalActive) && scope.modalActive) {
                scope.modalActive = false;
            }

            if (angular.isDefined(attrs.modalActiveStatus)) {
                scope.$watch(attrs.modalActiveStatus, function (nVal, oVal) {
                    if (nVal === oVal)
                        return;
                    scope.modalActive = scope.$eval(attrs.modalActiveStatus);
                })
            }

            if (angular.isDefined(attrs.modalActiveCallback)) {
                var callbackFunc = $parse(attrs.modalActiveCallback);
                scope.$watch('modalActive', function (nVal, oVal) {
                    if (nVal == true) {
                        callbackFunc(scope);
                    }
                })
            }

            scope.dismiss = function () {
                scope.modalActive = false;
            }

            if (angular.isDefined(attrs.bodyTempUrl))
                scope.templateUrl = attrs.bodyTempUrl;

            scope.active = function (ifActive) {
                if (angular.isDefined(ifActive))
                    scope.modalActive = ifActive;
                else
                    scope.modalActive = true;
            }

            transclude(scope, function (clone, scope) {
                element.prepend(clone);
            });
        }
    }
}])

.directive('onFinishRender', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                })
            }
        }
    }
}])

.directive('draggableItem', ['$document', function ($document) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var dragArea = element.find('.drag-area');
            if (dragArea.length <= 0)
                dragArea = element;

            //element.on('mouseenter', function () {
            //    if (scope.draggable.dragged) {
            //    }
            //})

            dragArea.on('mousedown', function (e) {
                e.preventDefault();
                if (angular.isDefined(scope.draggable))
                    scope.draggable.dragged = true;
                else
                    scope.dragged = true;
                scope.$apply();

                var clone = element.clone();
                clone.addClass('dragged-ghost');
                if (angular.isDefined(attrs.draggableClass)) {
                    clone.addClass(attrs.draggableClass);
                }

                clone.outerHeight(element.outerHeight());
                clone.outerWidth(element.outerWidth() + 1);

                var leftdif = e.pageX - element.offset().left - 1;
                var topdif = e.pageY - element.offset().top;

                $document.find('body').append(clone);
                clone.offset({
                    top: element.offset().top,
                    left: element.offset().left
                })

                $document.on('mousemove', function (e) {
                    clone.offset({
                        top: e.pageY - topdif,
                        left: e.pageX - leftdif
                    })
                });

                $document.on('mouseup', function () {
                    $document.off('mousemove');
                    $document.off('mouseup');
                    if (clone)
                        clone.remove();
                    scope.draggable.dragged = false;
                    scope.dragged = false;
                    scope.$apply(attrs.draggableDrop);
                });
            });

        }
    }
}])

.directive('isolatedScroll', function () {
    return {
        link: function (scope, element, attrs) {
            element.on('DOMMouseScroll mousewheel', function (e) {
                var scrollHeight = this.scrollHeight,
                clientHeight = this.clientHeight;
                if (scrollHeight <= clientHeight)
                    return;

                var scrollTop = this.scrollTop,
                height = element.outerHeight(),
                delta = (e.type == 'DOMMouseScroll' ?
                    e.originalEvent.detail * -40 :
                    e.originalEvent.wheelDelta),
                up = delta > 0;
                //console.log('scrollTop ' + scrollTop + ' scrollHeight ' + scrollHeight + ' height ' + height
                //    + ' clientHeight ' + this.clientHeight);
                var prevent = function () {
                    e.preventDefault();
                    e.stopPropagation();
                    e.returnValue = false;
                    return false;
                }

                if (!up && -delta > scrollHeight - height - scrollTop) {
                    element.scrollTop(scrollHeight);
                    return prevent();
                }
                else if (up && delta > scrollTop) {
                    element.scrollTop(0);
                    return prevent();
                }
            })
        }
    }
})

.directive('onLastRepeat', function () {
    return {
        link: function (scope, element, attrs) {
            if (scope.$last)
                setTimeout(function () {
                    scope.$emit('onRepeatLast', element, attrs);
                }, 1);
        }
    }
})

.directive('percentageInput', ['$timeout', function ($timeout) {
    function changeToPercentage(input) {
        var result = Math.round(input * Math.pow(10, 5)) / Math.pow(10, 3);
        return result;
    }
    function changeToDecimal(input) {
        var result = Math.round(input * Math.pow(10, 3)) / Math.pow(10, 5);
        return result.toString();
    }

    return {
        restrict: 'AE',
        template: '<input type="number" class="form-control" ng-model="displayData" />',
        scope: {
            percentageData: '=',
        },
        link: function (scope, element, attrs) {
            scope.displayData = changeToPercentage(scope.percentageData);

            scope.$watch('percentageData', function (nVal, oVal) {
                if (nVal === oVal || !angular.isDefined(nVal))
                    return;
                var tempVal
                if (!angular.isNumber(nVal)) {
                    tempVal = parseFloat(nVal);
                }
                if (angular.isNumber(tempVal)) {
                    $timeout(function () {
                        scope.displayData = changeToPercentage(tempVal);
                    })
                }
                else {
                    scope.displayData = undefined;
                }
            })

            scope.$watch('displayData', function (nVal, oVal) {
                if (nVal === oVal || !angular.isDefined(nVal))
                    return;
                if (angular.isNumber(nVal)) {
                    $timeout(function () {
                        scope.percentageData = changeToDecimal(nVal);
                    });
                }
                else {
                    scope.percentageData = undefined;
                }
            })
        }
    }
}])

.directive('fileLinkCell', function () {
    return {
        scope: {},
        templateUrl: '/FileGallery/FileLinkCell',
        replace: true,
        link: function (scope, element, attrs) {
            scope.url = attrs.urlData;
        }
    }
})

.controller('baseCtrl', ['$document', function ($document) {
    //$document.on('mouseup', function () {
    //    $document.off('mousedown');
    //    $document.off('mousemove');
    //})
}])

.controller('globalModalDialogCtrl', ['$scope', 'globalModalDialog', '$timeout', function ($scope, globalModalDialog, $timeout) {
    $scope.dialogActive = false;

    $scope.dialogType = {
        confirm: 'Confirm',
        notice: 'Notice',
        loading: 'Loading'
    }
    $scope.currentDialogType = '';

    $scope.closeModal = function () {
        //if (!$scope.$$phase) {
        //    $scope.$apply();
        //}
        $timeout(function () {
            $scope.dialogActive = false;
        })
    }
    $scope.yes = function () {
        globalModalDialog.ok();
    }
    $scope.no = function () {
        globalModalDialog.no();
    }

    $scope.TempUrl = '/AgControlTemp/GlobalModalDialogBody';
    globalModalDialog.setDialogScope($scope);
}])

})()
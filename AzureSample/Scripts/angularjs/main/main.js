+(function () {
    'use strict';

    angular.module('AzureSampleApp', ["control.gridView", "control.pagination",
    "control.dateInput", "control.richDropdown", "control.innerLitelist",
    "control.multiSelectionDropdown", "angularFileUpload", "control.carousel", "_base"])

    .directive('rightMenuTrigger', ['rightMenuScope', '$parse', 'generalSer', '$rootScope',
        function (rightMenuScope, $parse, generalSer, $rootScope) {
            return {
                restrict: 'AE',
                link: function (scope, element, attrs) {
                    if (angular.isDefined(attrs.rightMenuTemplateUrl) &&
                        attrs.rightMenuTemplateUrl) {
                        element.on('contextmenu', function (e) {
                            if (generalSer.checkTextSelect())
                                return;
                            e.preventDefault();
                            if (angular.isDefined(attrs.rightMenuTrigger)) {
                                var callback = $parse(attrs.rightMenuTrigger)
                                if (callback && typeof callback == 'function')
                                    scope.$apply(function () {
                                        callback(scope);
                                    })
                            }
                            if (angular.isDefined(attrs.rightMenuModel)) {
                                var rightMenuModel = scope.$eval(attrs.rightMenuModel);
                                if (angular.isDefined(rightMenuModel)) {
                                    scope.rightMenuModel = rightMenuModel;
                                }
                            }
                            var menuTemplateUrl = scope.$eval(attrs.rightMenuTemplateUrl);
                            if (angular.isDefined(menuTemplateUrl)) {
                                scope.menuTemplateUrl = menuTemplateUrl;
                            }

                            scope.mouseEvent = e;

                            rightMenuScope.register(scope);
                            $rootScope.$emit('triggerRightMenu');
                        });
                    }
                }
            }
        }])

    .directive('rightMenuContainer', ['$compile', 'rightMenuScope', '$rootScope',
        function ($compile, rightMenuScope, $rootScope) {
            return {
                link: function (scope, element, attrs) {
                    $rootScope.$on('triggerRightMenu', function (e) {
                        var menuScope = rightMenuScope.scope
                        if (angular.isDefined(menuScope) && angular.isDefined(menuScope.mouseEvent)) {
                            var relativeTop = menuScope.mouseEvent.pageY - element.offset().top;
                            var relativeLeft = menuScope.mouseEvent.pageX - element.offset().left;
                            menuScope.relativePos = {
                                top: relativeTop,
                                left: relativeLeft
                            }
                        }
                        else
                            return;

                        rightMenuScope.register(menuScope);

                        var rightMenuTemplate = '<div cus-right-menu template-url="menuTemplateUrl"></div>';

                        var menuDirective = $compile(rightMenuTemplate)(menuScope);

                        element.append(menuDirective);
                    })
                }
            }
        }])

    .directive('cusRightMenu', ['$http', '$templateCache', '$compile', '$parse', 'globalFocusItem', '$window', 'rightMenuScope',
        function ($http, $templateCache, $compile, $parse, globalFocusItem, $window,
        rightMenuScope) {
            return {
                link: function (scope, element, attrs) {
                    if (angular.isDefined(rightMenuScope.scope)) {
                        scope = rightMenuScope.scope;
                    }
                    else {
                        return;
                    }
                    var actualElement;
                    customDirReplace();
                    function customDirReplace() {
                        if (angular.isDefined(attrs.templateUrl)) {
                            var url = $parse(attrs.templateUrl)(scope);
                            if (url) {
                                $http.get(url, { cache: $templateCache }).success(function (tpl) {
                                    var replaceElement = angular.element(tpl);
                                    $compile(replaceElement)(scope);
                                    replaceElement.on('click', function (e) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                    });
                                    element.replaceWith(replaceElement);
                                    actualElement = replaceElement;

                                    function closeMenu() {
                                        actualElement.remove();
                                    }
                                    scope.closeMenu = function () {
                                        globalFocusItem.close();
                                    }
                                    angular.element($window).on('resize', function () {
                                        globalFocusItem.close();
                                    })
                                    var menuModel = {
                                        close: closeMenu,
                                        element: actualElement
                                    }
                                    globalFocusItem.register(menuModel, false);
                                });
                            }
                        }
                    }
                }
            }
        }])

    .factory('globalEvents', ['$rootScope', 'globalFocusItem',
        function ($rootScope, globalFocusItem) {
            var global = {};
            global.click = function (target) {
                global.clickTarget = target
                if (angular.isDefined(globalFocusItem.close) && typeof globalFocusItem.close === 'function') {
                    $rootScope.$apply(function () {
                        globalFocusItem.close();
                    });
                }
            }
            return global;
        }])

    .factory('globalFocusItem', function () {
        var menu = {
            currentMenu: [],
            close: function (element) {
                var _this = this;
                if (this.currentMenu.length > 0) {
                    if (element) {
                        for (var i = _this.currentMenu.length - 1; i >= 0; i--) {
                            if (_this.currentMenu[i].element === element) {
                                if (_this.currentMenu[i].close && typeof this.currentMenu[i].close === 'function') {
                                    _this.currentMenu[i].close();
                                }
                                _this.currentMenu.splice(i, 1);
                                break;
                            }
                            else {
                                if (_this.currentMenu[i].close && typeof this.currentMenu[i].close === 'function') {
                                    _this.currentMenu[i].close();
                                }
                                _this.currentMenu.splice(i, 1);
                            }
                        }
                    }
                    else {
                        angular.forEach(this.currentMenu, function (obj, idnex) {
                            if (obj.close && typeof obj.close === 'function') {
                                obj.close();
                            }
                        })
                        this.currentMenu = [];
                    }
                }
            },
            test: function () {
                console.log('test');
            },
            register: function (menuModel) {
                if (!angular.isDefined(menuModel))
                    return;
                var _this = this;
                if (_this.currentMenu.length > 0) {
                    if (angular.isDefined(menuModel)) {
                        for (var i = _this.currentMenu.length - 1; i >= 0; i--) {
                            if ($.contains(_this.currentMenu[i].element[0], menuModel.element[0])) {
                                _this.currentMenu.push(menuModel);
                                break;
                            }
                            else {
                                if (_this.currentMenu[i].close && typeof this.currentMenu[i].close === 'function') {
                                    _this.currentMenu[i].close();
                                }
                                _this.currentMenu.splice(i, 1);
                            }
                        }
                        if (_this.currentMenu.length == 0) {
                            _this.currentMenu.push(menuModel);
                        }
                    }
                }
                else {
                    _this.currentMenu.push(menuModel)
                }
            },
        }
        return menu;
    })

    .factory('rightMenuScope', function () {
        return {
            scope: undefined,
            register: function (scope) {
                this.scope = scope
            }
        }
    })

    .factory('appHiddenFrameSrc', ['$document', function ($document) {
        var hiddenFrame = $document[0].querySelector('#appHiddenFrame');
        return {
            setSrc: function (src) {
                if (angular.isDefined(src))
                    angular.element(hiddenFrame).attr('src', src);
            }
        }
    }])

    .factory('authFactory', ['$document', '$window', function ($document, $window) {

    }])

    .factory('bridgeService', function () {

    })

    .factory('configurationSer', ['$http', function ($http) {
        return {
            defaultUrl: '/odata/UserConfigurations',
            get: function (searchObj) {
                var url = this.defaultUrl;
                var query = '?$filter=Name eq \'' + searchObj.name + '\' and ' +
                    'Url eq \'' + searchObj.url + '\' and ' +
                    'Target_Name eq \'' + searchObj.targetName + '\' and ' +
                    'User_Email eq \'' + searchObj.userEmail + '\'';
                url += query;
                return $http.get(url);
            },
            getCount: function (name) {
                var url = this.defaultUrl;
                var query = '?$inlinecount=allpages&$top=0';
                if (name) {
                    query += '&$filter=Name eq \'' + name + '\'';
                }
                url += query;
                return $http.get(url);
            },
            getSingle: function (name, page) {
                var url = this.defaultUrl
                var query = '?$filter=Name eq \'' + name + '\'&$top=1';
                var skip = '';
                if (page > 1) {
                    skip = '&$skip=' + (page - 1);
                }
                url += query + skip;
                return $http.get(url);
            },
            getUserSingle: function (name, email) {
                var url = this.defaultUrl
                var query = '?$filter=Name eq \'' + name + '\' and User_Email eq \'' + email + '\'&$top=1';
                url += query;
                return $http.get(url);
            },
            add: function (model) {
                var url = this.defaultUrl;
                return $http.post(url, model);
            },
            edit: function (id, model) {
                var url = this.defaultUrl + '(' + id + ')';
                return $http.put(url, model);
            },
            getDefault: function (Name) {
                var url = '/odata/DefaultAppConfigurations';
                var query = '?$filter=Name eq \'' + Name + '\'';
                url += query;
                return $http.get(url);
            },
            getMigration: function (configID) {
                var url = '/odata/ConfigurationMigrations';
                var query = '?$filter=App eq ' + configID;
                url += query;
                return $http.get(url);

            },
            initializegridConfigure: function (response, grid, configModel) {
                if (response.data && response.data.value) {
                    if (angular.isArray(response.data.value) && response.data.value.length > 0) {
                        configModel = response.data.value[0];
                        if (configModel.Configuration) {
                            var config = angular.fromJson(configModel.Configuration);
                            grid.config = config;
                            grid.initialize();
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    }])

    .factory('getCurrentUser', ['$http', function ($http) {
        var url = '/api/User';
        return {
            user: $http.get(url)
        }
    }])

    .factory('preferenceFactory', ['jsonConfigFactory', 'configurationSer', 'globalModalDialog', function (jsonConfigFactory, configurationSer, globalModalDialog) {
        function addPreference(configObj, json) {
            configurationSer.add({
                Name: configObj.name,
                User_Email: configObj.userEmail,
                Target_Name: configObj.targetName,
                Url: configObj.url,
                Configuration: json,
                Type: 'GridView'
            }).then(function (response) {
                //configModel = response.data;
                globalModalDialog.openNotice('Your Configuration is Saved');
            })
        };
        return {
            savePreference: function (gridData, configModel, configObj) {
                jsonConfigFactory.all(gridData);
                var json = jsonConfigFactory.getJsonString();

                configurationSer.get(configObj).then(function (response) {
                    if (response.data && response.data.value) {
                        if (angular.isArray(response.data.value) && response.data.value.length > 0) {
                            configModel = response.data.value[0];
                            configurationSer.edit(configModel.ID, {
                                Configuration: json
                            }).then(function (response) {
                                //configModel = response.data;
                                globalModalDialog.openNotice('Your Configuration is Saved');
                                return;
                            })
                        }
                        else {
                            addPreference(configObj, json);
                        }
                    }
                    else {
                        addPreference(configObj, json);
                    }
                });

            },

        }
    }])

    .factory('fgHelpFactory', ['gridHelpFactory', '$q', function (gridHelpFactory, $q) {
        return {
            ResponseHandle: function (responseValue, grid) {
                if (responseValue) {
                    var keyValue = gridHelpFactory.findKeyValue(grid);
                    var fileData = undefined;
                    if (angular.isArray(responseValue))
                        fileData = responseValue[0];
                    else
                        fileData = responseValue;
                    var key = fileData[keyValue];
                    var name = fileData.Name + fileData.Extension;
                    return key;
                }
                return null;

            }
        }
    }])

    .controller('mainCtrl', ['$scope', 'toggleTokenEmbadFrame', '$document', 'globalEvents', '$http',
        '$rootScope', function ($scope, toggleTokenEmbadFrame, $document, globalEvents, $http, $rootScope) {
            $scope.$on('closeRefreshTokenFrame', function (e, message) {
                toggleTokenEmbadFrame.toggle();
            });
            $document.off('keydown');
            $document.on('keydown', function (e) {
                if (e.which === 8 && (e.target.nodeName !== "INPUT" && e.target.nodeName !== 'SELECT' && e.target.nodeName !== 'TEXTAREA')) {
                    e.preventDefault();
                }
            })


            $document.on('click contextmenu', function (e) {
                globalEvents.click(e.target);
            })
            $rootScope.currentUser = undefined;
            $http.get('/api/User').then(function (response) {
                $rootScope.currentUser = response.data;
            })
        }])

    .run(['$document', function ($document) {
        angular.element('body').append('<div ng-include="\'/AgControlTemp/GlobalModalDialog\'"></div>');
    }])
})();


+(function () {
    'use strict';

    var filterModule = angular.module('item.filter', ['_base']);

    filterModule.service('filterItem', ['generalSer', 'filterMethodName', 'queryShop', 'valueTypes', '$filter', 'monthsAffix',
        function (generalSer, filterMethodName,queryShop, valueTypes, $filter, monthsAffix) {
        function filterItem(option) {
            if (option) {
                this.key = option.key || '';
                this.displayKey = option.displayKey || '';
                this.method = option.method || '';
                this.value = option.value || '';
                this.logic = option.logic || 'and';
                this.type = option.type || 'string';
                this.filterTempUrl = option.filterTempUrl;
                this.nullFilter = false;
                this.editable = option.editable || true;
                if (this.nullFilter == true) {
                    this.editable = false;
                }
            }
        }

        filterItem.prototype.assembleQuery = function (excludeLogic) {
            var _this = this;
            var query = '';
            if (this.nullFilter) {
                var nameTree = generalSer.getNameTreeCollection(this.key);
                angular.forEach(nameTree, function (name, i) {
                    if (i > 0) {
                        query += ' and ';
                    }
                    query += name + ' ' + _this.method + ' ' + null;
                });
            }
            else
                var query = queryShop.query(this.key, this.method, this.value, this.type);
            if (!excludeLogic)
                query = ' ' + this.logic + ' ' + query;
            return query;
        }

        filterItem.prototype.methodName = function () {
            var _this = this;
            if (angular.isDefined(this.method)) {
                return filterMethodName[this.method];
            }
        }

        filterItem.prototype.isDate = function () {
            if (this.type.indexOf(valueTypes.datetime) > -1) {
                if (angular.isDate(this.value)) {
                    return true;
                }
                else if (angular.isDate(this.value.date)) {
                    return true;
                }
            }
            return false;
        }

        filterItem.prototype.getValue = function (item) {
            if (this.type.indexOf(valueTypes.datetime) > -1) {
                if (angular.isDefined(this.value)) {
                    if (angular.isDate(this.value)) {
                        return this.value;
                    }
                    else if (angular.isDate(this.value.date)) {
                        return this.value.date;
                    }
                    else {
                        var returnVal = '';
                        this.value.year = parseInt(this.value.year);
                        this.value.month = parseInt(this.value.month);
                        this.value.day = parseInt(this.value.day);

                        if (angular.isNumber(this.value.year) && !isNaN(this.value.year)) {
                            returnVal = this.value.year;
                        }
                        if (angular.isNumber(this.value.month) && !isNaN(this.value.month)) {
                            if (returnVal)
                                returnVal = monthsAffix.affix[this.value.month] + ' ' + returnVal;
                            else
                                returnVal = monthsAffix.affix[this.value.month];
                        }
                        return returnVal;
                    }
                }
            }
            else {
                return this.value;
            }
        }

        return filterItem;
    }])

    filterModule.service('filterGroup', function () {
        function filterGroup(config) {
            this.items = [];
            if (config) {
                this.name = config.name || '';
                this.displayName = config.displayName || '';
            }
        }

        filterGroup.prototype.assembleQuery = function () {
            var query = '';
            angular.forEach(this.items, function (item, i) {
                if (i == 0)
                    query += item.assembleQuery(true);
                else
                    query += item.assembleQuery();
            })
            query = '(' + query + ')';
            return query;
        }
        return filterGroup;
    })

    filterModule.factory('queryShop', ['valueTypes', 'defaultQueryShop', 'decimalQueryShop', 'datetimeQueryShop', 'intQueryShop',
        function (valueTypes, defaultQueryShop, decimalQueryShop,
        datetimeQueryShop, intQueryShop) {
        return {
            query: function (name, method, value, type) {
                if (name && angular.isDefined(value) && method) {
                    var query = '';
                    switch (true) {
                        case type.indexOf(valueTypes.string) > -1:
                            query = defaultQueryShop.shop(name, method, value);
                            break;
                        case type.indexOf(valueTypes.decimal) > -1:
                        case type.indexOf(valueTypes.money) > -1:
                        case type.indexOf(valueTypes.percentage) > -1:
                            query = decimalQueryShop.shop(name, method, value);
                            break;
                        case type.indexOf(valueTypes.int) > -1:
                            query = intQueryShop.shop(name, method, value);
                            break;
                        case type.indexOf(valueTypes.datetime) > -1:
                            query = datetimeQueryShop.shop(name, method, value);
                            break;
                    }
                    return query;
                }
            }
        }
    }])

    filterModule.factory('datetimeQueryShop', ['filterMethod', 'datetimeOdataConverter',
        function (filterMethod, datetimeOdataConverter) {
        return {
            shop: function (name, method, value) {
                var dateSpecialAssembly = false;
                var query = '';
                if (angular.isDefined(value)) {
                    if (angular.isDate(value))
                        value = datetimeOdataConverter.converter(value);
                    else {
                        if (angular.isDate(value.date)) {
                            value = datetimeOdataConverter.converter(value.date);
                        }
                        else {
                            dateSpecialAssembly = true;
                        }
                    }
                    if (dateSpecialAssembly) {
                        switch (method) {
                            case filterMethod.eq:
                            case filterMethod.ne:
                            case filterMethod.lt:
                            case filterMethod.gt:
                            case filterMethod.ge:
                            case filterMethod.le:
                                value.year = parseInt(value.year);
                                value.month = parseInt(value.month);
                                value.day = parseInt(value.day);

                                if (!isNaN(value.year)) {
                                    query = 'year(' + name + ') ' + method + ' ' + value.year;
                                }
                                if (!isNaN(value.month)) {
                                    var month = parseInt(value.month);
                                    if (!isNaN(month)) {
                                        if (query)
                                            query += ' and ';
                                        query += 'month(' + name + ') ' + method + ' ' + (month + 1);
                                    }
                                }
                                if (!isNaN(value.day)) {
                                    if (query)
                                        query += ' and ';
                                    query += 'day(' + name + ') ' + method + ' ' + value.day;
                                }
                                query = '(' + query + ')';
                                break;
                        }
                    }
                    else {
                        switch (method) {
                            case filterMethod.eq:
                            case filterMethod.ne:
                            case filterMethod.lt:
                            case filterMethod.gt:
                            case filterMethod.ge:
                            case filterMethod.le:
                                query = name + ' ' + method + ' ' + value
                                break;
                        }
                    }
                    return query;
                }
            }
        }
    }])

    filterModule.factory('defaultQueryShop', ['filterMethod',function (filterMethod) {
        return {
            shop: function (name, method, value) {
                var query = '';
                value = value != null && value != 'null' ? ('\'' + value + '\'') : value;
                switch (method) {
                    case filterMethod.eq:
                    case filterMethod.ne:
                    case filterMethod.lt:
                    case filterMethod.gt:
                    case filterMethod.ge:
                    case filterMethod.le:
                        query = name + ' ' + method + ' ' + value
                        break;
                    case filterMethod.startswith:
                    case filterMethod.endswith:
                        query = method + '(' + name + ',' + value + ')';
                        break;
                    case 'substringof':
                        query = method + '(' + value + ',' + name + ')';
                        break;
                }
                return query;
            }
        }
    }])

    filterModule.factory('decimalQueryShop', ['filterMethod',function (filterMethod) {
        return {
            shop: function (name, method, value) {
                var query = '';
                value = value != null && value != 'null' ? (value + 'm') : value;
                switch (method) {
                    case filterMethod.eq:
                    case filterMethod.ne:
                    case filterMethod.lt:
                    case filterMethod.gt:
                    case filterMethod.ge:
                    case filterMethod.le:
                        query = name + ' ' + method + ' ' + value
                        break;
                }
                return query;
            }
        }
    }])

    filterModule.factory('intQueryShop', ['filterMethod',function (filterMethod) {
        return {
            shop: function (name, method, value) {
                var query = '';
                value = value != null && value != 'null' ? value : null;
                switch (method) {
                    case filterMethod.eq:
                    case filterMethod.ne:
                    case filterMethod.lt:
                    case filterMethod.gt:
                    case filterMethod.ge:
                    case filterMethod.le:
                        query = name + ' ' + method + ' ' + value
                        break;
                }
                return query;
            }
        }
    }])

    filterModule.factory('datetimeOdataConverter', function () {
        return {
            converter: function (date) {
                if (angular.isDate(date)) {
                    var year = date.getFullYear();
                    var month = date.getMonth() + 1;
                    var day = date.getDate();
                    var value = 'datetime\'' + year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day) + '\'';
                    return value;
                }
                return '';
            }
        }
    })

    filterModule.directive('filterGroupDir', function () {
        return {
            restrict: 'AE',
            templateUrl: '/AgControlTemp/FilterGroupTemp',
            link: function (scope, element, attrs) {

            }
        }
    })

    filterModule.directive('filterItemDir', function () {
        return {
            scope:true,
            templateUrl: '/AgControlTemp/FilterItemTemp',
            link: function (scope, element, attrs) {
                scope.editMode = false;
                scope.toggleEditPanel = function (show) {
                    if (angular.isDefined(show)) {
                        scope.editMode = show;
                    }
                    else {
                        scope.editMode = !scope.editMode;
                    }
                }
                scope.forms = {};
            }
        }
    })

    filterModule.value('filterMethod', {
        startswith: 'startswith',
        endswith: 'endswith',
        substringof: 'substringof',
        ne: 'ne',
        eq: 'eq',
        lt: 'lt',
        gt: 'gt',
        ge: 'ge',
        le: 'le'
    })

    filterModule.value('filterMethodName', {
        startswith: 'Starts With',
        endswith: 'Ends With',
        substringof: 'Contains',
        ne: 'Not Equal',
        eq: 'Equal',
        lt: 'Less Than',
        gt: 'Greater Than',
        ge: 'Greater Than Or Equal',
        le: 'Less Than Or Equal'
    })

    filterModule.value('monthsAffix', {
        affix: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    });
})()
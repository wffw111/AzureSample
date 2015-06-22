+(function () {
    'use strict';

    var paginationModule = angular.module('control.pagination', ['_base']);

    paginationModule.service('paginationData', function () {
        function paginationData(config) {
            this.totalItems = config.totalItems || 0;
            this.pageSize = config.pageSize || 0;
            this.sectionSize = config.sectionSize || 5;
            this.currentPage = config.currentPage || 0;
            this.currentSections = [];
            this.section = {
                section: 0,
                startPage: 0
            }
            this.createSection();
            this.callback = config.callback || undefined;
        }

        paginationData.prototype.getTotalPages = function () {
            var _this = this;
            var result;
            if (_this.totalItems % _this.pageSize > 0)
                result = _this.totalItems == 0 ? 0 : parseInt(_this.totalItems / _this.pageSize) + 1;
            else {
                result = _this.totalItems == 0 ? 0 : parseInt(_this.totalItems / _this.pageSize);
            }
            return result;
        }

        paginationData.prototype.getStartPage = function (section) {
            var _this = this;
            return (section - 1) * _this.sectionSize + 1;
        }

        paginationData.prototype.getSection = function () {
            var _this = this;
            var value = 0;
            var startPage = 0;
            if (_this.sectionSize > 0 && _this.currentPage > 0) {
                value = parseInt((_this.currentPage - 1) / _this.sectionSize) + 1;
                startPage = _this.getStartPage(value);
            }
            _this.section.section = value;
            _this.section.startPage = startPage;
        }

        paginationData.prototype.createSection = function () {
            var _this = this;
            if (!_this.currentPage || _this.currentPage <= 0 || !angular.isNumber(_this.currentPage)) {
                _this.currentSections = [];
                return;
            }
            if (_this.currentSections.indexOf(_this.currentPage) < 0) {
                var tempArray = [];
                _this.getSection();
                var endPage = _this.section.startPage + _this.sectionSize;
                var totalPage = _this.getTotalPages();
                if (endPage > totalPage)
                    endPage = totalPage + 1;
                for (var i = _this.section.startPage; i < endPage; i++) {
                    tempArray.push(i);
                }
                _this.currentSections = tempArray;
            }

        }

        paginationData.prototype.navigator = function (option) {
            var _this = this;
            switch (option) {
                case '-':
                    if (_this.currentPage > 1) {
                        _this.currentPage -= 1;
                    }
                    break;
                case '+':
                    if (_this.currentPage < _this.getTotalPages()) {
                        _this.currentPage += 1;
                    }
                    break;
                case '<':
                    _this.currentPage = _this.section.startPage - 1;
                    break;
                case '>':
                    _this.currentPage = _this.getStartPage(_this.section.section + 1);
                    break;
                default:
                    _this.currentPage = angular.isNumber(option) ? option : parseInt(option);
            }
        }

        paginationData.prototype.indicator = function () {
            var _this = this;
            if (_this.totalItems <= 0 || _this.currentPage <= 0) {
                return 'no result find';
            }
            else {
                var stringBuilder = '';
                var startItem = (_this.currentPage - 1) * _this.pageSize + 1;
                var endItem = this.currentPage * _this.pageSize;
                if (endItem > _this.totalItems)
                    endItem = _this.totalItems;
                stringBuilder = startItem + ' - ' + endItem + ' of ' + _this.totalItems + ' items';
                return stringBuilder;
            }
        }

        return paginationData;
    });

    paginationModule.service('paginationItem', function () {
        function paginationItem() {
            this.active = false;
            this.value = '';
        }
        return paginationItem;
    });

    paginationModule.directive('ctPagination', ['$parse',function ($parse) {
        return {
            restrict: 'AE',
            scope: {
                callback:'&ctCallback',
                pagination : '=ctPagination'
            },
            replace: true,
            templateUrl: '/AgControlTemp/Pagination',
            link:function(scope,element,attrs){
                var pagination = scope.pagination;
                scope.$watch('pagination.currentPage', function (newValue, oldValue) {
                    if (oldValue === newValue || !newValue)
                        return;
                    if (pagination.currentPage > pagination.getTotalPages())
                        pagination.currentPage = pagination.getTotalPages();
                    else {
                        if (angular.isDefined(scope.callback)) {
                            if (typeof scope.callback === 'function')
                                scope.callback();
                        }
                    }
                    pagination.createSection();
                });

                scope.$watch('pagination.pageSize', function (nVal, oVal) {
                    if (nVal === oVal || !nVal)
                        return;
                    if (angular.isDefined(scope.callback)) {
                        if (typeof scope.callback === 'function')
                            scope.callback();
                    }
                })

                scope.$watch('pagination.getTotalPages()', function (newvalue, oldValue) {
                    if (oldValue === newvalue)
                        return;
                    pagination.currentSections = [];
                    if (pagination.currentPage > pagination.getTotalPages())
                        pagination.currentPage = pagination.getTotalPages();
                    else {
                        if (pagination.currentPage <= 0 && pagination.getTotalPages() > 0)
                            pagination.currentPage = 1;
                        pagination.createSection();
                    }
                })
            }
            
        }
    }])
})();
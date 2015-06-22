+(function () {
    'use strict';

    var dateInputModule = angular.module('control.dateInput', ['_base']);

    dateInputModule.value('monthsAffix', {
        affix: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    });

    dateInputModule.service('dtInputData', ['monthsAffix',
        function (monthsAffix) {
            var dtInputData = function (config, complexType) {
                var date;
                if (!config)
                    return;
                if (complexType) {
                    date = config.date;
                }
                else {
                    if (typeof config === 'string') {
                        date = new Date(config);
                    }
                    else
                        date = config;
                }

                if (angular.isDate(date)) {
                    this.year = date.getFullYear();
                    this.month = {
                        value: date.getMonth(),
                        name: monthsAffix.affix[date.getMonth()]
                    }
                    this.day = {
                        value: date.getDate(),
                        name: date.getDate()
                    }
                }
                else {
                    if (complexType) {
                        this.year = isNaN(config.year) ? undefined : config.year;
                        if (angular.isDefined(config.month) && !isNaN(config.month)) {
                            this.month = {
                                value: config.month,
                                name: monthsAffix.affix[config.month]
                            }
                        }
                        else this.month = undefined;

                        if (angular.isDefined(config.day) && !isNaN(config.day)) {
                            this.day = {
                                value: config.day,
                                name: monthsAffix.affix[config.day]
                            }
                        }
                        else this.day = undefined;
                    }
                    else {
                        this.year = undefined;
                        this.month = undefined;
                        this.day = undefined;
                    }
                }
            }
            return dtInputData;
        }])


    dateInputModule.directive('dtInput', ['monthsAffix', 'dtInputData',
        function (monthsAffix, dtInputData) {
            return {
                restrict: 'AE',
                replace: true,
                scope: {
                    inputDate: '=',
                    complexDate: '@'
                },
                templateUrl: '/AgControlTemp/DTInput',
                link: function (scope, element, attrs) {
                    var startYear = 2010;
                    scope.dateCollections = {
                        years: [],
                        months: [],
                        days: [],
                    }

                    scope.date = new dtInputData(scope.inputDate, scope.complexDate);
                    adjustDayOption();

                    while (startYear < 2020) {
                        scope.dateCollections.years.push(startYear);
                        startYear++;
                    }
                    angular.forEach(monthsAffix.affix, function (month, index) {
                        var monthObj = {
                            value: index,
                            name: month
                        }
                        scope.dateCollections.months.push(monthObj);
                    })

                    scope.$watch('date', function (nVal, oVal) {
                        if (nVal.year != oVal.year || nVal.month != oVal.month) {
                            adjustDayOption();
                        }
                        if (nVal != oVal)
                            createDate();

                    }, true)

                    function adjustDayOption() {
                        scope.dateCollections.days = [];
                        if (angular.isDefined(scope.date.year) && angular.isDefined(scope.date.month)) {
                            var year = parseInt(scope.date.year);
                            var month = parseInt(scope.date.month.value);
                            if (!isNaN(year) && !isNaN(month)) {
                                var date = new Date(year, (month + 1), 0);
                                var days = date.getDate();
                                for (var i = 1; i <= days; i++) {
                                    var dayObj = {
                                        value: i,
                                        name: i
                                    }
                                    scope.dateCollections.days.push(dayObj);
                                }
                            }
                        }
                    }

                    function createDate() {
                        var year = parseInt(scope.date.year);
                        var month = scope.date.month ? parseInt(scope.date.month.value) : Number.NaN;
                        var day = scope.date.day ? parseInt(scope.date.day.value) : Number.NaN;
                        if (scope.complexDate) {
                            var complexDate = {
                                year: isNaN(year) ? '' : year,
                                month: isNaN(month) ? '' : month,
                                day: isNaN(day) ? '' : day,
                            };

                            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                var date = new Date(Date.UTC(year, month, day));
                                //var date = new Date(year, month, day);
                                angular.isDate(date);
                                //date.setHours(date.getHours() + 11);
                                //date.setHours(date.getHours());
                                complexDate.date = date;
                            }
                            scope.inputDate = complexDate;
                            return;
                        }
                        else {
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                var date = new Date(Date.UTC(year, month, day));
                                //var date = new Date(year, month, day);
                                angular.isDate(date);
                                //date.setHours(date.getHours() + 11);
                                //date.setHours(date.getHours());
                                scope.inputDate = date;
                                return;
                            }
                        }
                        scope.inputDate = undefined;
                    }

                }
            }
        }]);

})()
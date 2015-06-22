+(function () {
    'use strict';

    var carouselModule = angular.module('control.carousel', ['_base']);

    carouselModule.service('imageData',function(){
        function imageData(data) {
            this.active = false;
            this.ID = data.ID || data.id;
        }
        return imageData;
    })

    carouselModule.directive('carouselDir', ['generalSer', function (generalSer) {
        return {
            restrict: 'AE',
            scope: {
                imagesData: '=',
                imageServiceUrl: '=',
                rightMenu: '=',
                config :'=carouselConfig'
            },
            templateUrl: '/AGControlTemp/Carousel',
            link: function (scope, element, attrs) {
                if (!angular.isDefined(scope.imageServiceUrl)) {
                    if (angular.isDefined(attrs.imageServiceUrl)) {
                        scope.imageServiceUrl = scope.$eval(attrs.imageServiceUrl);
                    };
                }
                scope.getThumbnailUrl = function (image) {
                    if (image.ID) {
                        return scope.imageServiceUrl + image.ID + '/thumbnail';
                    }
                }

                scope.goPrev = function () {
                    if (!angular.isDefined(scope.imagesData) || scope.imagesData.length == 0)
                        return;
                    var index = removeActive();
                    switch (true) {
                        case index == 0:
                            scope.imagesData[scope.imagesData.length - 1].active = true;
                            break;
                        default:
                            scope.imagesData[index - 1].active = true;
                            break;
                    }

                }
                scope.goNext = function () {
                    if (!angular.isDefined(scope.imagesData) || scope.imagesData.length == 0)
                        return;
                    var index = removeActive();
                    switch (true) {
                        case index == scope.imagesData.length -1:
                            scope.imagesData[0].active = true;
                            break;
                        default:
                            scope.imagesData[index + 1].active = true;
                            break;
                    }
                }
                scope.setActive = function (image) {
                    if (!angular.isDefined(scope.imagesData) || scope.imagesData.length == 0)
                        return;
                    removeActive();
                    image.active = true;
                }

                function removeActive() {
                    var activeIndex = generalSer.findObjectIndex('active', true, scope.imagesData);
                    if (activeIndex >= 0) {
                        scope.imagesData[activeIndex].active = false;
                    }
                    return activeIndex;
                }

            },

        }
    }])

})()
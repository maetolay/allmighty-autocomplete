/* --- Made by justgoscha and licensed under MIT license --- */

var app = angular.module('autocomplete', []);

app.directive('autocomplete', function () {
    var index = -1;

    return {
        restrict: 'E',
        scope: {
            searchParam: '=ngModel',
            suggestions: '=data',
            onType: '=onType',
            onSelect: '=onSelect',
            autocompleteRequired: '=',
            autoPlaceholder: '='
        },
        controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
            // the index of the suggestions that's currently selected
            $scope.selectedIndex = -1;
            $scope.selectedGroup = 'g';
            $scope.ulCount = 1;

            $scope.initLock = true;

            // set new index
            $scope.setIndex = function (i) {
                $scope.selectedIndex = i;
            };

            $scope.setGroup = function (g) {
                $scope.selectedGroup = g;
            };

            this.setIndex = function (i) {
                $scope.setIndex(i);
                $scope.$apply();
            };

            $scope.getIndex = function (i) {
                return $scope.selectedIndex;
            };

            // watches if the parameter filter should be changed
            var watching = true;

            // autocompleting drop down on/off
            $scope.completing = false;

            // starts autocompleting on typing in something
            $scope.$watch('searchParam', function (newValue, oldValue) {

                if (oldValue === newValue || (!oldValue && $scope.initLock)) {
                    return;
                }

                if (watching && typeof $scope.searchParam !== 'undefined' && $scope.searchParam !== null) {
                    $scope.completing = true;
                    $scope.searchFilter = $scope.searchParam;
                    $scope.selectedIndex = -1;
                }

                // function thats passed to on-type attribute gets executed
                if ($scope.onType) {
                    $scope.onType($scope.searchParam);
                }

                if (!$rootScope.$$phase) {
                    $scope.$apply();
                }
                else {
                    $timeout(function () {
                        $scope.$apply();
                    });
                }
            });

            // for hovering over suggestions
            this.preSelect = function (suggestion) {

                watching = false;

                // this line determines if it is shown
                // in the input field before it's selected:
                //$scope.searchParam = suggestion;

                $scope.$apply();
                watching = true;

            };

            $scope.preSelect = this.preSelect;

            this.preSelectOff = function () {
                watching = true;
            };

            $scope.preSelectOff = this.preSelectOff;

            // selecting a suggestion with RIGHT ARROW or ENTER
            $scope.select = function (suggestion) {
                if (suggestion) {
                    $scope.searchParam = suggestion;
                    $scope.searchFilter = suggestion;
                    if ($scope.onSelect)
                        $scope.onSelect(suggestion);
                }
                watching = false;
                $scope.completing = false;
                setTimeout(function () {
                    watching = true;
                }, 1000);
                $scope.setIndex(-1);
            };

            $scope.isGroup = function () {
                return angular.isObject($scope.suggestions[0]);
            }
        }],
        link: function (scope, element, attrs) {

            setTimeout(function () {
                scope.initLock = false;
                scope.$apply();
            }, 250);

            var attr = '';

            // Default atts
            scope.attrs = {
                "placeholder": "",
                "class": "",
                "id": "",
                "inputclass": "",
                "inputid": ""
            };

            for (var a in attrs) {
                attr = a.replace('attr', '').toLowerCase();
                // add attribute overriding defaults
                // and preventing duplication
                if (a.indexOf('attr') === 0) {
                    scope.attrs[attr] = attrs[a];
                }
            }

            if (attrs.clickActivation) {
                element[0].onclick = function (e) {
                    if (angular.element(e.target).is('input')) {
                        setTimeout(function () {
                            scope.searchFilter = '';
                            scope.completing = true;
                            scope.$apply();
                        }, 0);
                    }
                };
            }

            var key = {left: 37, up: 38, right: 39, down: 40, enter: 13, esc: 27, tab: 9};

            document.addEventListener("keydown", function (e) {
                var keycode = e.keyCode || e.which;

                switch (keycode) {
                    case key.esc:
                        // disable suggestions on escape
                        scope.select();
                        scope.setIndex(-1);
                        scope.$apply();
                        e.preventDefault();
                }
            }, true);

            document.addEventListener("blur", function (e) {
                // disable suggestions on blur
                // we do a timeout to prevent hiding it before a click event is registered
                setTimeout(function () {
                    scope.select();
                    scope.setIndex(-1);
                    scope.$apply();
                }, 150);
            }, true);

            element[0].addEventListener("keydown", function (e) {
                var keycode = e.keyCode || e.which;

                var ul = angular.element(this).find('ul');
                var l = angular.element(this).find('li').length;

                // this allows submitting forms by pressing Enter in the autocompleted field
                if (!scope.completing || l == 0) return;

                // implementation of the up and down movement in the list of suggestions
                switch (keycode) {
                    case key.up:

                        index = scope.getIndex() - 1;
                        if (index < -1) {
                            index = (l - 1);
                        } else if (index >= l) {
                            index = -1;
                            scope.setIndex(index);
                            scope.preSelectOff();
                            break;
                        }
                        scope.setIndex(index);

                        var i = 0;
                        for (var j in angular.element(this).find('li')) {
                            var child = angular.element(this).find('li')[j];
                            if (typeof child == 'object') {
                                if (angular.element(child) && angular.element(child).hasClass('active')) {
                                    angular.element(child).removeClass('active');
                                }
                                if (i == index) {
                                    angular.element(child).addClass('active');
                                }
                                i++;
                            }
                        }

                        if (index !== -1)
                            scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

                        scope.$apply();

                        break;
                    case key.down:
                        index = scope.getIndex() + 1;
                        if (index < -1) {
                            index = (l - 1);
                        } else if (index >= l) {
                            index = -1;
                            scope.setIndex(index);
                            scope.setGroup(angular.element(angular.element(this).find('li')[index]).attr('group'));
                            scope.preSelectOff();
                            scope.$apply();
                            break;
                        }
                        scope.setIndex(index);
                        scope.setGroup(angular.element(angular.element(this).find('li')[index]).attr('group'));

                        var i = 0;
                        for (var j in angular.element(this).find('li')) {
                            var child = angular.element(this).find('li')[j];
                            if (typeof child == 'object') {
                                if (angular.element(child) && angular.element(child).hasClass('active')) {
                                    angular.element(child).removeClass('active');
                                }
                                if (i == index) {
                                    angular.element(child).addClass('active');
                                }
                                i++;
                            }
                        }

                        if (index !== -1)
                            scope.preSelect(angular.element(angular.element(this).find('li')[index]).text());

                        break;
                    case key.left:
                        break;
                    case key.right:
                    case key.enter:
                    case key.tab:

                        index = scope.getIndex();
                        // scope.preSelectOff();
                        if (index !== -1) {
                            scope.select(angular.element(angular.element(this).find('li')[index]).text());
                            if (keycode == key.enter) {
                                e.preventDefault();
                            }
                        } else {
                            if (keycode == key.enter) {
                                scope.select();
                            }
                        }
                        scope.setIndex(-1);
                        scope.$apply();

                        break;
                    case key.esc:
                        // disable suggestions on escape
                        scope.select();
                        scope.setIndex(-1);
                        scope.$apply();
                        e.preventDefault();
                        break;
                    default:
                        return;
                }

            });
        },
        template: '\
        <div class="autocomplete {{ attrs.class }}" id="{{ attrs.id }}">\
          <input\
            type="text"\
            ng-model="searchParam"\
            placeholder="{{ autoPlaceholder }}"\
            class="{{ attrs.inputclass }}"\
            id="{{ attrs.inputid }}"\
            ng-required="{{ autocompleteRequired }}" />\
          <ul class="list" ng-if="!isGroup()" ng-show="completing">\
            <li\
              suggestion\
              ng-repeat="suggestion in suggestions | filter:searchFilter | orderBy:\'toString()\' track by $index"\
              index="{{ $index }}"\
              val="{{ suggestion }}"\
              group="g"\
              ng-click="select(suggestion)"\
              ng-bind-html="suggestion | highlight:searchParam"></li>\
          </ul>\
          <div ng-if="isGroup()" class="list" ng-show="completing">\
              <div  ng-repeat="(group, children) in suggestions | filter:searchFilter | groupBy:\'group\'  track by $index">\
              <h2>{{ group }}</h2>\
              <ul>\
                <li\
                  suggestion\
                  ng-repeat="suggestion in children"\
                  index="{{ group + $index }}"\
                  val="{{ suggestion.value }}"\
                  group="{{ group }}"\
                  ng-click="select(suggestion.value)"\
                  ng-bind-html="suggestion.value | highlight:searchParam"></li>\
              </ul>\
              </div>\
          </div>\
        </div>'
    };
});

app.filter('highlight', ['$sce', function ($sce) {
    return function (input, searchParam) {
        if (typeof input === 'function') return '';
        if (searchParam) {
            var words = '(' +
                    searchParam.split(/\ /).join(' |') + '|' +
                    searchParam.split(/\ /).join('|') +
                    ')',
                exp = new RegExp(words, 'gi');
            if (words.length) {
                input = input.replace(exp, "<span class=\"highlight\">$1</span>");
            }
        }
        return $sce.trustAsHtml(input);
    };
}]);

app.directive('suggestion', function () {
    return {
        restrict: 'A',
        require: '^autocomplete', // ^look for controller on parents element
        link: function (scope, element, attrs, autoCtrl) {
            element.bind('mouseenter', function () {
                angular.element(element).addClass('active');
            });

            element.bind('mouseleave', function () {
                angular.element(element).removeClass('active');
            });
        }
    };
});

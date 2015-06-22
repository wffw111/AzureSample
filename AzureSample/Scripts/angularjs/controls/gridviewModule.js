+(function () {
    'use strict'

    var gridViewModule = angular.module('control.gridView', ["_base", "item.filter"]);

    gridViewModule.service('columnData', function () {
        function columnData(id, option) {
            if (angular.isDefined(option)) {
                this.width = angular.isDefined(option.width) ? option.width : 180;
                this.name = option.name;
                this.nameCollection = this.name.split('/');
                var type = option.type || 'string';
                if (type) {
                    type = type.replace(/ /g, '')
                }
                this.type = type.toLowerCase();
                this.displayName = option.displayName;
                this.reportName = option.reportName;
                this.locked = angular.isDefined(option.locked) ? option.locked : false;
                this.active = angular.isDefined(option.active) ? option.active : true;
                this.canSearch = angular.isDefined(option.canSearch) ? option.canSearch : false;
                this.canFilter = angular.isDefined(option.canFilter) ? option.canFilter : false;
                this.canSort = angular.isDefined(option.canSort) ? option.canSort : false;
                this.cssClass = id + '-cell-column-' + this.name;
                this.styleTagClass = this.cssClass.indexOf('/') > -1 ?
                     this.cssClass.replace(/\//g, '\\/') : this.cssClass;

                this.sortEnums = {
                    desc: 'desc',
                    asc: 'asc'
                }
                //this.sortAction = option.defaultSortAction || this.sortEnums.none;
                this.multiSelect = angular.isDefined(option.multiSelect) ? option.multiSelect : false;
                if (this.multiSelect) {
                    this.multiSelectUrl = option.multiSelectUrl || undefined;
                    this.multiSelectMethod = option.multiSelectMethod || undefined;
                    this.selectValueKey = option.selectValueKey || '';
                    this.selectTextKey = option.selectTextKey || '';
                }
            }
            else
                throw "column config not defined"


        }

        columnData.prototype.cssString = function (left) {
            var _this = this;
            return '.' + _this.styleTagClass + '{'
                    + 'width:' + _this.width + 'px;' + 'left:' + left + 'px;' +
                    (_this.active ? 'display:block;}' : 'display:none;}')
        }

        columnData.prototype.checkSort = function (sortOption) {
            return this.sortAction === sortOption;
        }

        columnData.prototype.getFilterTempUrl = function () {
            var type = this.type;
            if (type)
                type = type.toLowerCase();
            switch (true) {
                case this.multiSelect:
                    return '/AgControlTemp/MultiSelectFilterTemp'
                    break;
                case type.indexOf('string') > -1:
                    return '/AgControlTemp/DefaultFilterTemp'
                    break;
                case type.indexOf('decimal') > -1:
                case type.indexOf('int') > -1:
                case type.indexOf('money') > -1:
                    return '/AgControlTemp/NumberFilterTemp'
                    break;
                case type.indexOf('datetime') > -1:
                    return '/AgControlTemp/DateFilterTemp'
            }
        }

        return columnData;
    });

    gridViewModule.service('rowData', function () {
        function rowData(data) {
            this.data = data || undefined;
            this.selected = false;
        }
        return rowData;
    })

    gridViewModule.service('gridViewData', ['$http', 'manageCols', 'elementId', 'queryAssembly',
        'generalSer', 'manageGrid', 'globalFocusItem', 'rowData', 'globalModalDialog', '$timeout', '$q', 'gridHelpFactory',
        function ($http, manageCols, elementId, queryAssembly, generalSer, manageGrid,
            globalFocusItem, rowData, globalModalDialog, $timeout, $q, gridHelpFactory) {

            function gridViewData(configUrl, config) {
                this.name = 'My First Angular Grid';

                this.columns = [];
                this.searchCols = [];
                this.searchResourceCols = [];
                this.sortCols = [];
                this.filterGroups = [];
                this.menuActiveCol = undefined;

                this.bodyHeight = 500;
                this.configUrl = configUrl;
                this.config = config;
                this.dataPool = [];
                this.selectedRows = [];

                this.id = elementId.id();
                this.styleId = this.id + '_style';

                this.searchKey = '';
                this.originalSearchKey = '';

                this.fullGetQuery = '';

                this.pagination = undefined;

                this.columnMenuPos = {
                    top: 0,
                    left: 0
                };

                this.apiCall = false;

                this.editMode = false;
                this.posIndicator = false;

                this.gridRect = undefined;
                this.resizing = false;

                this.rowCusMenuTempUrl = undefined;

                this.addConfig = {
                    templateUrl: undefined,
                    copyAddTemplateUrl: undefined,
                    title: undefined,
                    copyAdd: false,
                    supportCopyAdd: false
                }

                this.editConfig = {
                    templateUrl: undefined,
                    edit: false,
                    quickEdit: false,
                    title: undefined,
                    supportQuickEdit: false
                }

                this.initialized = false;
                this.GridMenuTemplate = '/AgControlTemp/GridMenuTemplate';

                this.additionalProps = {}
            }

            gridViewData.prototype.initialize = function () {
                var _this = this;

                //#region initialize grid style
                var head = angular.element(document.querySelector('head'));
                if (head.find('#' + _this.styleId).length <= 0) {
                    var style = angular.element('<style>');
                    style.attr('id', _this.styleId);
                    head.append(style);
                }
                //#endregion

                if (_this.configUrl) {
                    $http.get(_this.configUrl).then(function (response) {
                        if (response.data) {
                            _this.config = response.data;
                            _this.initialized = true;
                        }
                    })
                    .then(function () {
                        manageCols.init(_this);
                        manageCols.headStyle(_this);
                        manageGrid.initSorting(_this);
                        manageGrid.initFilter(_this);
                        manageGrid.init(_this);
                        queryAssembly.assembly(_this);

                    })
                }
                else {
                    _this.initialized = true;
                    manageCols.init(_this);
                    manageCols.headStyle(_this);
                    manageGrid.initSorting(_this);
                    manageGrid.initFilter(_this);
                    manageGrid.init(_this);
                    queryAssembly.assembly(_this);

                }
            }

            gridViewData.prototype.assembleQuery = function (refresh) {
                queryAssembly.assembly(this, refresh);
            }

            gridViewData.prototype.addRowData = function (data) {
                var _this = this;
                if (data) {
                    var key = data[_this.config.key];
                    if (angular.isDefined(key)) {
                        var propName = 'data/' + _this.config.key;
                        var Index = generalSer.findObjectIndex(propName, key, _this.dataPool, true);
                        if (Index < 0) {
                            _this.dataPool.unshift(new rowData(data));
                        }
                    }
                }
            }

            gridViewData.prototype.replaceRowData = function (data) {
                var _this = this;
                if (data) {
                    var key = data[_this.config.key];
                    if (angular.isDefined(key)) {
                        var propName = 'data/' + _this.config.key;
                        var Index = generalSer.findObjectIndex(propName, key, _this.dataPool, true);
                        if (Index > -1) {
                            _this.dataPool[Index] = new rowData(data);
                        }
                    }
                }
            }

            gridViewData.prototype.load = function () {
                var _this = this;

                var timer = $timeout(function () {
                    _this.apiCall = true;
                }, 100)

                $http.get(_this.fullGetQuery).then(function (response) {
                    if (response.data) {
                        if (angular.isDefined(response.data.value)
                        && angular.isArray(response.data.value)) {
                            _this.dataPool = [];
                            angular.forEach(response.data.value, function (row, index) {
                                var data = new rowData(row);
                                _this.dataPool.push(data);
                            })
                        }
                        if (angular.isDefined(response.data['odata.count'])) {
                            var total = response.data['odata.count'];
                            if (!angular.isNumber(total)) {
                                total = parseInt(total);
                                if (isNaN(total)) {
                                    total = 0;
                                }
                            }
                            if (_this.pagination && _this.pagination.totalItems != total) {
                                _this.pagination.totalItems = total;
                            }
                        }
                    }
                }).finally(function () {
                    if (timer)
                        $timeout.cancel(timer);
                    _this.apiCall = false;
                });
            }

            gridViewData.prototype.reload = function () {
                reloadHelper(this);
            }

            gridViewData.prototype.refresh = function () {
                reloadHelper(this, true);
            }

            gridViewData.prototype.singleLoad = function (key) {
                var _this = this;
                var deferred = $q.defer();

                var query = queryAssembly.singleLoadQuery(_this, key);
                if (query) {
                    var timer = $timeout(function () {
                        _this.apiCall = true;
                    }, 100);
                    $http.get(query).then(function (response) {
                        if (response.data) {
                            deferred.resolve(response.data);
                        }
                    }, function (error) {
                        deferred.reject(error);
                    }).finally(function () {
                        if (timer)
                            $timeout.cancel(timer);
                        _this.apiCall = false;
                    });
                }
                else {
                    deferred.reject('no query');
                }
                return deferred.promise;
            }

            gridViewData.prototype.singleUpdateLoad = function (key) {
                var _this = this;
                var deferred = $q.defer();

                var query = queryAssembly.singleUpdateLoadQuery(_this, key);
                if (query) {
                    var timer = $timeout(function () {
                        _this.apiCall = true;
                    }, 100);
                    $http.get(query).then(function (response) {
                        if (response.data) {
                            deferred.resolve(response.data);
                        }
                    }, function (error) {
                        deferred.reject(error);
                    }).finally(function () {
                        if (timer)
                            $timeout.cancel(timer);
                        _this.apiCall = false;
                    });
                }
                else {
                    deferred.reject('no query');
                }
                return deferred.promise;
            }

            gridViewData.prototype.singleUpdate = function (key, model) {
                var _this = this;
                var deferred = $q.defer();

                if (model) {
                    var query = queryAssembly.singleUpdateQuery(_this, key);
                    if (query) {
                        var timer = $timeout(function () {
                            _this.apiCall = true;
                        }, 100);
                        var editFn = undefined;
                        if (_this.config.editMethod
                            && _this.config.editMethod.toLowerCase() === 'patch') {
                            editFn = $http.patch;
                        }
                        else
                            editFn = $http.put
                        editFn(query, model).then(function (response) {
                            if (response.data) {
                                deferred.resolve(response.data);
                            }
                        }, function (error) {
                            deferred.reject(error);
                        }).finally(function () {
                            if (timer)
                                $timeout.cancel(timer);
                            _this.apiCall = false;
                        });
                    }
                    else {
                        deferred.reject('no query');
                    }
                    return deferred.promise;
                }
            }

            gridViewData.prototype.search = function (e) {
                if (angular.isDefined(e) && typeof e.preventDefault == 'function') {
                    e.preventDefault();
                }
                var _this = this;
                //if (_this.originalSearchKey == _this.searchKey)
                //    return;
                _this.assembleQuery();
                _this.originalSearchKey = angular.copy(_this.searchKey);
            }

            gridViewData.prototype.handleSelectedRow = function (rowData, select) {
                if (!angular.isDefined(rowData))
                    return;
                if (generalSer.checkTextSelect())
                    return;
                if (this.selectedRows.length > 0) {
                    if (this.selectedRows[0] === rowData) {
                        if (!select) {
                            rowData.selected = false;
                            var row = this.selectedRows.splice(0, 1);
                        }
                    }
                    else {
                        this.selectedRows[0].selected = false;
                        rowData.selected = true;
                        this.selectedRows[0] = rowData;
                    }
                }
                else {
                    rowData.selected = true;
                    this.selectedRows.push(rowData);
                }
            }

            gridViewData.prototype.setCopyAddStatus = function (status) {
                if (this.selectedRows.length == 0) {
                    globalModalDialog.openNotice('There is no Grid Row being selected. Please select a row first.');
                    return;
                }

                if (angular.isDefined(status)) {
                    this.addConfig.copyAdd = status;
                }
                else {
                    this.addConfig.copyAdd = !this.addConfig.copyAdd;
                }
            }

            gridViewData.prototype.setEditStatus = function (status) {
                if (this.selectedRows.length == 0) {
                    globalModalDialog.openNotice('There is no Grid Row being selected. Please select a row first.');
                    return;
                }
                if (angular.isDefined(status)) {
                    this.editConfig.edit = status;
                }
                else {
                    this.editConfig.edit = !this.editConfig.edit;
                }
            }
            gridViewData.prototype.setQuickEditStatus = function (status) {
                if (this.selectedRows.length == 0) {
                    globalModalDialog.openNotice('There is no Grid Row being selected. Please select a row first.');
                    return;
                }

                if (angular.isDefined(status)) {
                    this.editConfig.quickEdit = status;
                }
                else {
                    this.editConfig.quickEdit = !this.editConfig.quickEdit;
                }
            }

            function reloadHelper(data, refresh) {
                var _this = data;
                var preQuery = _this.fullGetQuery;
                _this.assembleQuery(refresh);
                if (preQuery === _this.fullGetQuery)
                    _this.load();
            }

            return gridViewData;
        }])

    gridViewModule.service('menuExtender', function () {
        function menuExtender() {
            this.active = false;
            this.name = '';
        }
        return menuExtender;
    })

    gridViewModule.service('sortingHelper', function () {
        return function (column, sortCols, sortOption) {

            if (!column.canSort)
                return;
            if (column.finishResizing) {
                column.finishResizing = undefined;
                return;
            }

            if (!angular.isDefined(column.sortAction))
                column.sortAction = '';

            var index = sortCols.indexOf(column);
            if (sortOption) {
                if (column.sortAction === sortOption && column.sortAction != column.sortEnums.none) {
                    column.sortAction = '';
                }
                else {
                    column.sortAction = sortOption;
                }
                if (column.sortAction === column.sortEnums.none || column.sortAction == '') {
                    if (index >= 0) {
                        sortCols.splice(index, 1);
                    }
                }
                else {
                    if (index < 0) {
                        sortCols.push(column);
                    }
                }
            }
            else {
                switch (column.sortAction) {
                    case column.sortEnums.asc:
                        column.sortAction = column.sortEnums.desc;
                        if (index < 0) {
                            sortCols.push(column);
                        }
                        break;
                    case column.sortEnums.desc:
                        column.sortAction = '';
                        if (index >= 0) {
                            sortCols.splice(index, 1);
                        }
                        break;
                    case column.sortEnums.none:
                        column.sortAction = column.sortEnums.asc;
                        if (index < 0) {
                            sortCols.push(column);
                        }
                        break;
                    default:
                        column.sortAction = column.sortEnums.asc;
                        if (index < 0) {
                            sortCols.push(column);
                        }
                        break;
                }
            }
        }
    })

    gridViewModule.factory('elementId', ['generalSer', function (generalSer) {
        var appId = [];
        function createId() {
            var elementId = '';
            var i = 0;
            do {
                elementId = generalSer.ramdonStr();
                i++;
            }
            while (generalSer.idExist(elementId) && i < 100 && appId.indexOf(elementId) < 0)
            appId.push(elementId)
            return elementId;
        }
        return {
            id: function () {
                return createId();

            }
        }

    }]);

    gridViewModule.factory("manageCols", ['columnData', 'filterFilter',
        function (columnData, filterFilter) {
            return {
                init: function (gridData) {
                    var _this = gridData;
                    if (angular.isDefined(_this.config.columns) && angular.isArray(_this.config.columns)) {
                        var columnConfig = _this.config.columns;
                        angular.forEach(columnConfig, function (obj, index) {
                            var column = new columnData(_this.id, obj);
                            _this.columns.push(column);
                            if (column.canSearch) {
                                _this.searchCols.push(column);
                            }
                        });
                        _this.searchResourceCols = angular.copy(_this.searchCols);
                    }
                },
                headStyle: function (gridData) {
                    var _this = gridData;
                    var stringBuilder = '';
                    if (_this.columns.length > 0) {
                        var left = 0;
                        angular.forEach(_this.columns, function (obj, index) {
                            stringBuilder += obj.cssString(left);
                            if (obj.active) {
                                if (angular.isNumber(obj.width))
                                    left += obj.width;
                                else if (!isNaN(parseInt(obj.width))) {
                                    left += parseInt(obj.width);
                                }
                                else
                                    return;
                            }
                        });
                    }
                    stringBuilder += '#' + _this.id + ' ' + '.grid-normal-body' + ' ' + '.grid-row' +
                        '{margin-left:' + -(this.bodyWidth(_this, true)) + 'px;}';
                    angular.element(document.querySelector('head')).find('#' + _this.styleId).text(stringBuilder);
                },
                bodyWidth: function (gridData, locked) {
                    var stickedArray = filterFilter(gridData.columns, { 'locked': locked });
                    var width = 0;
                    angular.forEach(stickedArray, function (obj, index) {
                        if (obj.active)
                            width += obj.width;
                    })
                    return width;
                },
                stickedHeight: function (body) {
                    return body[0].clientHeight;
                }
            }
        }])

    gridViewModule.factory("manageGrid", ['sortingHelper', 'generalSer', 'filterGroup', 'filterItem',
        function (sortingHelper, generalSer, filterGroup, filterItem) {
            return {
                init: function (gridData) {
                    if (gridData.config) {
                        gridData.bodyHeight = gridData.config.bodyHeight || 400;
                    }
                },
                initSorting: function (gridData) {
                    if (gridData.config) {
                        if (angular.isDefined(gridData.config.sortConfigs)) {
                            var configs = gridData.config.sortConfigs;
                            if (angular.isArray(configs) && configs.length > 0) {
                                gridData.sortCols = [];
                                configs = configs[0];
                                angular.forEach(configs, function (obj, index) {
                                    var pos = generalSer.findObjectIndex('name', obj.name, gridData.columns);
                                    if (pos != -1) {
                                        sortingHelper(gridData.columns[pos], gridData.sortCols, obj.sortAction);
                                    }
                                })
                            }
                        }
                    }
                },
                initFilter: function (gridData) {
                    if (gridData.config) {
                        if (angular.isDefined(gridData.config.filterConfigs)) {
                            var configs = gridData.config.filterConfigs;
                            if (angular.isArray(configs) && configs.length > 0) {
                                gridData.filterGroups = [];
                                configs = configs[0];
                                if (angular.isArray(configs)) {
                                    angular.forEach(configs, function (obj, index) {
                                        var fGroup = new filterGroup({
                                            name: obj.name,
                                            displayName: obj.displayName
                                        });
                                        if (angular.isDefined(obj.items) && angular.isArray(obj.items)) {
                                            angular.forEach(obj.items, function (item, j) {
                                                var fItem = new filterItem(item)
                                                fGroup.items.push(fItem);
                                            })
                                        }
                                        gridData.filterGroups.push(fGroup);
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }])

    gridViewModule.factory('queryAssembly', ['generalSer', 'valueTypes', function (generalSer, valueTypes) {
        return {
            assembly: function (gridData, refresh) {
                var _this = gridData;

                var searchQuery = this.searchQuery(_this, refresh);

                var filterQuery = this.filterQuery(_this, refresh);

                if (searchQuery)
                    filterQuery = searchQuery + (filterQuery ? ' and ' + filterQuery : '');
                else {
                    filterQuery = (filterQuery ? filterQuery : '');
                }
                if (filterQuery)
                    filterQuery = '$filter=' + filterQuery;

                var pageQuery = this.pageQuery(_this.pagination, refresh);

                var sortQuery = this.sortQuery(_this, refresh);

                //---------------------------------
                //Full Query Assembly
                //---------------------------------
                //#region Full Query Assembly
                gridData.fullGetQuery = _this.config.dataSource.get + '?' +
                    (_this.config.dataSource.getDefault ? _this.config.dataSource.getDefault + '&' : '') +
                    '$inlinecount=allpages' +
                    (filterQuery ? '&' + filterQuery : '') +
                    (sortQuery ? '&' + sortQuery : '') +
                    (pageQuery ? '&' + pageQuery : '');
                //#endregion
                //return fullGetQuery;
            },
            noPageQuery: function (gridData) {
                var _this = gridData;
                var searchQuery = this.searchQuery(_this);

                var filterQuery = this.filterQuery(_this);

                if (searchQuery)
                    filterQuery = searchQuery + (filterQuery ? ' and ' + filterQuery : '');
                else {
                    filterQuery = (filterQuery ? filterQuery : '');
                }
                if (filterQuery)
                    filterQuery = '$filter=' + filterQuery;

                var sortQuery = this.sortQuery(_this);



                var returnQuery = (filterQuery ? '&' + filterQuery : '') +
                    (sortQuery ? '&' + sortQuery : '');

                if (returnQuery.indexOf('&') == 0) {
                    returnQuery = returnQuery.substr(1);
                }
                return returnQuery;

            },
            pageQuery: function (pagination, refresh) {
                var pageQuery = '';
                if (pagination) {
                    pageQuery = '$top=' + pagination.pageSize;
                    if (refresh) {
                        pagination.currentPage = 1;
                    }
                    else {
                        if (pagination.currentPage > 1) {
                            pageQuery += '&$skip=' + (pagination.pageSize * (pagination.currentPage - 1));
                        }
                    }
                }
                return pageQuery;
            },
            searchQuery: function (gridData, refresh) {
                if (refresh) {
                    gridData.searchKey = '';
                    gridData.originalSearchKey = '';
                    return;
                }
                if (gridData.searchCols.length < 0 || !gridData.searchKey)
                    return;
                var searchQuery = '';
                var searchCols = generalSer.findObject('type', 'Edm.String', gridData.searchCols);
                if (searchCols && searchCols.length > 0)
                    angular.forEach(searchCols, function (obj, i) {
                        if (searchQuery) {
                            searchQuery += ' or substringof(\'' + gridData.searchKey + '\',' + obj.name + ')';
                        }
                        else {
                            searchQuery += '(substringof(\'' + gridData.searchKey + '\',' + obj.name + ')';
                        }
                    });
                if (searchQuery) {
                    searchQuery += ')';
                }
                return searchQuery;
            },
            sortQuery: function (gridData, refresh) {
                if (refresh) {
                    angular.forEach(gridData.sortCols, function (col, index) {
                        col.sortAction = '';
                    })
                    gridData.sortCols = [];
                }

                if (gridData.sortCols.length > 0) {
                    var sortQuery = '$orderby=';
                    angular.forEach(gridData.sortCols, function (obj, i) {
                        sortQuery += obj.sortName ? obj.sortName : obj.name +
                        (obj.sortAction != obj.sortEnums.desc ? '' : ' ' + obj.sortAction);
                        if (i < gridData.sortCols.length - 1) {
                            sortQuery += ',';
                        }
                    });
                    return sortQuery
                }
            },
            filterQuery: function (gridData, refresh) {
                if (refresh) {
                    gridData.filterGroups = [];
                }

                if (gridData.filterGroups.length > 0) {
                    var filterQuery = '';
                    angular.forEach(gridData.filterGroups, function (group, i) {
                        if (i > 0)
                            filterQuery += ' and ';
                        filterQuery += group.assembleQuery();
                    })
                    return filterQuery;
                }
            },
            singleLoadQuery: function (gridData, key) {
                var loadQuery = gridData.config.dataSource.get;
                loadQuery = this.assembleKey(loadQuery, gridData, key);
                if (gridData.config.dataSource.editDefault) {
                    loadQuery += '?' + gridData.config.dataSource.getDefault;
                }
                else if (gridData.config.dataSource.getDefault) {
                    loadQuery += '?' + gridData.config.dataSource.getDefault;
                }
                return loadQuery;
            },
            singleUpdateLoadQuery: function (gridData, key) {
                var loadQuery = gridData.config.dataSource.getEdit || gridData.config.dataSource.get;
                //alert(gridData.config.key);
                loadQuery = this.assembleKey(loadQuery, gridData, key);
                if (gridData.config.dataSource.editDefault) {
                    loadQuery += '?' + gridData.config.dataSource.editDefault;
                }
                return loadQuery;
            },
            singleUpdateQuery: function (gridData, key) {
                var editQuery = gridData.config.dataSource.edit || gridData.config.dataSource.get;
                editQuery = this.assembleKey(editQuery, gridData, key);
                return editQuery
            },
            assembleKey: function (loadQuery, gridData, key) {
                var keyType = gridData.config.keyType;
                if (keyType) {
                    keyType = keyType.toLowerCase();
                    if (keyType.indexOf(valueTypes.int) > -1) {
                        loadQuery = loadQuery + '(' + key + ')';
                    }
                    else if (keyType.indexOf(valueTypes.guid) > -1) {
                        loadQuery = loadQuery + '(guid\'' + key + '\')';
                    }
                    else {
                        loadQuery = loadQuery + '(\'' + key + '\')';
                    }
                }
                else {
                    loadQuery = loadQuery + '(' + key + ')';
                }
                return loadQuery;
            }
        }

    }]);

    gridViewModule.factory('paginationQuery', function () {
        return {
            query: function (queryCol, pagination) {
                queryCol.pagination
                var pageQuery = '';
                if (pagination) {
                    pageQuery = '$top=' + pagination.pageSize;
                    if (pagination.currentPage > 1) {
                        pageQuery += '&$skip=' + (pagination.pageSize * (pagination.currentPage - 1));
                    }
                }
                return pageQuery;
            }
        }
    })

    gridViewModule.factory('searchQuery', ['generalSer', function (generalSer) {
        return {
            query: function (gridData) {
                if (gridData.searchCols.length < 0)
                    return;
                var searchQuery = '';
                var searchCols = generalSer.findObject('type', 'Edm.String', gridData.searchCols);
                if (searchCols && sesearchCols.length > 0)
                    angular.forEach(searchCols, function (obj, i) {
                        if (_this.searchQuery) {
                            _this.searchQuery += ' or substringof(\'' + _this.searchKey + '\',' + this.name + ')';
                        }
                        else {
                            _this.searchQuery += '$filter=(substringof(\'' + _this.searchKey + '\',' + this.name + ')';
                        }
                    });
            }
        }
    }])

    gridViewModule.factory('sortQuery', function () {
        return {
            query: function () {

            }
        }
    })

    gridViewModule.factory('jsonConfigFactory', function () {
        return {
            configObj: {},
            getJsonString: function () {
                return JSON.stringify(this.configObj);
            },
            all: function (gridData) {
                var _this = this;
                var tempConfig = {};

                //#region config columns
                if (gridData.columns) {
                    tempConfig.columns = [];
                    angular.forEach(gridData.columns, function (obj, idx) {
                        var colConfig = _this.column(obj);
                        tempConfig.columns.push(colConfig);
                    })
                }
                //#endregion

                //#region sorting config
                var sortingConfigs = _this.sorting(gridData);
                if (angular.isDefined(sortingConfigs)) {
                    angular.extend(tempConfig, sortingConfigs);
                }
                //#endregion

                //#region filter config
                var filterConfigs = _this.filter(gridData);
                if (angular.isDefined(filterConfigs)) {
                    angular.extend(tempConfig, filterConfigs);
                }
                //#endregion

                //#region other config
                angular.extend(tempConfig, _this.others(gridData));
                //#endregion

                angular.extend(_this.configObj, gridData.config, tempConfig);
            },
            column: function (columnData) {
                var column = {
                    key: columnData.key,
                    noPatch: columnData.noPatch,
                    AutoGenerate: columnData.AutoGenerate,
                    name: columnData.name,
                    displayName: columnData.displayName,
                    type: columnData.type,
                    width: columnData.width,
                    reportName: columnData.reportName,
                    reportType: columnData.reportType,
                    active: columnData.active,
                    locked: columnData.locked,
                    canSearch: columnData.canSearch,
                    canFilter: columnData.canFilter,
                    canSort: columnData.canSort,
                    multiSelect: columnData.multiSelect,
                    multiSelectUrl: columnData.multiSelectUrl,
                    multiSelectMethod: columnData.multiSelectMethod,
                    selectValueKey: columnData.selectValueKey,
                    selectTextKey: columnData.selectTextKey
                }
                if (columnData.key) {
                    column.key = columnData.key;
                }
                if (columnData.noPatch) {
                    column.noPatch = columnData.noPatch;
                }
                if (columnData.AutoGenerate) {
                    column.AutoGenerate = columnData.AutoGenerate;
                }
                return column;
            },
            sorting: function (gridData) {
                var returnConfig = {}
                returnConfig.sortConfigs = [];
                if (gridData.sortCols.length > 0) {
                    var sortConfig = [];
                    angular.forEach(gridData.sortCols, function (obj, index) {
                        sortConfig.push({
                            name: obj.name,
                            sortAction: obj.sortAction
                        })

                    });
                    returnConfig.sortConfigs.push(sortConfig);
                }
                return returnConfig;
            },
            filter: function (gridData) {
                var returnConfig = {};
                returnConfig.filterConfigs = [];
                if (gridData.filterGroups.length > 0) {
                    returnConfig.filterConfigs.push(gridData.filterGroups);
                }
                return returnConfig;
            },
            others: function (gridData) {
                return {
                    bodyHeight: gridData.bodyHeight
                }
            }
        }
    })

    gridViewModule.factory('gridHelpFactory', function () {
        return {
            findKeyValue: function (gridData) {
                var keyValue;
                if (gridData.config.key.length > 0) {
                    keyValue = gridData.config.key[0];
                }
                else {
                    keyValue = gridData.config.key;
                }
                return keyValue;
            },
            initializeGrid: function (response, grid) {
                if (response.data && response.data.value) {
                    if (angular.isArray(response.data.value) && response.data.value.length > 0) {
                        var configModel = response.data.value[0];
                        if (configModel.Configuration) {
                            var config = angular.fromJson(configModel.Configuration);
                            grid.config = config;
                            grid.initialize();
                            return configModel;
                        }
                    }
                }
            }
        }
    })

    gridViewModule.directive('gridView', ['manageCols', '$window', '$timeout', '$document', 'globalFocusItem',
        function (manageCols, $window, $timeout, $document, globalFocusItem) {
            return {
                restrict: 'AE',
                transclude: true,
                scope: true,
                replace: false,
                templateUrl: '/AgControlTemp/GridView',
                link: function (scope, element, attrs) {
                    var head = element.find('.grid-header-wrapper .grid-header-wrapper');
                    var gridBody = element.find('.grid-body');
                    var stickBody = element.find('.grid-stick-body');

                    var body = element.find('.grid-normal-body');
                    var gridColumnMenu = element.find('.grid-column-menu');
                    var gridbody = body.parent();

                    body.on('scroll', function () {
                        head[0].scrollLeft = body[0].scrollLeft;
                        stickBody[0].scrollTop = body[0].scrollTop;
                        scope.$apply(function () {
                            globalFocusItem.close();
                        });

                    })

                    angular.element($window).on('resize', function () {
                        scope.$apply(function () {
                            globalFocusItem.close();
                            scope.stickedHeight = manageCols.stickedHeight(body);
                            scope.stickWidth = getStickWidth();
                            scope.unStickWidth = scope.getUnStickWidth();
                        });
                    });

                    function watchProperties(scope) {
                        return scope.grid.columns.map(
                            function (obj) {
                                return {
                                    width: obj.width,
                                    locked: obj.locked,
                                    active: obj.active,
                                }
                            });
                    }

                    scope.$watch(watchProperties, function () {
                        manageCols.headStyle(scope.grid);
                        scope.stickedHeight = manageCols.stickedHeight(body);
                        scope.stickWidth = getStickWidth();
                        scope.unStickWidth = scope.getUnStickWidth();
                    }, true);

                    scope.$watchCollection('grid.columns', function () {
                        manageCols.headStyle(scope.grid);
                    })

                    scope.$watch(function () {
                        return body[0].clientHeight;
                    }, function (nVal, oVal) {
                        if (scope.stickWidth > 0) {
                            if (scope.stickTimeout) {
                                $timeout.cancel(scope.stickTimeout);
                                scope.stickTimeout = undefined;
                            }
                            scope.stickTimeout = $timeout(function () {
                                scope.stickedHeight = manageCols.stickedHeight(body);
                            }, 100);
                        }
                    });

                    scope.$on('$destory', function (e) {
                        if (scope.stickTimeout)
                            $timeout.cancel(scope.stickTimeout);
                    })

                    scope.$watch('grid.fullGetQuery', function (nVal, oVal) {
                        scope.grid.load();
                    })

                    scope.grid.gridRect = function () {
                        var $ele = $(element[0])
                        var obj = {
                            offset: $ele.offset(),
                            width: $ele.outerWidth()
                        }
                        return obj;
                    }

                    scope.stickWidth = getStickWidth();

                    function getStickWidth() {
                        return manageCols.bodyWidth(scope.grid, true);
                    }

                    scope.unStickMinus = 0;
                    scope.getUnStickWidth = function () {
                        var width = gridBody.outerWidth()
                            - manageCols.bodyWidth(scope.grid, true) - scope.unStickMinus;
                        return width;
                    };

                    //scope.$watch('grid.bodyHeight', function (nVal, oVal) {
                    //    if (nVal === oVal) {
                    //        return;
                    //    }
                    //    $timeout(function () {
                    //        var height = $('body')[0].scrollHeight - $('body').height();
                    //        scope.unStickWidth = scope.getUnStickWidth();
                    //        if (height > 0) {
                    //            if (scope.unStickMinus > 0) {
                    //                scope.unStickWidth += 17;
                    //            }
                    //        }

                    //        console.log(scope.unStickWidth);
                    //    })
                    //});
                },
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    this.handlemenuActiveCol = function (column, remove) {
                        var _this = $scope.grid;
                        if (_this.menuActiveCol === column || remove) {
                            if (_this.menuActiveCol) {
                                _this.menuActiveCol = undefined;
                            }
                        }
                        else {
                            var gridColumnMenu = $element.find('.grid-column-menu');
                            var menuModel = {
                                close: function () {
                                    _this.menuActiveCol = undefined;
                                },
                                element: gridColumnMenu
                            }
                            globalFocusItem.register(menuModel);
                            _this.menuActiveCol = column;
                            _this.menuActiveCol.show = true;
                        }
                        if (_this.menuActiveCol && _this.menuActiveCol.activeExtender) {
                            _this.menuActiveCol.activeExtender = undefined;
                        }
                    }
                }]
            }
        }])

    gridViewModule.directive('gridColumn', ['$document', 'sortingHelper', 'generalSer',
        function ($document, sortingHelper, generalSer) {
            return {
                restrict: 'AE',
                scope: true,
                require: '^gridView',
                replace: true,
                templateUrl: '/AgControlTemp/GridColumn',
                link: function (scope, element, attrs, ctrl) {
                    scope.colMenuHandler = function ($event) {
                        var targetIcon = element.children('.grid-column-menu-icon');
                        var gridleft = element.closest('.grid');
                        var $targetIcon = $(targetIcon[0]);
                        scope.grid.columnMenuPos.left = $(targetIcon[0]).offset().left;
                        scope.grid.columnMenuPos.top = $(targetIcon[0]).offset().top + $targetIcon.outerHeight();

                        ctrl.handlemenuActiveCol(scope.column);

                        $event.stopPropagation();
                    }

                    scope.SortingHandler = function (column) {
                        sortingHelper(column, scope.grid.sortCols);
                        scope.grid.assembleQuery();
                    }

                    scope.menuIconHanlder = function (column) {
                        var filterGroup = generalSer.findObject('name', column.name, scope.grid.filterGroups);
                        if (filterGroup && filterGroup.length > 0) {
                            if (filterGroup.items && filterGroup.items.length > 0) {
                                return true;
                            }
                        }
                        return false;
                    }

                    var dragBorder = element.find('.drag-border');
                    dragBorder.on('mousedown', function (e) {
                        scope.$apply(function () {
                            scope.column.resizing = true;
                        });
                        //element.addClass('active');
                        //#region initialize indicator
                        var parentColumn = element.parent();
                        var bodyHeight = parseInt(scope.grid.bodyHeight);
                        var indicatorHeight = parentColumn.outerHeight() + bodyHeight + 20;
                        var borderWidth = dragBorder.outerWidth()
                        var indicatorLeft = dragBorder.offset().left;
                        var indicatorTop = dragBorder.offset().top;

                        var pos = {
                            height: indicatorHeight,
                            left: indicatorLeft,
                            top: indicatorTop,
                            width: borderWidth
                        }
                        scope.$emit('init.indicator', pos);
                        //#endregion

                        var posX = e.pageX;

                        $document.on('mousemove', function (e) {
                            var xDiff = e.pageX - posX;
                            if (scope.column.width + xDiff > 100) {
                                scope.column.width += xDiff;
                                scope.$emit('update.indicator', xDiff);
                                posX = e.pageX;
                            }
                        });

                        $document.on('mouseup', function (e) {
                            $document.off('mouseup');
                            $document.off('mousemove');
                            scope.$apply(function () {
                                scope.column.resizing = false;
                                scope.column.finishResizing = true;
                            });
                            scope.$emit('complete.indicator');
                            //element.removeClass('active');
                        })

                    });

                    scope.dragClickHandler = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    scope.initializePosIndicator = function () {
                        if (scope.draggable.dragged || scope.dragged) {
                            var bodyHeight = parseInt(scope.grid.bodyHeight);
                            var indicatorHeight = element.outerHeight() + bodyHeight + 20;
                            var borderWidth = dragBorder.outerWidth();
                            if (scope.draggable.targetIndex == 0) {
                                var indicatorLeft = element.offset().left;
                            }
                            else if (scope.draggable.targetIndex = 1) {
                                var indicatorLeft = element.offset().left + element.outerWidth();
                            }
                            var indicatorTop = dragBorder.offset().top;
                            var pos = {
                                height: indicatorHeight,
                                left: indicatorLeft,
                                top: indicatorTop,
                            }
                            scope.$emit('init.indicator', pos);

                            $document.on('mouseup', function (e) {
                                $document.off('mouseup');
                                scope.$emit('complete.indicator');
                                //element.removeClass('active');
                            });
                        }
                    }

                    scope.updatePosIndicator = function () {
                        if (scope.draggable.dragged || scope.dragged) {
                            if (scope.draggable.targetIndex == 0) {
                                var indicatorLeft = element.offset().left;
                            }
                            else if (scope.draggable.targetIndex = 1) {
                                var indicatorLeft = element.offset().left + element.outerWidth();
                            }
                            var pos = {
                                left: indicatorLeft
                            }
                            scope.$emit('initUpdate.indicator', pos);
                        }
                    }
                }
            }
        }]);

    gridViewModule.directive('gridDragColumn', ['$document', 'sortingHelper', 'generalSer', '$rootScope',
        function ($document, sortingHelper, generalSer, $rootScope) {
            return {
                restrict: 'AE',
                scope: true,
                replace: true,
                templateUrl: '/AgControlTemp/GridDragColumn',
                link: function (scope, element, attrs) {
                    scope.initializePosIndicator = function () {
                        if (scope.draggable.dragged || scope.dragged) {
                            var bodyHeight = parseInt(scope.grid.bodyHeight);
                            var indicatorHeight = element.outerHeight() + bodyHeight + 20;
                            if (scope.draggable.targetIndex == 0) {
                                var indicatorLeft = element.offset().left;
                            }
                            else if (scope.draggable.targetIndex = 1) {
                                var indicatorLeft = element.offset().left + element.outerWidth();
                            }
                            var indicatorTop = element.offset().top;
                            var pos = {
                                height: indicatorHeight,
                                left: indicatorLeft,
                                top: indicatorTop,
                            }
                            scope.$emit('init.indicator', pos);

                            $document.on('mouseup', function (e) {
                                $document.off('mouseup');
                                console.log('mouseup');
                                $rootScope.$emit('complete.indicator');
                                //element.removeClass('active');
                            });
                        }
                    }

                    scope.updatePosIndicator = function () {
                        if (scope.draggable.dragged || scope.dragged) {
                            if (scope.draggable.targetIndex == 0) {
                                var indicatorLeft = element.offset().left;
                            }
                            else if (scope.draggable.targetIndex = 1) {
                                var indicatorLeft = element.offset().left + element.outerWidth();
                            }
                            var pos = {
                                left: indicatorLeft
                            }
                            scope.$emit('initUpdate.indicator', pos);
                        }
                    }
                }
            }
        }])

    gridViewModule.directive('gridColumnMenu', ['menuExtender', 'generalSer', 'globalFocusItem', 'sortingHelper',
        function (menuExtender, generalSer, globalFocusItem, sortingHelper) {
            return {
                restrict: 'AE',
                templateUrl: '/AgControlTemp/GridColumnMenu',
                replace: true,
                scope: {
                    column: '=',
                    grid: '=gridData',
                    removeMenu: '='
                },
                link: function (scope, element, attrs) {
                    scope.$watch('grid.columnMenuPos', function () {
                        var $ele = $(element[0]);
                        var rect = scope.grid.gridRect();
                        var eleWidth = $ele.outerWidth();
                        var left = scope.grid.columnMenuPos.left;
                        if (rect.offset.left + rect.width < scope.grid.columnMenuPos.left + eleWidth + 20)
                            left = rect.offset.left + rect.width - eleWidth - 20;

                        $(element[0]).offset({
                            top: scope.grid.columnMenuPos.top,
                            left: left
                        })
                    }, true);
                    scope.extender = false;

                    scope.SortingHandler = function (column, sortCmd) {
                        sortingHelper(column, scope.grid.sortCols, sortCmd);
                        scope.grid.assembleQuery();
                    }

                    //skip the global menu close handler
                    element.on('click', function (e) {
                        e.stopPropagation();
                        //globalFocusItem.skip = true;
                    })
                },
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    this.handleExtender = function (name, callback) {
                        if ($scope.column.activeExtender) {
                            if ($scope.column.activeExtender.name === name) {
                                $scope.column.activeExtender = undefined;
                                return false;
                            }
                            else {
                                $scope.column.activeExtender.name = name;
                            }
                        }
                        else {
                            $scope.column.activeExtender = new menuExtender();
                            $scope.column.activeExtender.name = name;
                        }
                        if (callback && typeof callback == 'function')
                            callback();
                        return true;
                    }

                    this.menuExtenderHandle = function (name) {
                        if ($scope.column && $scope.column.activeExtender) {
                            if (name == $scope.column.activeExtender.name)
                                return true;
                        }
                        return false;
                    }

                    $scope.menuExtenderHandle = this.menuExtenderHandle;

                    $scope.handleLockColumns = function () {
                        var grid = $scope.grid;
                        var column = $scope.column;
                        var index = grid.columns.indexOf(column);
                        if (column.locked) {
                            var lastIndex = generalSer.findLastObjIndex('locked', true, $scope.grid.columns);
                            for (var i = index; i <= lastIndex; i++) {
                                grid.columns[i].locked = false;
                            }
                        }
                        else {
                            for (var i = 0; i <= index; i++) {
                                if (!grid.columns[i].locked)
                                    grid.columns[i].locked = true;
                            }
                        }
                    }
                }]
            }
        }])

    gridViewModule.directive('columnMenuExtender', ['$parse', function ($parse) {
        return {
            restrict: 'AE',
            require: '^gridColumnMenu',
            scope: false,
            replace: false,
            templateUrl: '/AgControlTemp/ColumnMenuExtender',
            link: function (scope, element, attrs, ctrl) {
                scope.active = true;
                scope.handleExtender = function () {
                    if (ctrl.handleExtender(scope.name, adjustPos)) {
                        if (angular.isDefined(attrs.initializeCallback)) {
                            var callback = $parse(attrs.initializeCallback)
                            if (callback && typeof callback == 'function')
                                callback(scope);
                        }
                        else {
                            if (angular.isDefined(attrs.extenderCloseCallback)) {
                                var callback = $parse(attrs.extenderCloseCallback)
                                if (callback && typeof callback == 'function')
                                    callback(scope);
                            }
                        }
                    }
                }

                scope.go = function (e) {
                    var callback = $parse(attrs.extenderCallback)
                    if (callback && typeof callback == 'function')
                        callback(scope);
                }

                var adjustPos = function () {
                    var $ele = $(element[0]);
                    var $panel = $ele.find('.menu-extender-panel');
                    var rect = scope.grid.gridRect();
                    var eleWidth = $ele.outerWidth();
                    var left = $ele.outerWidth();
                    var panelWidth = $panel.outerWidth();

                    if (rect.offset.left + rect.width < $ele.offset().left + eleWidth + panelWidth) {
                        left = -panelWidth;
                    }
                    scope.panelPos = {
                        top: 0,
                        left: left
                    }
                }
            }
        }
    }])

    gridViewModule.directive('gridDataRow', ['$filter', 'valueTypes', function ($filter, valueTypes) {
        return {
            restrict: 'AE',
            scope: {
                rowData: '=',
                filterBy: '=',
                grid: '=gridData',
                rowRightMenu: '='
            },
            replace: true,
            templateUrl: '/AgControlTemp/GridRow',
            link: function (scope, element, attrs) {
            }
        }
    }])

    gridViewModule.directive('gridDataCell', ['$compile', 'valueTypes', function ($compile, valueTypes) {

        function createTemplate(expression, filterExpression) {
            if (expression) {
                if (filterExpression) {
                    return '<span>{{' + expression + ' | ' + filterExpression + '}}</span>';
                }
                else {
                    return '<span>{{' + expression + '}}</span>';
                }
            }
            else
                return '';
        }

        return {
            scope: {
                rowData: '=',
                column: '=columnData',
                grid: '=gridData'
            },
            link: function (scope, element, attrs) {
                scope.cellData = undefined;
                var tempObj = undefined;
                var expression = '';
                var filterExpression = '';
                if (angular.isDefined(scope.rowData)) {
                    //if (scope.column.type.indexOf(valueTypes.custom) > -1) {
                    //    alert(scope.grid);
                    //}
                    if (scope.column.type.indexOf(valueTypes.custom) > -1) {
                        if (scope.grid.additionalProps && scope.grid.additionalProps.customCell) {
                            var template = scope.grid.additionalProps.customCell(scope.column.name, scope.rowData);
                            var ele = angular.element(template);
                            ele = $compile(ele)(scope);
                            element.empty();
                            element.append(ele);
                        }
                    }
                    else {
                        if (scope.column.nameCollection) {
                            expression = 'rowData.data';
                            angular.forEach(scope.column.nameCollection, function (obj, index) {
                                expression += '.' + obj;
                            });
                        }
                        switch (true) {
                            case scope.column.type.indexOf(valueTypes.datetime) > -1:
                                filterExpression = "date:'dd MMM yyyy'";
                                break;
                            case scope.column.type.indexOf(valueTypes.percentage) > -1:
                                filterExpression = "percentage";
                            case scope.column.type.indexOf(valueTypes.timespan) > -1:
                                filterExpression = "timespan";
                        }
                        var template = createTemplate(expression, filterExpression);
                        var ele = angular.element(template);
                        ele = $compile(ele)(scope);
                        element.empty();
                        element.append(ele);
                    }
                }
            }
        }
    }])

    gridViewModule.directive('gridMenu', ['$timeout', function ($timeout) {
        return {
            restrict: 'AE',
            scope: true,
            replace: true,
            templateUrl: '/AgControlTemp/GridMenu',
            link: function (scope, element, attrs) {
                scope.menuLoading = function () {
                    $timeout(function () {
                        scope.menuPanelActive = !scope.menuPanelActive;
                        //if (scope.menuPanelHeight)
                        //    scope.menuPanelHeight = 0;
                        //else
                        //    scope.menuPanelHeight = 300;
                    }, 100)

                }

                scope.test = function (ele) {
                    console.log(ele);
                }
                //scope.menuPanelHeight = 0;
                scope.menuPanelActive = false;
            }
        }
    }])

    gridViewModule.directive('vDropGrid', function () {
        return {
            link: function (scope, element, attrs) {
                scope.mouseEnterFn = function (column) {
                    if (scope.draggable.dragged) {
                        scope.draggable.targetCol = column
                        scope.hover = true;
                    }
                }
                scope.mouseLeaveFn = function () {
                    if (scope.draggable.dragged) {
                        scope.draggable.targetCol = undefined;
                        scope.hover = false;
                    }
                }
                scope.mouseMoveFn = function (event) {
                    if (scope.draggable.dragged) {
                        var offset = element.offset();
                        var top = parseInt(event.pageY - offset.top);
                        var halfHeight = element[0].offsetHeight / 2;
                        if (top >= halfHeight) {
                            scope.draggable.targetIndex = 1;
                        }
                        else {
                            scope.draggable.targetIndex = 0;
                        }
                    }
                }

                scope.mouseupFn = function () {
                    if (scope.draggable.dragged)
                        scope.hover = false;
                    //if (angular.isDefined(scope.draggable.targetCol)) {
                    //    scope.draggable.targetCol = undefined;
                    //    scope.draggable.targetIndex = -1;
                    //}
                }
            }
        }
    })

    gridViewModule.directive('hDropGrid', function () {
        return {
            link: function (scope, element, attrs) {
                scope.mouseEnterFn = function (column) {
                    if (scope.draggable.dragged) {
                        scope.draggable.targetCol = column
                        scope.hover = true;
                    }
                }
                scope.mouseLeaveFn = function () {
                    if (scope.draggable.dragged) {
                        scope.draggable.targetCol = undefined;
                        scope.hover = false;
                    }
                }
                scope.mouseMoveFn = function (event) {
                    if (scope.draggable.dragged) {
                        var offset = element.offset();
                        var left = parseInt(event.pageX - offset.left);
                        var halfWidth = element[0].offsetWidth / 2;
                        if (left >= halfWidth) {
                            scope.draggable.targetIndex = 1;
                        }
                        else {
                            scope.draggable.targetIndex = 0;
                        }
                    }
                }
                scope.mouseupFn = function () {
                    if (scope.draggable.dragged)
                        scope.hover = false;
                    console.log(scope.draggable.targetIndex);
                }
            }
        }
    })

    gridViewModule.directive('columnFlat', function () {
        return {
            restrict: 'AE',
            templateUrl: '/AgControlTemp/ColumnFTTemplate',
            replace: false,
            link: function (scope, element, attrs) {
            }
        }
    })

    gridViewModule.directive('columnArea', function () {
        return {
            restrict: 'A',
            replace: true,
            scope: {
                areaName: '=columnArea',
                filterBy: '=',
                grid: '=gridData',
                draggable: '=dragData',
                area: '=areaData',
                ctrlFn: '='

            },
            link: function (scope, element, attrs) {

            },
            templateUrl: '/AgControlTemp/ColumnAreaTemplate'

        }
    })

    gridViewModule.directive('filterSection', ['$http', '$templateCache', '$compile', '$parse',
        function ($http, $templateCache, $compile, $parse) {
            return {
                scope: {
                    item: '=',
                    inputName: '@',
                    templateUrl: '=',
                    column: '=columnData'
                },
                template: '<div ng-include="templateUrl"></div>',
                link: function (scope, element, attrs) {
                    if (angular.isDefined(attrs.required)) {
                        scope.dataRequired = true;
                    }

                    scope.$watch('item', function (nVal, oVal) {
                        console.log(nVal);
                    })

                }
            }
        }])

    gridViewModule.directive('richInput', function () {
        return {
            template: '<input type="text" ng-model="item.method" name={{inputName}} required/>',
            link: function (scope, element, attrs) {

            }
        }
    })

    gridViewModule.directive('sortingItem', function () {
        return {
            template: function () {
                return angular.element(document.querySelector('#sortingItemTemp')).html();
            },
            link: function (scope, element, attrs) {

            }
        }
    })

    gridViewModule.directive('positionIndicator', ['$rootScope', function ($rootScope) {
        return {
            link: function (scope, element, attrs) {
                scope.$on('init.indicator', function (e, pos) {
                    if (!element.hasClass('active'))
                        element.addClass('active');
                    var actualLeft = 0;
                    if (pos.width)
                        actualLeft = pos.left + (pos.width / 2 - (element.outerWidth() / 2));
                    else {
                        actualLeft = pos.left - (element.outerWidth() / 2);
                    }
                    var actualTop = pos.top - 18;
                    element.offset({
                        top: actualTop,
                        left: actualLeft
                    });
                    element.outerHeight(pos.height - 30);
                });

                scope.$on('update.indicator', function (e, xDiff) {
                    element.offset({
                        left: element.offset().left + xDiff
                    });
                })

                scope.$on('initUpdate.indicator', function (e, pos) {
                    var actualLeft = undefined
                    if (pos.left) {
                        actualLeft = pos.left - (element.outerWidth() / 2);

                        element.offset({
                            left: actualLeft
                        })
                    }
                });

                var complateEvent = $rootScope.$on('complete.indicator', function () {
                    //console.log(element);
                    element.removeClass('active');
                })

                scope.$on('destroy', function () {
                    complateEvent();
                })
            }
        }
    }])

    gridViewModule.directive('normalBodyDir', function () {
        return function (scope, element, attrs) {
            scope.$on('onRepeatLast', function () {
                scope.unStickMinus = element.outerWidth() - element[0].clientWidth;
                if (scope.unStickMinus == 0)
                    scope.unStickMinus = 17;
                else
                    scope.unStickMinus = 0;
                scope.$apply(function () {
                    scope.unStickWidth = scope.getUnStickWidth();
                });
            });
        }

    });

    gridViewModule.directive('stickBodyDir', function () {
        return function (scope, element, attrs) {

        }
    })

    gridViewModule.directive('testDir', function () {
        return {
            restrict: 'AE',
            template: '<span>{{item.key}}</span>',
            link: function (scope, element, attrs) {

            }
        }
    })

    gridViewModule.controller('colsRowCtrl', ['$scope', 'generalSer', function ($scope, generalSer) {
        $scope.draggable = {
            dragged: false,
            targetCol: undefined,
            targetIndex: -1,
        }

        $scope.ctrlFn = {
            drop: function (column) {
                console.log($scope.draggable.targetIndex);
                var index = undefined;
                if (angular.isDefined($scope.draggable.targetCol) && $scope.draggable.targetCol != column) {
                    if ($scope.draggable.targetIndex > -1) {
                        index = $scope.grid.columns.indexOf($scope.draggable.targetCol);
                        var colIndex = $scope.grid.columns.indexOf(column);
                        if (colIndex < index)
                            index -= 1;
                        index += $scope.draggable.targetIndex;
                    }
                }

                if (angular.isDefined(index)) {
                    column.locked = $scope.draggable.targetCol.locked;
                    generalSer.arrayAlterPosV2($scope.grid.columns, column, index);

                }
                $scope.draggable.targetCol = undefined;
                $scope.draggable.targetIndex = -1;
            },
            mouseEnterFn: function () {

            }
        }
    }])

    gridViewModule.controller('colConfigCtrl', ['$scope', 'generalSer', function ($scope, generalSer) {
        $scope.configTempUrl = '/AgControlTemp/ColumnsConfigPanelTemp';
        $scope.title = 'Grid Columns Configuration';

        $scope.columnAreas = {
            active: 'Active',
            inactive: 'Inactive',
            locked: 'Locked'
        }

        $scope.searchModel = {
            searchKey: ''
        };

        $scope.removeSearchKey = function () {
                $scope.searchModel.searchKey = '';
        }

        $scope.area = {
            currentArea: ''
        };

        $scope.columnFn = {
            deactivateColumn: function (column) {
                if (angular.isDefined(column) && column.active) {
                    column.active = false;
                }
            },
            activateColumn: function (column) {
                if (angular.isDefined(column) && !column.active) {
                    if (column.locked) {
                        this.unlockColumn(column);
                    }
                    else {
                        column.active = true;
                    }
                }
            },
            lockColumn: function (column, index) {
                if (angular.isDefined(column)) {
                    if (!column.locked) {
                        if (!angular.isDefined(index)) {
                            var lastIndex = generalSer.findLastObjIndex('locked', true, $scope.grid.columns);
                            var columnIndex = $scope.grid.columns.indexOf(column);
                            if (lastIndex != columnIndex - 1) {
                                generalSer.arrayAlterPos($scope.grid.columns, columnIndex, lastIndex + 1);
                            }
                        }

                        column.locked = true;
                    }
                    if (!column.active)
                        column.active = true;
                }
            },
            unlockColumn: function (column, index) {
                if (angular.isDefined(column) && column.locked) {
                    if (!angular.isDefined(index)) {
                        var lastIndex = generalSer.findLastObjIndex('locked', true, $scope.grid.columns);
                        var colIndex = $scope.grid.columns.indexOf(column);
                        if (lastIndex != colIndex && lastIndex > -1) {
                            generalSer.arrayAlterPos($scope.grid.columns, colIndex, lastIndex);
                        }
                    }
                    column.locked = false;
                    if (!column.active)
                        column.active = true;
                }
            },
            drop: function (column) {
                console.log($scope.draggable.targetIndex);
                var index = undefined;
                if (angular.isDefined($scope.draggable.targetCol) && $scope.draggable.targetCol != column) {
                    if ($scope.draggable.targetIndex > -1) {
                        index = $scope.grid.columns.indexOf($scope.draggable.targetCol);
                        var colIndex = $scope.grid.columns.indexOf(column);
                        if (colIndex < index)
                            index -= 1;
                        index += $scope.draggable.targetIndex;
                    }
                }
                switch ($scope.area.currentArea) {
                    case $scope.columnAreas.locked:
                        this.lockColumn(column, index);
                        break;
                    case $scope.columnAreas.active:
                        this.unlockColumn(column, index)
                        this.activateColumn(column);
                        break;
                    case $scope.columnAreas.inactive:
                        this.deactivateColumn(column);
                        break;
                }
                this.adjustColPos(column, index);


                $scope.draggable.targetCol = undefined;
                $scope.draggable.targetIndex = -1;
            },
            adjustColPos: function (column, index) {
                if (angular.isDefined(index)) {
                    generalSer.arrayAlterPosV2($scope.grid.columns, column, index);
                }
            },
            setCurrentArea: function (name) {
                if ($scope.draggable.dragged)
                    $scope.area.currentArea = name
            },
            clearCurrentArea: function () {
                if ($scope.draggable.dragged)
                    $scope.area.currentArea = '';
            },
            findColIndex: function (column) {
                return $scope.grid.columns.indexOf(column) + 1;
            },
        }

        $scope.draggable = {
            dragged: false,
            targetCol: undefined,
            targetIndex: -1,
        }

    }])

    gridViewModule.controller('filterConfigCtrl', ['$scope', 'generalSer', 'filterGroup', 'filterItem', 'globalModalDialog', '$q',
        function ($scope, generalSer, filterGroup, filterItem, globalModalDialog, $q) {
            $scope.configTempUrl = '/AgControlTemp/FilterConfigPanelTemp';
            $scope.title = 'Grid View Filters Management';

            $scope.displayMode = {
                list: 'list',
                groupList: 'groupList'
            };

            $scope.removeFilterItem = function (item) {
                var tempGroup = generalSer.findObject('name', item.key, $scope.grid.filterGroups);
                if (tempGroup && tempGroup.length > 0) {
                    tempGroup = tempGroup[0];
                    var success = generalSer.removeItemFromArray(tempGroup.items, item);
                    if (success) {
                        if (tempGroup.items.length == 0) {
                            generalSer.removeItemFromArray($scope.grid.filterGroups, tempGroup);
                        }
                    }
                }
            }

            $scope.removeFilterGroup = function (group) {
                generalSer.removeItemFromArray($scope.grid.filterGroups, group);
            }

            $scope.addNewFilter = function () {
                var item = $scope.mm.newFilterItem;
                var column = $scope.mm.selectColumn;
                if (item && column) {
                    if (!column.multiSelect) {
                        if (angular.isDefined(item.method) && angular.isDefined(item.value)
                            && item.method != '' && item.value != '') {
                            item.key = column.name;
                            item.displayKey = column.displayName;
                            item.type = column.type;
                            item.filterTempUrl = column.getFilterTempUrl()

                            var pushItem = new filterItem(item);
                            item = {};
                            var index = generalSer.findObjectIndex('name', column.name, $scope.grid.filterGroups);
                            if (index >= 0) {
                                $scope.grid.filterGroups[index].items.push(pushItem);
                            }
                            else {
                                var group = new filterGroup({
                                    name: column.name,
                                    displayName: column.displayName
                                });
                                group.items.push(pushItem);
                                $scope.grid.filterGroups.push(group);
                            }
                        }
                    }
                    else {
                        var filterItems = [];
                        angular.forEach(item.items, function (obj, idx) {
                            var newItem = new filterItem({
                                key: column.name,
                                displayKey: column.displayName,
                                type: column.type,
                                filterTempUrl: column.getFilterTempUrl(),
                                logic: 'or',
                                method: 'eq',
                                value: obj[column.selectTextKey],
                                editable: false
                            });
                            filterItems.push(newItem);
                        })
                        var index = generalSer.findObjectIndex('name', column.name, $scope.grid.filterGroups);
                        if (index >= 0) {
                            if (filterItems.length > 0) {
                                $scope.grid.filterGroups[index].items = filterItems;
                            }
                            else {
                                scope.grid.filterGroups.splice(index, 1);
                            }
                        }
                        else {
                            if (filterItems.length > 0) {
                                var localFilterGroup = new filterGroup({
                                    name: column.name,
                                    displayName: column.displayName
                                });
                                localFilterGroup.items = filterItems;
                                $scope.grid.filterGroups.push(localFilterGroup);
                            }
                        }
                    }
                    resetCtrlModel();
                }
            }

            $scope.modalClose = function () {
                resetCtrlModel();
                $scope.mm.showAddArea = false;
                $scope.grid.assembleQuery();
            }

            $scope.forms = {};

            $scope.mm = {
                activeDisplayMode: $scope.displayMode.list,
                removeAll: function () {
                    $q.when(globalModalDialog.openConfirm('Are you sure you want to remove all your filter items?'))
                    .then(function (data) {
                        for (var i = $scope.grid.filterGroups.length - 1 ; i >= 0; i--) {
                            var success =
                                generalSer.removeItemFromArray($scope.grid.filterGroups, $scope.grid.filterGroups[i]);
                        }
                    })
                },
                selectColumn: '',
                newFilterItem: {},
                toggleAddArea: function () {
                    this.showAddArea = !this.showAddArea;
                },
                showAddArea: false,
            }

            $scope.filterItemArray = function () {
                var returnArray = [];
                angular.forEach($scope.grid.filterGroups, function (group, i) {
                    angular.forEach(group.items, function (item, i) {
                        if (!item.displayKey)
                            item.displayKey = group.displayName;
                        returnArray.push(item);
                    })
                });
                return returnArray;
            }

            $scope.filterCols = function (column) {
                return column.canFilter == true && column.active == true;
            }

            $scope.$watch('mm.selectColumn', function (nVal, oVal) {
                console.log(nVal);
                if (angular.isDefined(nVal) && nVal.multiSelect) {
                    var localFilterGroup = generalSer.findObject('name', nVal.name, $scope.grid.filterGroups);
                    if (localFilterGroup && localFilterGroup.length > 0) {
                        localFilterGroup = localFilterGroup[0];
                    }
                    else {
                        localFilterGroup = undefined;
                    }

                    if (!localFilterGroup) {
                        localFilterGroup = new filterGroup({
                            name: nVal.name,
                            displayName: nVal.displayName
                        });
                    }
                    else {
                        localFilterGroup = angular.copy(localFilterGroup);
                    }
                    $scope.mm.newFilterItem = {
                        items: localFilterGroup.items
                    }
                }
            }, true)

            function resetCtrlModel() {
                $scope.mm.selectColumn = '';
                $scope.mm.newFilterItem = {};
                if ($scope.forms.filterForm) {
                    $scope.forms.filterForm.$setPristine();
                }
            }


        }])

    gridViewModule.controller('filterItemEditCtrl', ['$scope', function ($scope) {
        if (angular.isDefined($scope.$parent.item))
            $scope.editItem = angular.copy($scope.$parent.item);

        $scope.editFilterItem = function (item, editMode) {
            if (angular.isDefined($scope.$parent.item)
                && angular.isDefined(item) && item.value != '' && item.method) {
                $scope.$parent.item.value = item.value;
                $scope.$parent.item.method = item.method;
                $scope.$parent.item.logic = item.logic;
                $scope.$parent.toggleEditPanel(false);
            }

        }
    }])

    gridViewModule.controller('sortingConfigCtrl', ['$scope', 'generalSer', 'sortingHelper', 'globalModalDialog', '$q',
        function ($scope, generalSer, sortingHelper, globalModalDialog, $q) {
            $scope.configTempUrl = '/AgControlTemp/SortingConfigPanelTemp';
            $scope.title = 'Grid View Sorting Columns Management';

            $scope.modalClose = function () {
                resetCtrlModel();
                $scope.mm.showAddArea = false;
                $scope.grid.assembleQuery();
            }

            $scope.removeSortingItem = function (column) {
                column.sortAction = '';
                generalSer.removeItemFromArray($scope.grid.sortCols, column);
            }

            $scope.forms = {};

            $scope.mm = {
                unSortedColumns: getUnSortedColumns(),
                newSortingColumn: undefined,
                newSortingAction: '',
                toggleAddArea: function () {
                    this.showAddArea = !this.showAddArea;
                },
                removeAll: function () {
                    $q.when(globalModalDialog.openConfirm('Are you sure you want to remove all your sorting items'))
                    .then(function (data) {
                        for (var i = $scope.grid.sortCols.length - 1; i >= 0; i--) {
                            $scope.removeSortingItem($scope.grid.sortCols[i]);
                        }
                    })
                },
                showAddArea: false
            }

            $scope.mm.newSortingColumn = setNs();

            function setNs() {
                return $scope.mm.unSortedColumns.length > 0 ?
                    $scope.mm.unSortedColumns[0] : undefined
            }

            function getUnSortedColumns() {
                var differ = $($scope.grid.columns).not($scope.grid.sortCols).get().filter(function (obj) {
                    return obj.canSort;
                });
                return differ;
            }

            $scope.$watchCollection('grid.sortCols', function () {
                $scope.mm.unSortedColumns = getUnSortedColumns();
                $scope.mm.newSortingColumn = setNs();
            });

            $scope.addSorting = function () {
                if (angular.isDefined($scope.mm.newSortingColumn) && $scope.mm.newSortingAction) {
                    sortingHelper($scope.mm.newSortingColumn, $scope.grid.sortCols, $scope.mm.newSortingAction);
                    resetCtrlModel();
                }
            }

            $scope.changeSorting = function (column) {

                if (column.sortAction === column.sortEnums.desc) {
                    sortingHelper(column, $scope.grid.sortCols, column.sortEnums.asc);
                }
                else
                    sortingHelper(column, $scope.grid.sortCols, column.sortEnums.desc);
            }

            $scope.ctrlFn = {
                drop: function (column) {
                    var index = undefined;
                    if (angular.isDefined($scope.draggable.targetCol) && $scope.draggable.targetCol != column) {
                        if ($scope.draggable.targetIndex > -1) {
                            index = $scope.grid.sortCols.indexOf($scope.draggable.targetCol);
                            var colIndex = $scope.grid.sortCols.indexOf(column);
                            if (colIndex < index)
                                index -= 1;
                            index += $scope.draggable.targetIndex;
                        }
                    }

                    if (angular.isDefined(index)) {
                        generalSer.arrayAlterPosV2($scope.grid.sortCols, column, index);
                    }

                    $scope.draggable.targetCol = undefined;
                    $scope.draggable.targetIndex = -1;
                }
            }

            $scope.draggable = {
                dragged: false,
                targetCol: undefined,
                targetIndex: -1,
            }

            $scope.sortingCols = function (column) {

            }

            function resetCtrlModel() {
                $scope.mm.newSortingAction = '';
                if ($scope.forms.sortingForm) {
                    $scope.forms.sortingForm.$setPristine();
                }
            }
        }])

    gridViewModule.controller('gridAddCtrl', ['$scope', '$q', 'globalModalDialog', '$http', 'gridHelpFactory',
        function ($scope, $q, globalModalDialog, $http, gridHelpFactory) {

            $scope.initializeAdd = function () {
                $scope.isLoading = false;
                if ($scope.forms.gridAddForm) {
                    $scope.forms.gridAddForm.$setPristine();
                }
            }
            $scope.forms = {};
            $scope.add = function (callback, model) {
                $scope.isLoading = true;
                $http.post($scope.grid.config.dataSource.create, model).then(function (response) {
                    if (response && response.data) {
                        var keyValue = gridHelpFactory.findKeyValue($scope.grid);
                        //if ($scope.grid.config.key.length > 0) {
                        //    keyValue = $scope.grid.config.key[0];
                        //}
                        //else {
                        //    keyValue = $scope.grid.config.key;
                        //}
                        var key = response.data[keyValue];
                        if (key) {
                            $q.when($scope.grid.singleLoad(key)).then(function (data) {
                                $scope.grid.addRowData(data);
                            }, function (rejection) {
                                $scope.grid.reload();
                            });
                        }
                        else {
                            $scope.grid.reload();
                        }
                        var content = "Your " + $scope.grid.addConfig.title + " " + (key ? key + " " : '') + "is Added";

                        globalModalDialog.openNotice(content);
                    }
                    if (callback && typeof callback === 'function') {
                        callback();
                    }

                    $scope.isLoading = false;
                }, function (rejection) {

                    $scope.isLoading = false;
                }).finally(function () {
                    $scope.modalActive = false;
                })
            }

            $scope.modalActive = false;

        }])

    gridViewModule.controller('gridCopyAddCtrl', ['$scope', '$q', 'globalModalDialog', '$http', 'gridHelpFactory',
        function ($scope, $q, globalModalDialog, $http, gridHelpFactory) {
            $scope.initializeCopyAdd = function () {
                $scope.isLoading = false;
                $scope.initialize = false;
                if ($scope.forms.gridCopyAddForm) {
                    $scope.forms.gridCopyAddForm.$setPristine();
                }

            }
            $scope.add = function (model) {
                $scope.isLoading = true;
                $http.post($scope.grid.config.dataSource.create, model).then(function (response) {
                    if (response && response.data) {
                        var keyValue = gridHelpFactory.findKeyValue($scope.grid);
                        //if ($scope.grid.config.key.length > 0) {
                        //    keyValue = $scope.grid.config.key[0];
                        //}
                        //else {
                        //    keyValue = $scope.grid.config.key;
                        //}
                        var key = response.data[keyValue];
                        if (key) {
                            $q.when($scope.grid.singleLoad(key)).then(function (data) {
                                $scope.grid.addRowData(data);
                            }, function (rejection) {
                                $scope.grid.reload();
                            });
                        }
                        else {
                            $scope.grid.reload();
                        }
                    }
                    //if (callback && typeof callback === 'function') {
                    //    callback();
                    //}

                    var content = "Your " + $scope.grid.addConfig.title + " " + (key ? key + " " : '') + "is Added";

                    globalModalDialog.openNotice(content);

                    $scope.isLoading = false;
                }, function (rejection) {
                    $scope.isLoading = false;
                }).finally(function () {
                    $scope.grid.setCopyAddStatus(false);
                })
            }

            $scope.forms = {};

        }])

    gridViewModule.controller('gridEditCtrl', ['$scope', '$q', 'globalModalDialog', '$document', 'gridHelpFactory',
        function ($scope, $q, globalModalDialog, $document, gridHelpFactory) {
            $scope.initializeEdit = function () {
                $scope.initialize = false;
                $scope.isLoading = false;
                var targetRowData = $scope.grid.selectedRows[0];
                if (angular.isDefined(targetRowData) && angular.isDefined(targetRowData.data)) {
                    var keyValue = gridHelpFactory.findKeyValue($scope.grid);

                    var key = targetRowData.data[keyValue];
                    $scope.key = key;
                    if (angular.isDefined(key)) {
                        $q.when($scope.grid.singleUpdateLoad(key)).then(function (data) {
                            if (data['odata.metadata'])
                                delete data['odata.metadata'];
                            $scope.model = data;
                            $scope.initialize = true;
                        })
                    }
                    $scope.edit = function () {
                        $scope.isLoading = true;
                        $q.when($scope.grid.singleUpdate(key, $scope.model)).then(function (data) {
                            $q.when($scope.grid.singleLoad(key)).then(function (data) {
                                $scope.grid.replaceRowData(data);
                            }, function (rejection) {
                                $scope.grid.reload();
                            }).finally(function () {
                                $scope.grid.setEditStatus(false);
                                $scope.isLoading = false;
                            })
                        }, function (rejection) {
                            $scope.isLoading = false;
                        }).finally(function () {

                        })
                    }
                }
                if ($scope.forms.gridEditForm) {
                    $scope.forms.gridEditForm.$setPristine();
                }
            }
            $scope.forms = {};
        }])

    gridViewModule.controller('gridQuickEditCtrl', ['$scope', '$q', 'globalModalDialog', 'gridHelpFactory',
        function ($scope, $q, globalModalDialog, gridHelpFactory) {
            $scope.initializeEdit = function () {
                $scope.initialize = false;
                $scope.isLoading = false;
                var targetRowData = $scope.grid.selectedRows[0];
                if (angular.isDefined(targetRowData) && angular.isDefined(targetRowData.data)) {
                    var keyValue = gridHelpFactory.findKeyValue($scope.grid);

                    var key = targetRowData.data[$scope.grid.config.key];
                    $scope.key = key;
                    if (angular.isDefined(key)) {
                        $q.when($scope.grid.singleUpdateLoad(key)).then(function (data) {
                            $scope.model = data;
                            $scope.initialize = true;
                        })
                    }
                    $scope.edit = function () {
                        $scope.isLoading = true;
                        $q.when($scope.grid.singleUpdate(key, $scope.model)).then(function (data) {
                            $q.when($scope.grid.singleLoad(key)).then(function (data) {
                                $scope.grid.replaceRowData(data);
                            }, function (rejection) {
                                $scope.grid.reload();
                            }).finally(function () {
                                $scope.grid.setQuickEditStatus(false);
                                $scope.isLoading = false;
                            });

                        }, function (rejection) {
                            $scope.isLoading = false;
                        }).finally(function () {
                        })
                    }
                }
                if ($scope.forms.gridEditForm) {
                    $scope.forms.gridEditForm.$setPristine();
                }
            }
            $scope.forms = {};
        }])

    gridViewModule.controller('quickExcelDumpingCtrl', ['$scope', '$q', 'globalModalDialog', 'queryAssembly', '$http', 'appHiddenFrameSrc',
        function ($scope, $q, globalModalDialog, queryAssembly, $http, appHiddenFrameSrc) {
            $scope.excelDumping = function () {
                var totalItems = $scope.grid.pagination.totalItems;
                if (totalItems > 500) {
                    $q.when(globalModalDialog.openConfirm('There are more than 500 items to be exported, continue?')).then(function () {
                        createExcelReport();
                    });
                }
                else {
                    createExcelReport();
                }
            }

            function createExcelReport() {
                var searchQuery = queryAssembly.searchQuery($scope.grid);
                var filterQuery = queryAssembly.filterQuery($scope.grid);
                var sortQuery = queryAssembly.sortQuery($scope.grid);

                var activeColumns = $.grep($scope.grid.columns, function (column, i) {
                    return column.active == true;
                });

                if (activeColumns && activeColumns.length > 0) {
                    var selectData = [];
                    var expandQuery = '';
                    angular.forEach(activeColumns, function (obj, index) {
                        var reportColumn = {
                            Name: obj.reportName || obj.name,
                            Type: obj.reportType || obj.type,
                            DisplayName: obj.displayName
                        }
                        selectData.push(reportColumn);
                        if (obj.reportName) {
                            if (sortQuery && sortQuery.indexOf(obj.name) != -1) {
                                sortQuery = sortQuery.replace(obj.name, obj.reportName);
                            }
                        }
                    });
                    if ($scope.grid.config.reportConfig) {
                        var config = $scope.grid.config.reportConfig;
                        if (config.additionalColumns && config.additionalColumns.length > 0) {
                            angular.forEach(config.additionalColumns, function (obj, index) {
                                var reportColumn = {
                                    Name: obj.name,
                                    Type: obj.type,
                                    DisplayName: obj.displayName,
                                    Index: obj.index
                                }
                                selectData.push(reportColumn);
                            })
                        }
                        if (config.expandQuery) {
                            expandQuery = config.expandQuery;
                        }
                    }

                    var reportQuery = queryAssembly.noPageQuery($scope.grid);


                    var createExcelReportUrl = $scope.grid.config.dataSource.createExcelReport;
                    if (expandQuery)
                        createExcelReportUrl += '?' + expandQuery;
                    if (reportQuery) {
                        if (createExcelReportUrl.indexOf('?') != -1)
                            createExcelReportUrl += '&' + reportQuery;
                        else
                            createExcelReportUrl += '?' + reportQuery;
                    }
                    $http.post(createExcelReportUrl, selectData).then(function (response) {
                        if (response && response.data) {
                            var fileName = response.data;
                            var src = $scope.grid.config.dataSource.getExcelReport + '?'
                                + ($scope.grid.config.dataSource.getExcelReportQueryKey || 'file') + '=' + fileName;
                            appHiddenFrameSrc.setSrc(src);
                        }
                    })

                }
            }
        }]);

    gridViewModule.controller('ExcelReportTemplateCtrl', ['$scope', function ($scope) {
        $scope.templateTempUrl = '/AgControlTemp/ExcelReportTemplatePanelTemp';
        $scope.title = 'Grid View Excel Report Template';

    }]);

    gridViewModule.controller('excelReportConfigCtrl', ['$scope', function ($scope) {
        $scope.configTempUrl = '/AgControlTemp/ExcelReportConfigPanelTemp';
        $scope.title = 'Grid View Excel Report Configuration';
    }])

    gridViewModule.controller('gridSearchCtrl', ['$scope', function ($scope) {
        //$scope.$watch('grid.searchCols', function (nVal, oVal) {
        //    if (nVal && nVal.length > 0) {
        //        $scope.searchColsPool = angular.copy($scope.grid.searchCols);
        //    }
        //})

        $scope.removeSearchKey = function () {
            $scope.grid.searchKey = '';
            $scope.grid.assembleQuery();
        }

    }])

    gridViewModule.controller('columnFilterCtrl', ['$scope', 'generalSer', 'filterGroup', 'filterItem', 'filterMethod',
        function ($scope, generalSer, filterGroup, filterItem, filterMethod) {

            $scope.templateUrl = '/AGControlTemp/ColumnFilterPanel'
            $scope.name = "Column Filter";

            $scope.initializeFilterItems = function () {
                var localFilterGroup;
                $scope.dirty = false;
                // $scope.searchKey = '';

               
                //#region initialize filter group
                if (angular.isDefined($scope.column)) {
                    localFilterGroup = generalSer.findObject('name', $scope.column.name, $scope.grid.filterGroups);
                    if (localFilterGroup && localFilterGroup.length > 0) {
                        localFilterGroup = localFilterGroup[0];
                    }
                    else {
                        localFilterGroup = undefined;
                    }
                }
                if (!localFilterGroup) {
                    localFilterGroup = new filterGroup({
                        name: $scope.column.name,
                        displayName: $scope.column.displayName
                    });
                }
                else {
                    localFilterGroup = angular.copy(localFilterGroup);
                }
                //#endregion

                if (!$scope.column.multiSelect) {
                    var tempNullItem;
                    for (var i = 0; i < 3; i++) {
                        if (localFilterGroup.items[i] === undefined) {
                            localFilterGroup.items[i] = new filterItem({
                                key: $scope.column.name,
                                type: $scope.column.type,
                                displayKey: $scope.column.displayName,
                                filterTempUrl: $scope.column.getFilterTempUrl()
                            });
                        }
                            //handle null filter
                        else {
                            if (localFilterGroup.items[i].nullFilter && i != 2 && !tempNullItem) {
                                tempNullItem = angular.copy(localFilterGroup.items[i])
                                localFilterGroup.items[i] = new filterItem({
                                    key: $scope.column.name,
                                    displayKey: $scope.column.displayName,
                                    type: $scope.column.type,
                                    filterTempUrl: $scope.column.getFilterTempUrl()
                                });
                            }
                        }
                        if (i == 2) {
                            if (tempNullItem) {
                                localFilterGroup.items[i] = tempNullItem;
                            }
                            else {
                                localFilterGroup.items[i].nullFilter ? '' :
                                localFilterGroup.items[i].nullFilter = true;
                                localFilterGroup.items[i].method = filterMethod.ne;
                            }
                        }
                    }

                    $scope.filterItems = {
                        item1: localFilterGroup.items[0],
                        item2: localFilterGroup.items[1],
                        item3: localFilterGroup.items[2],
                    }


                }
                else {
                    $scope.filterItems = {
                        items: localFilterGroup.items
                    }
                }
                $scope.filterGroup = localFilterGroup;


                if ($scope.watchFunc)
                    $scope.watchFunc();

                $scope.watchFunc = $scope.$watch('filterItems', function (oVal, nVal) {
                    if (oVal === nVal)
                        return;
                    $scope.dirty = true;
                }, true);
            }

            $scope.clickData = function (data) {
                console.log(data);
                console.log($scope.filterItems);
            }

            $scope.callbackFunc = function () {
                if ($scope.filterItems) {
                    if ($scope.filterGroup) {
                        if (!$scope.column.multiSelect) {
                            var item1 = $scope.filterGroup.items[0]
                            var item2 = $scope.filterGroup.items[1];
                            var item3 = $scope.filterGroup.items[2];

                            var cloneFilterGroup = angular.copy($scope.filterGroup);
                            for (var i = cloneFilterGroup.items.length - 1; i >= 0; i--) {
                                var item = cloneFilterGroup.items[i];
                                if (item.method == '' || item.value == '') {
                                    cloneFilterGroup.items.splice(i, 1);
                                }
                                else if (item.nullFilter && !item.value) {
                                    cloneFilterGroup.items.splice(i, 1);
                                }
                            }
                            var index = generalSer.findObjectIndex('name', $scope.column.name, $scope.grid.filterGroups);
                            if (index >= 0) {
                                if (cloneFilterGroup.items.length > 0)
                                    $scope.grid.filterGroups[index] = cloneFilterGroup;
                                else
                                    $scope.grid.filterGroups.splice(index, 1);
                            }
                            else {
                                if (cloneFilterGroup.items.length > 0)
                                    $scope.grid.filterGroups.push(cloneFilterGroup);
                            }
                        }
                        else {
                            //console.log($scope.filterItems);
                            //var index = generalSer.findObjectIndex('name', $scope.column.name, $scope.grid.filterGroups);
                            var newFilterGroup = [];
                            var cloneFilterGroup = angular.copy($scope.filterGroup);
                            cloneFilterGroup.items = [];
                            angular.forEach($scope.filterItems.items, function (obj, idx) {
                                var newItem = new filterItem({
                                    key: $scope.column.name,
                                    displayKey: $scope.column.displayName,
                                    type: $scope.column.type,
                                    filterTempUrl: $scope.column.getFilterTempUrl(),
                                    logic: 'or',
                                    method: 'eq',
                                    value: obj[$scope.column.selectTextKey],
                                    editable: false
                                });
                                cloneFilterGroup.items.push(newItem);
                            })
                            var index = generalSer.findObjectIndex('name', $scope.column.name, $scope.grid.filterGroups);
                            if (index >= 0) {
                                if (cloneFilterGroup.items.length > 0)
                                    $scope.grid.filterGroups[index] = cloneFilterGroup;
                                else
                                    $scope.grid.filterGroups.splice(index, 1);
                            }
                            else {
                                if (cloneFilterGroup.items.length > 0)
                                    $scope.grid.filterGroups.push(cloneFilterGroup);
                            }
                        }

                    }
                    $scope.grid.assembleQuery();
                }
                $scope.dirty = false;
            }

            
        }])


})();

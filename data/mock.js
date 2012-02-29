define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'vendor/gloss/data/model',
    'vendor/gloss/data/tree'
], function($, _, t, Models, Tree) {

    // mocked resources, i.e.:
    //  {
    //      "/api/v1/targetvolume": {
    //          resource: TargetVolume,
    //          testData: {...target volume test data...},
    //          config: { ... }
    //      },
    //      "/api/v1/targetvolumeprofile": {
    //          resource: TargetVolumeProfile,
    //          testData: {...target volume profile test data...},
    //          config: { ... }
    //      }
    //  }
    var mocked = {},

        // this is the regexp we use to get the resource name and version
        urlRe = /\/api\/v(\d+)\/(\w+)(\/([\w:\-]+)(\/(\w+))?)?/,
        
        statusOk = {status: 200};

    var urlToResourceInfo = function(url) {
        var parsed = url.match(urlRe),
            id = parseInt(parsed[4], 10),
            ret = {
                name: parsed[2],
                version: parsed[1],
                id: ! _.isNaN(id)? id : parsed[4],
                slug: '/api/v' + parsed[1] + '/' + parsed[2],
                param: parsed[6]
            };

        if (ret.param != null) {
            ret.slug += '/' + ret.param;
        }

        return ret;
    };

    var returnData = function(resource, data) {
        var delay = resource.config.delay, dfd = $.Deferred();

        if (_.isFunction(delay)) {
            delay = resource.config.delay(resource, data);
        } else if (_.isNumber(delay)) {
            delay = parseInt(delay, 10);
        }

        if (delay == null) {
            dfd.resolve(data, statusOk);
        } else {
            setTimeout(function() {
                dfd.resolve(data, statusOk);
            }, delay);
        }

        return dfd;
    };

    var legacyGetTree = function(tree, params) {
        var startingPoint = tree;

        if (! params) {
            return startingPoint;
        }

        if (params.id != null) {
            startingPoint = t.find(tree, function() {
                return this.id === params.id;
            }).children || [];
        }

        if (params.recursive != null && ! params.recursive) {
            var ret = _.map(startingPoint, function(node) {
                return _.reduce(node, function(ret, val, key) {
                    if (key !== 'children') {
                        ret[key] = val;
                    }
                    return ret;
                }, {});
            });
            return ret;
        } else {
            return startingPoint;
        }
    };

    var getTree = function(testData, testDataTree, params) {
        var node, result = [];
        if (params.recursive && params.root_id == null) {
            return {total: testData.length, resources: justModelData(testData)};
        } else {
            node = t.find(testDataTree, function() {
                return this.model.id == params.root_id;
            });
            if (params.root_id != null) {
                if (params.recursive) {
                    t.dfs(node.children || [], function() {
                        result.push(this.model);
                    });
                } else {
                    result = _.map(node.children || [], function(child) {
                        return child.model;
                    });
                }
            } else {
                result = _.map(node.children || [], function(child) {
                    return child.model;
                });
            }
            return {total: result.length, resources: result};
        }
    };

    // given an array of fixtures, return an array of just the models
    var justModelData = function(fixtureArray) {
        return _.map(fixtureArray, function(item) { return _.clone(item[1]); });
    };

    // this is the 'initiate' function that we'll monkey-patch on to
    // Models.Request.prototype.initiate so that we can intercept AJAX calls
    // for mocked resources
    var actualInitiate = Models.Request.prototype.initiate;
    var initiate = function(id, params) {
        var ret, data, i, cur, tmpTree,
            info = urlToResourceInfo(this.url),
            resource = mocked[info.slug];

        // first, if this is a resource we don't have mocked up, just perform
        // the default action
        if (resource == null) {
            return actualInitiate.apply(this, arguments);
        }

        // clone the params obj, b/c we change it later, and it's used by the
        // Collection class after this fn returns
        params = _.clone(params);

        if (resource.config.callback) {
            resource.config.callback.apply(this, arguments);
        }

        if (params && params.tree) {
            if (!resource.testDataTree) {
                tmpTree = Tree({
                    resource: resource.resource,
                    collectionArgs: resource.config.collectionArgs
                });
                resource.testDataTree = tmpTree.root;
                resource.testDataTree._hierarchyFromList(
                        justModelData(resource.testData));
            }
        }
        data = resource.testData;

        // the ID is probably numeric, so convert it to an integer if we can
        id = _.isNaN(parseInt(id, 10))? id : parseInt(id, 10);

        if (info.param === 'tree') {
            // this is just legacy 'getTree' mocking support
            if (id == null || data[id] == null) {
                return $.Deferred().reject();
            } else {
                return returnData(resource, legacyGetTree(data[id], params));
            }
        } else if (params && params.tree) {
            // this is the current support for mocking tree requests
            return returnData(resource, getTree(resource.testData, resource.testDataTree, params));
            // return returnData(resource, {
            //     total: data.length,
            //     resources: getTree(resource.testData, resource.testDataTree, params)
            // });
        } else if (id != null) {
            // caller requested only a specific id
            return returnData(resource, _.find(data, function(item) {
                return item[1].id === id;
            })[1]);
        } else {
            // caller requested some collection
            // first process any query params
            params = params || {};
            ret = _.rest(data, params.offset || 0);
            delete params.offset;

            ret = ret.slice(0, params.limit || ret.length);
            delete params.limit;

            params = _.keys(params).length? params : null;

            // possibly filter based on other params (stuff like volumeid)
            if (params != null) {

                // convert all id's into integers, this is helpful b/c this is
                // basically what happens in the serialization/unserialization
                // process
                _.each(params, function(val, key) {
                    if (/id$/i.test(key)) {
                        params[key] = parseInt(val, 10);
                    }
                });
                ret = _.filter(ret, function(item) {
                    return _.any(item[0], function(cond) {
                        return _.isEqual(cond, params);
                    });
                });
            }

            // and select just the model data, not the testing meta-data
            ret = justModelData(ret);

            return returnData(resource, {total: data.length, resources: ret});
        }
    };

    return function(resource, testData, config) {
        var i, len, cur,
            instance = resource(),
            cfg = config || {},
            url = instance.__requests__[cfg.method || 'get'].url,
            // url = instance._request_definitions[cfg.method || 'get'].path,
            info = urlToResourceInfo(url),
            mockedResource = mocked[info.slug];

        if (_.isString(testData)) {
            testData = JSON.parse(testData);
        }

        // if this resource has already been mocked, then just replace it's
        // testData with the new data
        if (mockedResource != null) {
            mockedResource.testData = testData;
            mockedResource.config = config || {};
            return;
        }

        mocked[info.slug] = {
            resource: resource,
            testData: testData,
            config: config || {}
        };

        // if this is the first time we've called this function, we'll need to
        // monkey-patch the Request.initiate method
        if (Models.Request.prototype.initiate !== initiate) {
            Models.Request.prototype.initiate = initiate;
        }
    };
});

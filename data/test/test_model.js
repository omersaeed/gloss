/*global test, asyncTest, ok, equal, deepEqual, start, stop, strictEqual, module */
require([
    'path!jquery',
    'path!underscore',
    'path!gloss:core/class',
    'path!gloss:data/fields',
    'path!gloss:data/model'
], function($, _, Class, fields, model) {
    var NAMES = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda',
        'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

    var Storage = Class.extend({
        init: function() {
            this.calls = 0;
            this.models = {};
        },
        all: function(resource) {
            if (this.models[resource]) {
                return _.values(this.models[resource]);
            } else {
                return [];
            }
        },
        get: function(resource, id) {
            if (this.models[resource] && this.models[resource][id]) {
                return this.models[resource][id];
            }
        },
        processRequest: function(params) {
            var method = params.type, data = params.data, tokens, resource, id, models, model, total;
            this.calls++;

            tokens = params.url.split('/');
            resource = tokens[1];
            id = (tokens.length === 3) ? Number(tokens[2]) : null;

            models = this.models[resource];
            if (!models) {
                models = this.models[resource] = {};
            }

            if (method === 'GET') {
                if (id != null) {
                    model = models[id];
                    if (model) {
                        params.success($.extend(true, {}, model), true, {status: 200});
                    } else {
                        params.error({status: 404});
                    }
                } else {
                    models = _.sortBy(_.values(models), function(v) {return v.id;});
                    total = models.length;
                    if (data.offset) {
                        models = models.slice(data.offset);
                    }
                    if (data.limit) {
                        models = models.slice(0, data.limit);
                    }
                    params.success({total: total, resources: models}, true, {status: 200});
                }
            } else if (method === 'POST') {
                if (id != null) {
                    model = models[id];
                    if (model) {
                        _.extend(model, $.parseJSON(data));
                        params.success({id: id}, true, {status: 200});
                    } else {
                        params.error({status: 404});
                    }
                } else {
                    model = $.parseJSON(data);
                    model.id = _.uniqueId() + 1000;
                    models[model.id] = model;
                    params.success({id: model.id}, true, {status: 200});
                }
            } else if (method === 'DELETE') {
                if (id != null) {
                    model = models[id];
                    if (model) {
                        delete models[id];
                        params.success({id: id}, true, {status: 200});
                    } else {
                        params.error({status: 404});
                    }
                }
            }
        }
    });

    var storage = Storage();
    model.Request.prototype.ajax = _.bind(storage.processRequest, storage);

    var Test = model.Model.extend({
        __name__: 'test',
        __requests__: {
            create: model.Request({
                name: 'create',
                method: 'POST',
                url: '/test',
                mimetype: 'application/json',
                token: '[[id]]',
                schema: fields.Structure({
                    structure: {
                        name: fields.TextField({name: 'name', required: true, min_length: 1})
                    }
                }),
                responses: {
                    200: {
                        mimetype: 'application/json',
                        schema: fields.Structure({
                            structure: {
                                id: fields.IntegerField({name: 'id', required: true})
                            }
                        })
                    }
                }
            }),
            get: model.Request({
                name: 'get',
                method: 'GET',
                url: '/test/[[id]]',
                mimetype: 'application/x-www-form-urlencoded',
                token: '[[id]]',
                schema: fields.Structure({
                    structure: {
                        attrs: fields.TextField({name: 'attrs'})
                    }
                }),
                responses: {
                    200: {
                        mimetype: 'application/json',
                        schema: fields.Structure({
                            structure: {
                                id: fields.IntegerField({required: true, name: 'id'}),
                                name: fields.TextField({required: true, name: 'name', min_length: 1})
                            }
                        })
                    }
                }
            }),
            query: model.Request({
                name: 'query',
                method: 'GET',
                url: '/test',
                mimetype: 'application/x-www-form-urlencoded',
                token: '[[id]]',
                schema: fields.Structure({
                    structure: {
                        sort: fields.QuerySortField({name: "sort"}),
                        query: fields.TextField({name: "query"}),
                        limit: fields.IntegerField({minimum: 1, name: "limit"}),
                        offset: fields.IntegerField({minimum: 0, name: "offset"})
                    }
                }),
                responses: {
                    200: {
                        mimetype: 'application/json',
                        schema: fields.Structure({
                            structure: {
                                total: fields.IntegerField({minimum: 0, name: 'total'}),
                                resources: fields.Sequence({
                                    item: fields.Structure({
                                        structure: {
                                            id: fields.IntegerField({required: true, name: 'id'}),
                                            name: fields.TextField({required: true, name: 'name'})
                                        }
                                    }),
                                    name: 'resources'
                                })
                            }
                        })
                    }
                }
            }),
            update: model.Request({
                name: 'update',
                method: 'POST',
                url: '/test/[[id]]',
                mimetype: 'application/json',
                token: '[[id]]',
                schema: fields.Structure({
                    structure: {
                        name: fields.TextField({name: 'name', min_length: 1})
                    }
                }),
                responses: {
                    200: {
                        mimetype: 'application/json',
                        schema: fields.Structure({
                            structure: {
                                id: fields.IntegerField({name: 'id', required: true})
                            }
                        })
                    }
                }
            }),
            "delete": model.Request({
                name: 'delete',
                method: 'DELETE',
                url: '/test/[[id]]',
                mimetype: 'application/json',
                token: '[[id]]',
                schema: fields.Structure({
                    structure: {}
                }),
                responses: {
                    200: {
                        mimetype: 'application/json',
                        schema: fields.Structure({
                            structure: {
                                id: fields.IntegerField({name: 'id', required: true})
                            }
                        })
                    }
                }
            })
        },
        __schema__: fields.Structure({structure: {
            id: fields.IntegerField(),
            name: fields.TextField()
        }})
    });

    var models = Test.models;
    window.Test = Test;

    var setup = function() {
        storage.models.test = {};
        for (var i = 0; i < NAMES.length; i++) {
            storage.models.test[i + 1] = {id: i + 1, name: NAMES[i]};
        }
        Test.models.clear();
    };

    var teardown = function() {
        storage.models.test = {};
        Test.models.clear();
    };

    module('model', {
        setup: function() { },
        teardown: function() { }
    });

    test('creation of default manager', function() {
        setup();
        ok(models);
        strictEqual(models.model, Test);
        strictEqual(models, Test.prototype.__models__);
        teardown();
    });

    test('simple instantiation of a model', function() {
        setup();
        var model = Test();
        strictEqual(model._manager, models);
        strictEqual(model.id, null);
        teardown();
    });

    test('setting model values', function() {
        setup();
        var model = Test();
        ok(!model.has('attr'));

        var retval = model.set('attr', 'value');
        strictEqual(retval, model);

        ok(model.has('attr'));
        strictEqual(model.attr, 'value');
        strictEqual(model.html('attr'), 'value');

        model.set({a: 1, b: 2});
        strictEqual(model.a, 1);
        strictEqual(model.b, 2);

        model.set('c', 3);
        strictEqual(model.c, 3);
        teardown();
    });

    module('async model tests', {
        setup: function() { },
        teardown: function() { }
    });

    asyncTest('simple model lifecycle', function() {
        setup();
        var model = Test({name: 'name'});
        equal(model.id, null);

        model.save().done(function() {
            var id = model.id;
            ok(id);
            strictEqual(storage.get('test', id).name, 'name');

            model = models.get(id);
            model.refresh().done(function() {
                strictEqual(model.name, 'name');

                model.name = 'changed';
                model.save().done(function() {
                    equal(storage.get('test', id).name, 'changed');

                    model.destroy().done(function() {
                        equal(storage.get('test', id), null);
                        teardown();
                        start();
                    });
                });
            });
        });
    });

    asyncTest('conditional model refresh', function() {
        setup();
        var model = models.get(1), calls = storage.calls;
        ok(!model._loaded);
        model.refresh().done(function() {
            strictEqual(storage.calls, calls + 1);
            ok(model._loaded);
            
            calls = storage.calls;
            model.refresh(true).done(function() {
                strictEqual(calls, storage.calls);
                teardown();
                start();
            });
        });
    });

    asyncTest('manager association lifecycle', function() {
        setup();
        var model = Test({name: 'name'});
        equal(model.id, null);
        equal(model.cid.substr(0, 1), '_');

        model.save().done(function() {
            var id = model.id;
            ok(id);
            ok(!_.isEmpty(models.models));
            ok(models.get(id) === model);

            model.destroy().done(function() {
                ok(_.isEmpty(models.models));
                teardown();
                start();
            });
        });
    });

    asyncTest('manager association for existing resource', function() {
        setup();
        ok(_.isEmpty(models.models));
        var model = models.get(1);
        ok(!_.isEmpty(models.models));
        strictEqual(model.id, 1);
        strictEqual(model.name, undefined);

        model.refresh().done(function() {
            strictEqual(model.name, 'alpha');
            ok(models.get(1) === model);
            teardown();
            start();
        });
    });

    asyncTest('collection caching', function() {
        setup();
        var c1 = Test.collection({query: {name: 'test'}});
        var c2 = Test.collection({query: {name: 'test'}});
        var c3 = Test.collection({query: {name: 'test'}}, true);
        ok(c1 === c2);
        ok(c1 !== c3);
        ok(c2 !== c3);

        var c4 = Test.collection({query: {name: 'other'}});
        ok(c4 !== c1);
        ok(c4 !== c2);
        ok(c4 !== c3);
        start();
    });

    asyncTest('collection usage: full load', function() {
        setup();
        var collection = Test.collection(), calls = storage.calls;
        ok(_.isEmpty(models.models));
        collection.load().done(function(data) {
            strictEqual(storage.calls, calls + 1);
            strictEqual(collection.total, storage.all('test').length);
            strictEqual(data.length, collection.total);
            strictEqual(collection.models.length, collection.total);
            ok(!_.isEmpty(models.models));

            calls = storage.calls;
            collection.load().done(function(data2) {
                strictEqual(storage.calls, calls);
                strictEqual(data.length, data2.length);
                teardown();
                start();
            });
        });
    });

    asyncTest('collection usage: limit = 10', function() {
        setup();
        var collection = Test.collection(), calls = storage.calls;
        collection.load({limit: 10}).done(function(data) {
            var values = storage.all('test');
            strictEqual(storage.calls, calls + 1);
            strictEqual(collection.total, values.length);
            strictEqual(data.length, 10);
            strictEqual(collection.models.length, 10);
            strictEqual(data[0].id, values[0].id);
            strictEqual(data[9].id, values[9].id);

            calls = storage.calls;
            collection.load({limit: 10}).done(function(data2) {
                strictEqual(storage.calls, calls);
                strictEqual(data.length, data2.length);
                strictEqual(data[0].id, values[0].id);
                strictEqual(data[9].id, values[9].id);
                teardown();
                start();
            });
        });
    });

    asyncTest('collection usage: offset = 10', function() {
        setup();
        var collection = Test.collection(), calls = storage.calls;
        collection.load({offset: 10}).done(function(data) {
            var values = storage.all('test');
            strictEqual(storage.calls, calls + 1);
            strictEqual(collection.total, values.length);
            strictEqual(data.length, values.length - 10);
            strictEqual(collection.models.length, values.length);
            strictEqual(data[0].id, values[10].id);
            strictEqual(data[9].id, values[19].id);
            strictEqual(collection.models[0], undefined);
            strictEqual(collection.models[10].id, values[10].id);

            calls = storage.calls;
            collection.load({offset: 10}).done(function(data2) {
                strictEqual(storage.calls, calls);
                strictEqual(data.length, data2.length);
                strictEqual(data[0].id, values[10].id);
                strictEqual(data[9].id, values[19].id);
                teardown();
                start();
            });
        });
    });

    asyncTest('collection usage: offset = 10, limit = 10', function() {
        setup();
        var collection = Test.collection(), calls = storage.calls;
        collection.load({offset: 10, limit: 10}).done(function(data) {
            var values = storage.all('test');
            strictEqual(storage.calls, calls + 1);
            strictEqual(collection.total, values.length);
            strictEqual(data.length, 10);
            strictEqual(collection.models.length, 20);
            strictEqual(data[0].id, values[10].id);
            strictEqual(data[9].id, values[19].id);
            strictEqual(collection.models[0], undefined);
            strictEqual(collection.models[10].id, values[10].id);
            strictEqual(collection.models[20], undefined);

            calls = storage.calls;
            collection.load({offset: 10, limit: 10}).done(function(data2) {
                strictEqual(storage.calls, calls);
                strictEqual(data.length, data2.length);
                strictEqual(data[0].id, values[10].id);
                strictEqual(data[9].id, values[19].id);
                teardown();
                start();
            });
        });
    });

    asyncTest('collection usage: creation of model', function() {
        setup();
        var collection = Test.collection();
        collection.create({name: 'test'}).done(function(model) {
            ok(model.id);
            strictEqual(model.name, 'test');
            strictEqual(collection.get(model.id).id, model.id);
            strictEqual(collection.at(0).id, model.id);
            start();
        });
    });

    asyncTest('change events, direct subscription', function() {
        setup();
        var calls = 0, callback = function() {calls++}, model;
        model = Test.models.get(1);
        model.on('change', callback);
        strictEqual(calls, 0);

        model.refresh().done(function() {
            strictEqual(calls, 1);

            model.set('name', 'testing');
            strictEqual(calls, 2);
            model.save().done(function() {
                strictEqual(calls, 2);
                teardown();
                start();
            });
        });
    });

    asyncTest('change events, manager subscription', function() {
        setup();
        var calls = 0;
        models.on('change', function() {calls++});
        model = Test.models.get(1);
        strictEqual(calls, 0);

        model.refresh().done(function() {
            strictEqual(calls, 1);

            model.set('name', 'testing');
            strictEqual(calls, 2);
            teardown();
            start();
        });
    });

    asyncTest('change events, subscription via collection', function() {
        setup();
        var calls = 0, collection = Test.collection(), model;
        collection.on('change', function() {calls++});
        strictEqual(calls, 0);
        
        collection.load({limit: 10}).done(function() {
            strictEqual(calls, 0);

            model = collection.at(0);
            model.set('name', 'testing')
            strictEqual(calls, 1);

            model = models.get(20).refresh().done(function() {
                model.set('name', 'testing');
                strictEqual(calls, 1);
                teardown();
                start();
            });
        });
    });

    start();
});

define([
    'vendor/underscore',
    'vendor/jquery',
    'vendor/json2',
    'vendor/gloss/core/class',
    'vendor/gloss/core/events',
    'vendor/gloss/data/fields'
], function(_, $, json2, Class, events, fields) {
    var isArray = _.isArray, isBoolean = _.isBoolean, isEqual = _.isEqual, isString = _.isString;

    var STATUS_CODES = {
        200: 'ok',
        202: 'accepted',
        205: 'intermediate',
        206: 'partial'
    };

    var Request = Class.extend({
        ajax: $.ajax,

        init: function(params) {
            this.cache = [];
            this.filter = params.filter;
            this.method = params.method;
            this.mimetype = params.mimetype;
            this.name = params.name;
            this.responses = params.responses;
            this.schema = params.schema;
            this.token = params.token;
            this.url = params.url;
        },

        extract: function(model) {
            if (this.schema && this.schema.structural) {
                return this.schema.extract(model);
            } else {
                throw new Error();
            }
        },

        initiate: function(id, data) {
            var self = this, cache = this.cache, url = this.url, signature, cached, params, deferred;
            if (id != null) {
                url = url.replace(self.token, id);
            }

            signature = [url, data];
            for (var i = 0, l = cache.length; i < l; i++) {
                cached = cache[i];
                if (isEqual(cached[0], signature)) {
                    return cached[1];
                }
            }

            params = {
                contentType: this.mimetype,
                dataType: 'json',
                type: this.method,
                url: url
            };

            if (data) {
                if (!isString(data)) {
                    if (this.schema != null) {
                        data = this.schema.serialize(this.mimetype, data);
                    } else {
                        data = null;
                    }
                    if (data && this.mimetype === 'application/json') {
                        data = JSON.stringify(data);
                        params.processData = false;
                    }
                }
                params.data = data;
            }

            deferred = $.Deferred();
            cached = [signature, deferred];

            params.success = function(data, status, xhr) {
                var response = self.responses[xhr.status];
                if (response) {
                    data = response.schema.unserialize(response.schema.mimetype, data);
                }
                cache.splice(_.indexOf(cache, cached), 1);
                deferred.resolve(data, xhr);
            };

            params.error = function(xhr) {
                var error = null;
                if (xhr.status === 406 && xhr.responseText) {
                    error = $.parseJSON(xhr.responseText);
                }
                cache.splice(_.indexOf(cache, cached), 1);
                deferred.reject(error, xhr);
            };

            cache.push(cached);
            self.ajax(params);
            return deferred;
        }
    });

    var Collection = Class.extend({
        init: function(manager, params) {
            params = params || {};
            this.cache = {};
            this.manager = manager;
            this.models = [];
            this.plain = params.plain;
            this.query = params.query || {};
            this.total = null;
            this.manager.on('change', this.notify, this);

            /* begin hack */
            if (params.tree) {
                this.request = manager.model.prototype._getRequest('query_tree');
            } else {
                this.request = manager.model.prototype._getRequest('query');
            }
            /* end hack */
        },

        add: function(models, idx) {
            var self = this, model;
            if (!isArray(models)) {
                models = [models];
            }
            if (idx == null) {
                if (self.total != null) {
                    idx = self.total;
                } else {
                    idx = self.models.length;
                }
            }

            for (var i = 0, l = models.length; i < l; i++) {
                model = models[i];
                this.models.splice(idx + i, 0, model);
                if (model.id) {
                    this.cache[model.id] = model;
                } else if (model.cid) {
                    this.cache[model.cid] = model;
                }
            }

            this.trigger('update', this);
            return this;
        },

        at: function(idx) {
            return this.models[idx] || null;
        },

        create: function(attrs, params, idx) {
            var self = this, model = this.manager.model(attrs);
            return model.save(params).pipe(function(instance) {
                self.add([instance], idx);
                return instance;
            });
        },

        get: function(id) {
            return this.cache[id] || null;
        },

        load: function(params) {
            var self = this, manager = this.manager, query = {}, offset, limit, models;
            params = params || {};
            $.extend(true, query, self.query);

            query.offset = offset = params.offset || 0;
            if (params.limit != null) {
                query.limit = params.limit;
            }
            if (!query.limit && !params.reload && self.total > 0) {
                query.limit = self.total - offset;
            }
            limit = query.limit;

            if (!params.reload) {
                models = self.models;
                while (models[query.offset]) {
                    query.offset++;
                    if (query.limit) {
                        query.limit--;
                        if (query.limit === 0) {
                            models = models.slice(offset, offset + limit);
                            return $.Deferred().resolve(models);
                        }
                    }
                }
            }

            if (query.offset === 0) {
                delete query.offset;
            }

            return self.request.initiate(null, query).pipe(function(data, xhr) {
                var resources = data, info = null, instance, status, results, queryOffset;
                if ($.isPlainObject(data)) {
                    self.total = data.total;
                    resources = data.resources;
                    info = data.info;
                }
                queryOffset = query.offset || 0;
                for (var i = 0, l = resources.length; i < l; i++) {
                    instance = resources[i];
                    if (!self.plain) {
                        instance = manager.instantiate(instance, true);
                    }
                    self.models[queryOffset + i] = instance;
                    self.cache[instance.id] = instance;
                }
                status = {
                    complete: (xhr.status === 200),
                    status: STATUS_CODES[xhr.status]
                };
                if (limit) {
                    results = self.models.slice(offset, offset + limit);
                } else {
                    results = self.models.slice(offset);
                }
                self.trigger('update', self);
                return $.Deferred().resolve(results, status, info);
            });
        },

        notify: function(event, manager, model) {
            var id = model.id || model.cid;
            if (this.cache[id]) {
                this.trigger('change', this, model);
            }
        },

        remove: function(models) {
            var model;
            if (!isArray(models)) {
                models = [models];
            }

            for (var i = 0, l = models.length; i < l; i++) {
                model = models[i];
                this.models.splice(_.indexOf(this.models, model), 1);
                if (model.id) {
                    delete this.cache[model.id];
                }
                if (model.cid) {
                    delete this.cache[model.cid];
                }
            }
            
            this.trigger('update', this);
            return this;
        },

        reset: function(query) {
            this.cache = {};
            this.models = [];
            this.total = null;
            if (query != null) {
                this.query = query;
            }
            this.trigger('update', this);
            return this;
        }
    }, {mixins: [events]});

    var Manager = Class.extend({
        init: function(model) {
            this.cache = [];
            this.model = model;
            this.models = {};
        },

        associate: function(model) {
            var id = model.id || model.cid;
            if (this.models[id]) {
                if (this.models[id] !== model) {
                    var name = this.model.prototype.__name__;
                    throw new Error('attempt to associate duplicate ' + name + ', id = ' + id);
                }
            } else {
                this.models[id] = model;
            }
            return this;
        },

        clear: function() {
            this.models = {};
            this.cache = [];
            return this;
        },

        collection: function(params, independent) {
            if (independent || !params) {
                return Collection(this, params);
            }

            var query = params.query || {}, cache = this.cache, collection, cached;
            for (var i = 0, l = cache.length; i < l; i++) {
                cached = cache[i];
                if (isEqual(cached.query, query)) {
                    return cached;
                }
            }

            collection = Collection(this, params);
            cache.push(collection);
            return collection;
        },

        dissociate: function(model) {
            if (model.id) {
                delete this.models[model.id];
            }
            if (model.cid) {
                delete this.models[model.cid];
            }
            return this;
        },

        get: function(id) {
            var model = this.models[id];
            if (!model) {
                model = this.instantiate({id: id});
            }
            return model;
        },

        instantiate: function(model, loaded) {
            var instance;
            if (model.id) {
                instance = this.models[model.id];
                if (instance) {
                    instance.set(model);
                    if (loaded) {
                        instance._loaded = true;
                    }
                    return instance;
                }
            }
            return this.model(model, this, loaded);
        },

        load: function(id, params) {
            if (_.isNumber(id) || isString(id)) {
                return this.get(id).refresh(params, true);
            } else {
                return this.collection(id).load();
            }
        },

        notify: function(model, event) {
            if (model.id && this.models[model.id]) {
                this.trigger('change', this, model);
            }
        }
    }, {mixins: [events]});

    var Model = Class.extend({
        __new__: function(constructor, base, prototype) {
            constructor.manager = function() {
                return Manager(constructor);
            };
            constructor.models = prototype.__models__ = constructor.manager();
            constructor.collection = function(params, independent) {
                return constructor.models.collection(params, independent);
            };
        },

        __models__: null,
        __name__: null,
        __requests__: null,
        __schema__: null,

        init: function(attrs, manager, loaded) {
            this.cid = null;
            this.id = null;
            this._loaded = loaded;
            this._manager = manager || this.__models__;
            if (attrs != null) {
                this.set(attrs, true);
            }
            if (this.id == null) {
                this.cid = _.uniqueId('_');
            }
            this._manager.associate(this);
        },

        construct: function() {},

        destroy: function(params) {
            var self = this;
            if (params == null) {
                params = {};
            }
            if (self.id == null) {
                self.trigger('destroy', self);
                return $.Deferred().resolve();
            }
            return self._initiateRequest('delete', params).done(function(response) {
                self._manager.dissociate(self);
                self.trigger('destroy', self, response);
                return response;
            });
        },

        extract: function() {
            var schema = this.__schema__, extraction = {}, name, value, field;
            for (name in schema) {
                if (schema.hasOwnProperty(name)) {
                    value = this[name];
                    if (value !== undefined) {
                        extraction[name] = value;
                    }
                }
            }
            return extraction;
        },

        has: function(attr) {
            var value = this[attr];
            return (value !== undefined && value !== null);
        },

        html: function(attr, fallback) {
            var value = this[attr];
            if (value == null) {
                value = (fallback || '');
            }
            return _.escape('' + value);
        },

        push: function(attrs, params) {
            var self = this, data;
            if (self.id == null) {
                throw new Error();
            }
            data = {};
            if (attrs != null) {
                $.extend(true, data, attrs);
                self.set(attrs);
            }
            if (params != null) {
                $.extend(true, data, params);
            }
            return self._initiateRequest('update', data).pipe(function(data) {
                self.set(data);
                return self;
            });
        },

        refresh: function(params, conditional) {
            var self = this;
            if (isBoolean(params)) {
                conditional = params;
                params = null;
            } else if (params != null) {
                conditional = false;
            }
            if (self.id == null || (self._loaded && conditional)) {
                return $.Deferred().resolve(self);
            }
            return self._initiateRequest('get', params).pipe(function(data) {
                self.set(data);
                self._loaded = true;
                return self;
            });
        },

        save: function(params) {
            var self = this, creating = (this.id == null), request, data;
            request = self._getRequest(creating ? 'create' : 'update');

            data = request.extract(self);
            if (params != null) {
                $.extend(true, data, params);
            }

            return request.initiate(self.id, data).pipe(function(data) {
                if (creating) {
                    self.id = data.id;
                    self._manager.associate(self);
                }
                self.set(data);
                self._loaded = true;
                return self;
            });
        },

        set: function(attr, value, silent) {
            var attrs = {}, changing, changed, name, currentValue;
            if (attr != null) {
                if (isString(attr)) {
                    attrs[attr] = value;
                } else {
                    attrs = attr;
                    silent = value;
                }
            } else {
                return this;
            }

            changing = this._currentlyChanging;
            this._currentlyChanging = true;

            changed = false;
            for (name in attrs) {
                if (attrs.hasOwnProperty(name)) {
                    currentValue = this[name];
                    value = attrs[name];
                    if (!isEqual(value, currentValue)) {
                        changed = true;
                        this[name] = value;
                    }
                }
            }

            if (!changing && changed) {
                this.construct();
                if (!silent) {
                    this.trigger('change', this);
                    this._manager.notify(this, 'change');
                }
            }

            this._currentlyChanging = false;
            return this;
        },

        _getRequest: function(name) {
            return this.__requests__[name];
        },

        _initiateRequest: function(name, params) {
            return this._getRequest(name).initiate(this.id, params);
        }
    }, {mixins: [events]});

    return {
        Collection: Collection,
        Manager: Manager,
        Model: Model,
        Request: Request
    };
});

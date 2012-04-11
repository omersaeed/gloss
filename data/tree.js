define([
    'path!vendor:jquery',
    'path!vendor:underscore',
    'path!vendor:t',
    'path!gloss:core/class',
    'path!gloss:data/model',
    'path!gloss:core/events'
], function($, _, t, Class, Model, events) {

    var Node = Class.extend({
        defaults: {
            // this is the argument that is used to instantiate the collection
            collectionArgs: { },
            collectionIdParam: 'root_id',

            manager: null, // see the note on Tree's 'manager' default
            tree: null // required
        },

        init: function(model, options) {
            var self = this;

            self.model = model || Model.Model();
            self.options = $.extend(true, {}, self.defaults, options);

            // set the parent via the options in the constructor, but then
            // remove the reference to avoid confusion
            self.par = self.options.par;
            delete self.options.par;

            // since any *.load() calls on this should have this as the root,
            // set that here
            if (self.model.id != null) {
                // self.options.query.root_id = self.model.id;
                self.options.collectionArgs.query[self.options.collectionIdParam] = self.model.id;
            }

            self._loaded = self._loadedRecursive = false;

            self.on('update', function() {
                self.options.tree.trigger('update', self);
            }).on('change', function(evt, type, data) {
                self.options.tree.trigger('change', self, type, data);
            });

            if (self.model.on) {
                self.model.on('change', function(type, model, changed) {
                    self.dirty('model', changed);
                    self.trigger('change', 'model', self.model);
                }).on('push', function(type, model, pushed) {
                    var _set = _.isArray(pushed)?
                        function(childModel, pushedAttrs) {
                            _.each(pushedAttrs, function(pushedAttr) {
                                childModel.set(pushedAttr, model[pushedAttr], true);
                            });
                        } : 
                        function(childModel, pushedAttr) {
                            childModel.set(pushedAttr, model[pushedAttr], true);
                        };
                    t.dfs(self.children || [], function() {
                        _set(this.model, pushed);
                    });
                    self.trigger('change', 'push', self.model, pushed);
                });
            }
        },

        _appendChild: function(node, idx, dontDirty) {
            var children = this.children, setIsparent = false;
            if (!dontDirty) {
                this.dirty('children');
            }
            if (children == null) {
                children = this.children = [];
                idx = idx === 0? null : idx;
                setIsparent = true;
            }
            if (idx == null) {
                children.push(node);
            } else if (idx <= children.length) {
                children.splice(idx, 0, node);
            } else {
                throw Error('in _appendChild, idx >= children.length');
            }
            node.par = this;
            node.level = this.level + 1;
            t.dfs(node.children || [], function(n, par) {
                n.level = (par || node).level + 1;
            });
            if (node.model.set) {
                node.model.set('parent_id', this.model.id, true);
            }
            if (setIsparent) {
                this.model.set('isparent', true, true);
            }
        },

        _hierarchyFromList: function(list, dontDirty) {
            var i, len, model, children, par, node, childrenIdx, creatingChildren, tmp,
                childrenIdxStack = [],
                options = this.options,
                tree = options.tree,
                nodeFactory = options.tree.options.nodeFactory;

            node = this;
            par = this.par;
            if (this.children) {
                creatingChildren = false;
                children = this.children;
            } else {
                creatingChildren = true;
                children = this.children = [];
            }
            childrenIdx = 0;

            for (i = 0, len = list.length; i < len; i++) {
                model = list[i];

                // check if the parent of the current new model has changed --
                // if so then we know we're now at a different level of the
                // tree
                if (node.model.id != model.parent_id) {

                    // if it changed, check if we're now at a lower level of
                    // the tree
                    if (children[childrenIdx-1].model.id === model.parent_id) {
                        // we've descended a level in the tree
                        par = node;
                        node = children[childrenIdx-1];
                        childrenIdxStack.push([childrenIdx, creatingChildren]);
                        if (node.children) {
                            creatingChildren = false;
                            children = node.children;
                        } else {
                            creatingChildren = true;
                            children = node.children = [];
                        }
                        childrenIdx = 0;

                    // otherwise we're now at a higher level, so figure out how
                    // high we've gone back up
                    } else {
                        while (node.model.id != model.parent_id) {
                            if (!par) {
                                throw Error('DFS sorting seems inconsistent');
                            }
                            node = par;
                            par = node.par;
                            tmp = childrenIdxStack.pop();
                            childrenIdx = tmp[0];
                            creatingChildren = tmp[1];
                        }
                        children = node.children;
                    }
                }

                if (creatingChildren) {
                    node._appendChild(nodeFactory(model, node, tree), undefined, dontDirty);
                }
                childrenIdx++;
            }
        },

        _instantiateCollection: function() {
            var self = this,
                options = self.options,
                args = $.extend(true, {}, options.collectionArgs),
                tree = options.tree,
                collectionSrc = tree.options.manager || tree.options.resource;
            self.collection = collectionSrc.collection(args);
        },

        // this should not be used for deleting nodes from the tree.  it's used
        // for moving nodes from one parent to another, so using it to delete a
        // node will leave the tree in an inconsistent state
        _removeFromChildren: function(node) {
            var idx = node.index();
            this.children.remove(idx);
            if (!this.children.length) {
                delete this.children;
                this.model.set('isparent', false, true);
                this._loaded = this._loadedRecursive = true;
            }
        },

        add: function(model, idx) {
            var self = this,
                options = self.options,
                tree = options.tree,
                nodeFactory = tree.options.nodeFactory,
                models = _.isArray(model)? model : [model];
            return self.load().pipe(function() {
                var newNodes = [], ret;
                _.each(models, function(model) {
                    var newNode = nodeFactory(model, self, tree);
                    self._appendChild(newNode, idx);
                    newNodes.push(newNode);
                });
                ret = _.isArray(model)? newNodes : newNodes[0];
                self.trigger('change', 'add', ret);
                return ret;
            });
        },

        dirtied: function(what) {
            return what? (this._dirtied || {})[what] : $.extend({}, this._dirtied);
        },

        dirty: function(what, details) {
            if (! this._dirtied) {
                this._dirtied = {};
            }
            if (details) {
                if (!_.isObject(this._dirtied[what])) {
                    this._dirtied[what] = {};
                }
                _.extend(this._dirtied[what], details);
            } else {
                this._dirtied[what] = true;
            }
        },

        index: function() {
            var i, l, children = this.par.children;
            for (i = 0, l = children.length; i < l; i++) {
                if (children[i] === this) {
                    return i;
                }
            }
            throw Error('tree structure error');
        },

        load: function(params) {
            var recursive, query, collectionSrc, self = this,
                options = self.options,
                tree = options.tree;
            if (! self.collection) {
                self._instantiateCollection();
            }
            query = self.collection.query;
            if ((recursive = query.recursive && !query.path)) {
                if (self._loadedRecursive) {
                    return $.Deferred().resolve(self);
                } else {
                    // we've loaded before, but we're re-loading recursively,
                    // so set the 'reload' flag on the collection load params
                    (params = params || {}).reload = true;
                }
            } else {
                if (self._loaded && !query.path) {
                    return $.Deferred().resolve(self);
                }
            }
            if (self.model.id == null && self.model.cid != null && tree.root !== self) {
                return $.Deferred().resolve(self);
            }
            return self.collection.load(params).pipe(function(models) {
                self[recursive? '_loadedRecursive' : '_loaded'] = true;
                if (! models.length) {
                    return;
                }
                self._hierarchyFromList(models, true);
                if (recursive) {
                    t.dfs(self.children || [], function() {
                        this._loaded = this._loadedRecursive = true;
                    });
                } else if (query.path) {
                    t.dfs(self.children || [], function() {
                        if (this.model.isparent && _.isArray(this.children)) {
                            this._loaded = true;
                        }
                    });
                }
                return self;
            }).done(function() {
                self.trigger('update');
            });
        },

        moveTo: function(newParent, idx) {
            var self = this;
            return $.when(
                newParent.load(),
                self.par.load()
            ).done(function() {
                if (self.par) {
                    self.par._removeFromChildren(self);
                }
                newParent._appendChild(self, idx);
                return self;
            }).done(function() {
                self.trigger('change', 'move', newParent);
            });
        },

        remove: function() {
            this.par.removeChild(this);
        },

        removeChild: function(node) {
            this.dirty('children');
            if (this._removedChildren == null) {
                this._removedChildren = [];
            }
            this._removedChildren.push(node);
            this._removeFromChildren(node);
            this.trigger('change', 'remove', node);
        },

        set: function(key, value) {
            var opts = {};
            if (_.isString(key)) {
                opts[key] = value;
            } else {
                opts = key;
            }

            $.extend(true, this.options, opts);

            if (opts.collectionArgs != null) {
                this._instantiateCollection();
            }

            return this;
        },

        undirty: function() {
            delete this._dirtied;
            delete this._removedChildren;
            return this;
        },

        unload: function() {
            delete this._loaded;
            delete this._loadedRecursive;
            if (this.collection) {
                this.collection.reset();
            }
            delete this.children;
            return this;
        }

    }, {mixins: [events]});

    var defaultNodeFactory = function(model, parentNode, tree) {
        return Node(model, {
            tree: tree,
            collectionArgs: $.extend(true, {}, tree.options.collectionArgs)
        });
    };

    var Tree = Class.extend({
        defaults: {
            resource: null, // required

            // in real implementatios, the 'query' is what will be passed to
            // the collection instantiation, so it'll probably need something
            // like a file_plan_id
            // query: { tree: true },
            collectionArgs: { },

            // this is only really here to support unit tests, in production
            // it'll prob always be null
            manager: null,

            recursive: false,
            nodeFactory: defaultNodeFactory
        },

        init: function(options) {
            this.options = $.extend(true, {}, this.defaults, options);
            this.root = Node(Model.Model(), {
                collectionArgs: $.extend(true, {}, this.options.collectionArgs),
                tree: this
            });
            this.root.level = -1;
            this.on('change', function() {
                this._markAsModified(true);
            });
        },

        _markAsModified: function(modified) {
            this._modified = modified;
        },

        asList: function() {
            var ret = [];
            t.dfs(this.root.children || [], function() { ret.push(this); });
            return ret;
        },

        clearDeltas: function() {
            this._markAsModified(false);
            t.dfs(this.root, function() { this.undirty(); });
            return this;
        },

        deltas: function(asTree, includeNodeRef) {
            var flat = [], ret, self = this;
           
            ret = t.dfs(self.root, {order: 'post'}, function(node, par, ctrl, ret) {
                var filePlanId = self.options.collectionArgs.query.file_plan_id,
                    result = {
                        id: node.model.id,
                        name: node.model.name,
                        file_plan_id: filePlanId,
                        parent_id: par? par.model.id : null
                    },
                    hasDirtiedModel = node.dirtied('model'),
                    hasDirtiedChildren =
                        node.dirtied('children') || (node.children && _.any(ret));

                if (includeNodeRef) {
                    result._node = node;
                }

                if (!hasDirtiedChildren && !hasDirtiedModel) {
                    return;
                }
                if (hasDirtiedChildren) {
                    result.children = _.map(ret, function(r, i) {
                        var model = node.children[i].model;
                        r = r || {
                            id: model.id,
                            name: model.name,
                            rank: i+1,
                            file_plan_id: filePlanId,
                            parent_id: node.model.id
                        };
                        if (includeNodeRef && ! r._node) {
                            r._node = node.children[i];
                        }
                        return r;
                    });
                }
                _.each(node._removedChildren || [], function(removed) {
                    result.children.push({
                        id: removed.model.id,
                        name: removed.model.name,
                        operation: 'delete',
                        file_plan_id: filePlanId
                    });
                    if (includeNodeRef) {
                        _.last(result.children)._node = removed;
                    }
                });
                if (hasDirtiedModel) {
                    _.each(node.dirtied('model'), function(val, key) {
                        result[key] = node.model[key];
                    });
                }
                if (result.rank == null && par) {
                    result.rank = _.indexOf(par.children, node) + 1;
                }

                return result;
            });
            if (!ret) {
                return undefined;
            } else if (asTree) {
                return ret.children;
            } else {
                t.dfs(ret.children, function() {
                    flat.push(_.reduce(this, function(newObj, val, key) {
                        if (key !== 'children') {
                            newObj[key] = val;
                        }
                        return newObj;
                    }, {}));
                });
                return flat;
            }
        },

        isModified: function() {
            return !!this._modified;
        },

        load: function(params) {
            return this.root.load(params);
        },

        translateErrors: function(errorResponse) {
            var deltas, errors = {},
                setGlobalError = function(msg) {
                    if (!errors.global_errors) {
                        errors.global_errors = [];
                    }
                    errors.global_errors.push(msg);
                },
                setNodeError = function(node, name, token, msg) {
                    if (!errors.node_errors) {
                        errors.node_errors = {};
                    }
                    if (!errors.node_errors[node.model.id]) {
                        errors.node_errors[node.model.id] = {node: node, errors: {}};
                    }
                    errors.node_errors[node.model.id].errors[name] = {
                        token: token,
                        msg: msg
                    };
                };

            deltas = this.deltas(false, true);

            if (errorResponse.structural_errors) {
                _.each(deltas, function(delta, i) {
                    var e = errorResponse.structural_errors[i];
                    if (! e) {
                        return; // there were no errors saving this node, continue
                    }
                    _.each(e, function(fieldErrors, fieldName) {
                        _.each(fieldErrors, function(e) {
                            setNodeError(delta._node, fieldName, e.token, e.message);
                        });
                    });
                });
            }

            return errors;
        },

        updateNewRecordSeriesFromResponse: function(response) {
            var deltas = this.deltas(false, true);
            _.each(this.deltas(false, true), function(delta, i) {
                delta._node.model.set('id', response[i].id, true);
            });
            return this;
        },

        unload: function() {
            this.root.unload();
            return this;
        }

    }, {mixins: [events]});

    Tree.Node = Node;

    return Tree;
});

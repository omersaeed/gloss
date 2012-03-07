define([
    'vendor/jquery',
    'vendor/underscore',
    'vendor/t',
    'vendor/gloss/core/class',
    'vendor/gloss/data/model',
    'vendor/gloss/core/events'
], function($, _, t, Class, Model, events) {

    var Node = Class.extend({
        defaults: {
            // query: { // required, probably needs something like file_plan_id
                // tree: true,
                // recursive: false
            // },

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
                self.model.on('change', function() {
                    self.dirty('model');
                    self.trigger('change', 'model', self.model);
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
            var i, len, model, children, par, node,
                options = this.options,
                tree = options.tree,
                nodeFactory = options.tree.options.nodeFactory;

            node = this;
            par = this.par;
            children = this.children = [];

            for (i = 0, len = list.length; i < len; i++) {
                model = list[i];

                if (node.model.id != model.parent_id) {
                    if (children[children.length-1].model.id === model.parent_id) {
                        par = node;
                        node = children[children.length-1];
                        children = node.children = [];
                    } else {
                        while (node.model.id != model.parent_id) {
                            if (!par) {
                                throw Error('DFS sorting seems inconsistent');
                            }
                            node = par;
                            par = node.par;
                        }
                        children = node.children;
                    }
                }

                node._appendChild(nodeFactory(model, node, tree), undefined, dontDirty);
            }
        },

        // _instantiateCollection: function(query) {
        _instantiateCollection: function() {
            var self = this,
                options = self.options,
                tree = options.tree,
                collectionSrc = tree.options.manager || tree.options.resource;
            // self.collection = collectionSrc.collection({
            //     tree: true,
            //     query: query
            // });
            self.collection = collectionSrc.collection(options.collectionArgs);
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

        dirty: function(what) {
            if (! this._dirtied) {
                this._dirtied = {};
            }
            this._dirtied[what] = true;
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
            var recursive, collectionSrc, self = this,
                options = self.options,
                tree = options.tree;
            if (! self.collection) {
                self._instantiateCollection();
            }
            if ((recursive = self.collection.query.recursive)) {
                if (self._loadedRecursive) {
                    return $.Deferred().resolve(this);
                } else {
                    // we've loaded before, but we're re-loading recursively,
                    // so set the 'reload' flag on the collection load params
                    (params = params || {}).reload = true;
                }
            } else {
                if (self._loaded) {
                    return $.Deferred().resolve(this);
                }
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

            // if (opts.query != null) {
            if (opts.collectionArgs != null) {
                // this._instantiateCollection(this.options.query);
                this._instantiateCollection();
            }

            return this;
        },

        undirty: function() {
            delete this._dirtied;
            delete this._removedChildren;
        }

    }, {mixins: [events]});

    var defaultNodeFactory = function(model, parentNode, tree) {
        return Node(model, {
            tree: tree,
            // query: parentNode.options.query
            collectionArgs: parentNode.options.collectionArgs
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
                collectionArgs: this.options.collectionArgs,
                tree: this
            });
            this.root.level = -1;
        },

        asList: function() {
            var ret = [];
            t.dfs(this.root.children || [], function() { ret.push(this); });
            return ret;
        },

        clearDeltas: function() {
            t.dfs(this.root, function() { this.undirty(); });
        },

        deltas: function() {
            var ret = t.dfs(this.root, {order: 'post'}, function(node, par, ctrl, ret) {
                var result = {id: node.model.id, name: node.model.name},
                    hasDirtiedModel = node.dirtied('model'),
                    hasDirtiedChildren =
                        node.dirtied('children') || (node.children && _.any(ret));

                if (!hasDirtiedChildren && !hasDirtiedModel) {
                    return;
                }
                if (hasDirtiedChildren) {
                    result.children = _.map(ret, function(r, i) {
                        var model = node.children[i].model;
                        return r? r : {id: model.id, name: model.name, rank: i};
                    });
                }
                _.each(node._removedChildren || [], function(removed) {
                    result.children.push({
                        id: removed.model.id,
                        name: removed.model.name,
                        operation: 'remove'
                    });
                });
                if (hasDirtiedModel) {
                    $.extend(result,
                        node.model._getRequest('create').extract(node.model));
                }
                if (result.rank == null && par) {
                    result.rank = _.indexOf(par.children, node);
                }

                return result;
            });
            return ret? ret.children : undefined;
        },

        load: function(params) {
            return this.root.load(params);
        }

    }, {mixins: [events]});

    Tree.Node = Node;

    return Tree;
});

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
            query: { // required, probably needs something like file_plan_id
                tree: true,
                recursive: false
            },
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
                self.options.query.root_id = self.model.id;
            }

            self._loaded = self._loadedRecursive = false;

            self.on('update', function() {
                self.options.tree.trigger('update', self);
            });
        },

        _hierarchyFromList: function(list) {
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

                node.appendChild(nodeFactory(model, node, tree));
            }
        },

        _instantiateCollection: function(query) {
            var self = this,
                options = self.options,
                tree = options.tree,
                collectionSrc = tree.options.manager || tree.options.resource;
            self.collection = collectionSrc.collection({
                tree: true,
                query: query
            });

            // self.collection.on('update', function() {
            //     self.trigger('update', self);
            // });
        },

        // this should not be used for deleting nodes from the tree.  it's used
        // for moving nodes from one parent to another, so using it to delete a
        // node will leave the tree in an inconsistent state
        _removeFromChildren: function(node) {
            var idx = node.index();
            this.children.remove(idx);
            if (!this.children.length) {
                delete this.children;
                this.model.set('isparent', false);
                this._loaded = this._loadedRecursive = true;
            }
        },

        add: function(model, idx) {
            var self = this,
                options = self.options,
                tree = options.tree,
                nodeFactory = tree.options.nodeFactory;
            return self.load().done(function() {
                self.appendChild(nodeFactory(model, self, tree), idx);
            });
        },

        appendChild: function(node, idx) {
            var children = this.children, setIsparent = false;
            if (children == null) {
                children = this.children = [];
                idx = idx === 0? null : idx;
                setIsparent = true;
            }
            if (idx == null) {
                children.push(node);
            } else if (idx < children.length) {
                children.splice(idx, 0, node);
            } else {
                throw Error('in appendChild, idx >= children.length');
            }
            node.par = this;
            node.level = this.level + 1;
            t.dfs(node.children || [], function(n, par) {
                n.level = (par || node).level + 1;
            });
            if (node.model.set) {
                node.model.set('parent_id', this.model.id);
            }
            if (setIsparent) {
                this.model.set('isparent', true);
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
            var recursive, collectionSrc, self = this,
                options = self.options,
                tree = options.tree,
                query = options.query;
            if (! self.collection) {
                self._instantiateCollection(query);
            }
            if ((recursive = self.collection.query.recursive)) {
                if (self._loadedRecursive) {
                    return $.Deferred().resolve(this);
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
                self._hierarchyFromList(models);
                if (recursive) {
                    t.dfs(self.children || [], function() {
                        this._loaded = this._loadedRecursive = true;
                    });
                }
                return self;
            }).done(function() {
                self.trigger('update', self);
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
                newParent.appendChild(self, idx);
                return self;
            }).done(function() {
                self.trigger('update', self);
            });
        },

        remove: function() {
            this.par.removeChild(this);
        },

        removeChild: function(node) {
            if (this._removedChildren == null) {
                this._removedChildren = [];
            }
            this._removedChildren.push(node);
            this._removeFromChildren(node);
        },

        set: function(key, value) {
            var opts = {};
            if (_.isString(key)) {
                opts[key] = value;
            } else {
                opts = key;
            }

            $.extend(true, this.options, opts);

            if (opts.query != null) {
                this._instantiateCollection(this.options.query);
            }
        }
    }, {mixins: [events]});

    var defaultNodeFactory = function(model, parentNode, tree) {
        return Node(model, {
            tree: tree,
            query: parentNode.options.query
        });
    };

    var Tree = Class.extend({
        defaults: {
            resource: null, // required

            // in real implementatios, the 'query' is what will be passed to
            // the collection instantiation, so it'll probably need something
            // like a file_plan_id
            query: { tree: true },

            // this is only really here to support unit tests, in production
            // it'll prob always be null
            manager: null,

            recursive: false,
            nodeFactory: defaultNodeFactory
        },

        init: function(options) {
            this.options = $.extend(true, {}, this.defaults, options);
            this.root = Node(Model.Model(), {query: this.options.query, tree: this});
            this.root.level = -1;
        },

        asList: function() {
            var ret = [];
            t.dfs(this.root.children || [], function() { ret.push(this); });
            return ret;
        },

        load: function(params) {
            return this.root.load(params);
        }
    }, {mixins: [events]});

    Tree.Node = Node;

    return Tree;
});

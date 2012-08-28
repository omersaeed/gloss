/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'vendor/jquery',
    'mesh/request',
    './../messagelist',
    './../form',
    'tmpl!./testtmpl.mtpl',
    'tmpl!./exampleform.mtpl',
    './../../test/api/v1/targetvolumeprofile',
    'mesh/tests/example'
], function($, Request, MessageList, Form, template, exampleTemplate,
    TargetVolumeProfile, Example) {

    var origAjax = Request.ajax(function(args) {
        var data = args.data;
        window.lastAjaxArgs = args;
        if (/some-invalid-chars/.test(JSON.parse(data).name)) {
            args.error({
                getResponseHeader: function() {return 'application/json';},
                responseText: JSON.stringify([[{
                        token: 'servererror',
                        message: 'something went wrong server-side'
                    }], {
                    name: [{
                        token: 'nonempty',
                        message: 'name must not be empty'
                    }]
                }])
            });
        } else {
            args.success({resources: []}, 200, {});
        }
    });


    asyncTest('test static binding', function() {
        var myFrm =  Form.extend({
            nodeTemplate: template,

            defaults: {
                modelClass: TargetVolumeProfile,
                collection: null,
                bindings: [
                   {
                       widget: 'name', 
                       field: 'name'
                   }
                ],
                staticValues: {
                    "volume_id":'10',
                    "additionalinfo.alias": "Alias1"
                },
                widgetize: true
            }
        });

        var frm = myFrm();
        frm.getModel().set('name', 'DudeA');
        var vals = frm.getFieldValues();
        setTimeout(function() {
            equal(vals.name,'DudeA');
            equal(vals.volume_id,'10');
            equal(vals.additionalinfo.alias,'Alias1');
            start();
        }, 0);
    });

    asyncTest('updates to model are propagated to bound widgets', function() {
        var myFrm =  Form.extend({
            nodeTemplate: template,

            defaults: {
                modelClass: TargetVolumeProfile,
                collection: null,
                bindings: [
                   {
                       widget: 'name', 
                       field: 'name'
                   }
                ],
                widgetize: true
            }
        });

        var frm1 = myFrm().appendTo($('body'));
        var frm2 = myFrm().appendTo($('body'));
        frm1.getModel().set('name', 'DudeA');
        frm2.getModel().set('name', 'DudeB');
        var vals1 = frm1.getBoundValues();
        var vals2 = frm2.getBoundValues();
        setTimeout(function() {
            equal(vals1.name, 'DudeA');
            equal(vals2.name, 'DudeB');
            start();
        }, 0);
    });

    asyncTest('500 errors without content are handled correctly', function() {
        var donezo = $.Deferred(),
            MyForm = Form.extend({
                nodeTemplate: exampleTemplate,
                defaults: {
                    modelClass: Example,
                    bindings: [
                        {widget: 'required_field', field: 'required_field'}
                    ],
                    widgetize: true
                },

                processErrors: function() {
                    this._super.apply(this, arguments);
                    donezo.resolve();
                }
            }),
            form = MyForm().appendTo('#qunit-fixture'),
            model = form.getModel(),
            origCreateAjax = model.__requests__.create.ajax,
            finish = function() {
                model.__requests__.create.ajax = origCreateAjax;
                start();
            };

        form.set('messageList',
            MessageList(form.$node.find('.messagelist:not([data-for])')));

        $('#qunit-fixture').css({position: 'static'});

        // this (hopefully) sort of models the case where we get back nothing
        // but a 500 response
        model.__requests__.create.ajax = function(params) {
            console.log('in there!');
            params.error({
                getResponseHeader: function(header) {
                    return null;
                },
                responseText: '',
                status: 500,
                statusText: "Internal Server Error"
            });
        };

        form.on('submitted', function(response) {
            ok(false, 'form should not have successfully submitted');
        }).submit();

        donezo.done(function() {
            setTimeout(function() {
                equal(form.options.messageList.$node.text(), 'Internal Server Error');
                start();
            }, 100);
        });
    });

    start();
});

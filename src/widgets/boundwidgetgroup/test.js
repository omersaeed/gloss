/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'mesh/request',
    './../messagelist',
    './../boundwidgetgroup',
    'tmpl!./testtmpl.mtpl',
    './../../test/api/v1/targetvolumeprofile'
], function(Request, MessageList, BoundWidgetGroup, template,
    TargetVolumeProfile) {

    var origAjax = Request.ajax(function(args) {
        var data = args.data;
        console.log('ajax request made:',args);
        window.lastAjaxArgs = args;
        if (!data.name) {
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

    asyncTest('boundwidgetgroup correctly handles errors', function() {
        var bwg = window.bwg = BoundWidgetGroup(template(), {
            widgetize: true,
            modelClass: TargetVolumeProfile,
            bindings: [{widget: 'name', field: 'name'}]
        });

        bwg.set('messageList',
            MessageList(bwg.$node.find('.messagelist').first()));

        bwg.initiateUpdate(function(model) {
            return model.set('name', bwg.getWidget('name').getValue()).save();
        }).done(function() {
            ok(false, 'save should have thrown an error');
            bwg.processSubmit.apply(bwg, arguments);
            start();
        }).fail(function() {
            ok(true, 'save correctly throws error');
            bwg.processErrors.apply(bwg, arguments);
            ok(/something went wrong server-side/
                .test(bwg.options.messageList.$node.text()));
            ok(/name must not be empty/
                .test(bwg.getWidget('name').options.messageList.$node.text()));
            start();
        });
    });

    start();
});

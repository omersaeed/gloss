/*global test, asyncTest, ok, equal, deepEqual, start, module, strictEqual, notStrictEqual, raises*/
define([
    'mesh/request',
    './../messagelist',
    './../form',
    'tmpl!./testtmpl.mtpl',
    './../../test/api/v1/targetvolumeprofile'
], function(Request, MessageList, Form, template,
    TargetVolumeProfile) {

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
        
        var frm = myFrm()
        frm.getModel().set('name', 'DudeA');
        vals = frm.getValues();
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
        vals1 = frm1.getBoundValues();
        vals2 = frm2.getBoundValues();
        setTimeout(function() {
            equal(vals1.name, 'DudeA');
            equal(vals2.name, 'DudeB');
            start();
        }, 0);
    });

    start();
});

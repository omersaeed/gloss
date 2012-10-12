define([
    './../../../util/format',
    './../column'
], function(format, Column) {
    return Column.extend({
        defaults: {
            // mesh defaults to sending bytes in GB, but it gives no indication
            // that this is the case. this should be fixed, but for now we'll
            // just leave this little breadcrumb
            assumeGb: true
        },
        getValue: function(model) {
            var factor = this.get('assumeGb')? 1.0e9 : 1.0;
            return format.bytes(model.get(this.get('name')) * factor);
        }
    });
});


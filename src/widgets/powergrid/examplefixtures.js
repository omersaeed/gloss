define([
    'vendor/underscore'
], function(_) {
    return _.map(_.range(1000), function(____, i) {
        return {
            id: i+1,
            text_field: 'item ' + i,
            required_field: 'something absolutely necessary ' + i,
            boolean_field: false
        };
    });
});

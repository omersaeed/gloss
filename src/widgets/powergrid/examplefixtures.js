define([
    'vendor/underscore'
], function(_) {
    return _.map(_.range(1000), function(____, i) {
        return {
            id: i+1,
            text_field: 'item ' + i,
            required_field: 'something absolutely necessary ' + i,
            boolean_field: false,
            datetime_field: '2012-08-29T14:10:21Z',
            integer_field: i % 3,
            default_field: i % 5 === 0? null : 'default ' + i
        };
    });
});

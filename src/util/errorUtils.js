/**
 * Created with IntelliJ IDEA.
 * User: omer.saeed
 * Date: 11/8/12
 * Time: 3:49 PM
 * To change this template use File | Settings | File Templates.
 */
define([], function() {

    return {
        flattenErrors: function(structuralErrors, flattenedErrors, parentFieldName) {
            var self = this;
            flattenedErrors = (typeof flattenedErrors === "undefined") ? {} : flattenedErrors;
            if(structuralErrors) {
                if($.isArray(structuralErrors)) {
                    $.each(structuralErrors, function(field, errors) {
                        self.flattenErrors(errors, flattenedErrors, parentFieldName);
                    });
                } else {
                    $.each(structuralErrors, function(field, errors) {
                        // We do not want to nest into fields that
                        var contextField = field;
                        if ($.isArray(errors)) {
                            if (parentFieldName) {
                                contextField = parentFieldName + '.' + contextField;
                            }
                            flattenedErrors[contextField] = errors;
                        } else {
                            self.flattenErrors(errors, flattenedErrors, contextField);
                        }
                    });
                }
            }
            return flattenedErrors;
        }
    };
});
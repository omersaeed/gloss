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
                    // Case to cater for UI errors where structural errors has a field error in the array
                    if (structuralErrors[0].errors) {
                        self.flattenErrors(structuralErrors[0].errors, flattenedErrors, parentFieldName);
                    } else {
                        $.each(structuralErrors, function(field, errors) {
                            self.flattenErrors(errors, flattenedErrors, parentFieldName);
                        });
                    }
                } else {
                    $.each(structuralErrors, function(field, errors) {
                        var contextField = field;
                        if ($.isArray(errors)) {
                            if (parentFieldName) {
                                contextField = parentFieldName + '.' + contextField;
                            }
                            if (errors[0].errors) {
                                self.flattenErrors(errors[0].errors, flattenedErrors, contextField);
                            } else {
                                flattenedErrors[contextField] = errors;
                            }
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
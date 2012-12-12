/**
 * Created with IntelliJ IDEA.
 * User: omer.saeed
 * Date: 11/8/12
 * Time: 3:49 PM
 * To change this template use File | Settings | File Templates.
 */
define([
    'vendor/underscore',
    'strings'
], function(_, strings) {

    var flattenErrors = function(structuralErrors, flattenedErrors, parentFieldName) {
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
    };

    var processGlobalErrors =  function(response, xhr, messageList, errorCls) {
        var globalErrors = response && response[0],
            tokensToStrings = function(errors) {
                return _.map(errors, function(error) {
                    return error.message ||
                        (strings.errors && error.token in strings.errors?
                            strings.errors[error.token] :
                            error.token);
                });
            };

        errorCls = errorCls || 'invalid';

        if (messageList) {
            if (globalErrors) {
                messageList.append(errorCls, tokensToStrings(globalErrors));
            } else if (xhr && xhr.status === 500) {
                messageList.append(errorCls, xhr.statusText); // empty 500
            } else {
                // don't know how we could get here...
                messageList.append(errorCls,
                    (strings.errors && strings.errors.invalid) ||
                        'there was an error');
            }
        }
    };

    return {
        flattenErrors: flattenErrors,
        processGlobalErrors: processGlobalErrors
    };
});
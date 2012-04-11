define([
    'path!vendor:underscore',
    'path!gloss:core/class',
    'path!gloss:util/datetime'
], function(_, Class, datetime) {
    var isNumber = _.isNumber, isString = _.isString;

    var ismimetype = function(mimetype, token) {
        if(token === 'json') {
            return (mimetype === 'application/json');
        } else if(token === 'urlencoded') {
            return (mimetype === 'application/x-www-form-urlencoded');
        } else {
            return false;
        }
    };

    var StandardError = function(params) {
        _.extend(this, params);        
    };

    var ValidationError = function(message, structure) {
        this.message = message;
        this.structure = structure;
    };

    var Field = Class.extend({
        structural: false,
        init: function(params) {
            if(params != null) {
                _.extend(this, params);
            }
        },
        serialize: function(mimetype, value) {
            return value;
        },
        unserialize: function(mimetype, value) {
            return value;
        },
        validate: function(value, mimetype) {
            if(value == null) {
                if(this.required) {
                    throw new ValidationError('required');
                } else {
                    return value;
                }
            }
            this._validateValue(value);
            if(mimetype) {
                value = this.serialize(mimetype, value);
            }
            return value;
        }
    });

    var fields = {
        Field: Field,
        StandardError: StandardError,
        ValidationError: ValidationError
    };

    fields.BooleanField = Field.extend({
        serialize: function(mimetype, value) {
            /* HACK */
            if (isString(value)) {
                value = value.toLowerCase();
                if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                } else {
                    throw new Error();
                }
            }
            /* END HACK */
            if (ismimetype(mimetype, 'urlencoded')) {
                return (value ? 'true' : 'false');
            } else {
                return value;
            }
        },
        _validateValue: function(value) {
            if(!_.isBoolean(value)) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.ConstantField = Field.extend({
        _validateValue: function(value) {
            if(value !== this.value) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.DateTimeField = Field.extend({
        serialize: function(mimetype, value) {
            if(value != null) {
                value = datetime.toISO8601(value, true);
            }
            return value;
        },
        unserialize: function(mimetype, value) {
            if(value != null) {
                value = datetime.fromISO8601(value);
            }
            return value;
        },
        _validateValue: function(value) {
            if(!_.isDate(value)) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.DateField = fields.DateTimeField.extend({
        serialize: function(mimetype, value) {
            if(value != null) {
                value = datetime.toISO8601(value);
            }
            return value;
        }
    });

    fields.EnumerationField = Field.extend({
        serialize: function(mimetype, value) {
            if(value === '') {
                return null;
            }
            return value;
        },
        _validateValue: function(value) {
            if(_.indexOf(this.enumeration, value) < 0) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.IntegerField = Field.extend({
        serialize: function(mimetype, value) {
            if (value == null || value === '') {
                return null;
            }
            var number = Number(value);
            if (!_.isNaN(number)) {
                return number;
            } else {
                return value;
            }
        },
        _validateValue: function(value) {
            if(value == null) {
                return;
            }
            if(!(isNumber(value) && Math.floor(value) === value)) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.minimum) && value < this.minimum) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.maximum) && value > this.maximum) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.FloatField = Field.extend({
        serialize: function(mimetype, value) {
            if (value == null || value === '') {
                return null;
            }
            var number = Number(value);
            if (!_.isNaN(number)) {
                return number;
            } else {
                return value;
            }
        },
        _validateValue: function(value) {
            if(value == null) {
                return;
            }
            if(!isNumber(value)) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.minimum) && value < this.minimum) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.maximum) && value > this.maximum) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.QuerySortField = Field.extend({
        serialize: function(mimetype, value) {
            var sorting = [], field;
            for(var i = 0, l = value.length; i < l; i++) {
                field = value[i];
                if(_.isArray(field)) {
                    field = field.join('');
                } else {
                    field = field + '+';
                }
                sorting.push(field);
            }
            return sorting.join(',');
        }
    });

    fields.RecursiveField = Field.extend({
        structural: true
    });

    fields.Sequence = Field.extend({
        structural: true,
        extract: function(subject) {
            var item = this.item, extraction = [], value;
            for(var i = 0, l = subject.length; i < l; i++) {
                value = subject[i];
                if(item.structural) {
                    value = item.extract(value);
                }
                extraction[i] = value;
            }
            return extraction;
        },
        serialize: function(mimetype, value) {
            var item = this.item;
            for(var i = 0, l = value.length; i < l; i++) {
                value[i] = item.serialize(mimetype, value[i]);
            }
            return value;
        },
        unserialize: function(mimetype, value) {
            var item = this.item;
            for(var i = 0, l = value.length; i < l; i++) {
                value[i] = item.unserialize(mimetype, value[i]);
            }
            return value;
        },
        validate: function(value, mimetype) {
            if(!_.isArray(value)) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.min_length) && value.length < this.min_length) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.max_length) && value.length > this.max_length) {
                throw new ValidationError('invalid');
            }
            
            var item = this.item, valid = true;
            for(var i = 0, l = value.length; i < l; i++) {
                try {
                    value[i] = item.validate(value[i], mimetype);
                } catch(error) {
                    if(error instanceof ValidationError) {
                        valid = false;
                        value[i] = error;
                    } else {
                        throw error;
                    }
                }
            }
            if(valid) {
                return value;
            } else {
                throw new ValidationError(null, value);
            }
        }
    });

    fields.Structure = Field.extend({
        structural: true,
        extract: function(subject) {
            var structure = this.structure, extraction = {}, name, value, field;
            for(name in structure) {
                value = subject[name];
                if(value !== undefined) {
                    field = structure[name];
                    if(field.structural) {
                        if(value !== null) {
                            extraction[name] = field.extract(value);
                        }
                    } else {
                        extraction[name] = value;
                    }
                }
            }
            return extraction;
        },
        serialize: function(mimetype, value) {
            var structure = this.structure, name, field;
            for(name in value) {
                field = structure[name];
                if (field == null) {
                    throw new Error("attempt to serialize unknown field '" + name + "'");
                }
                if(field.structural && value[name] == null) {
                    delete value[name];
                } else {
                    value[name] = field.serialize(mimetype, value[name]);
                }
            }
            return value;
        },
        unserialize: function(mimetype, value) {
            var structure = this.structure, name;
            for(name in value) {
                value[name] = structure[name].unserialize(mimetype, value[name]);
            }
            return value;
        },
        validate: function(value, mimetype) {
            var valid = true, names, structure, name, field;
            names = _.keys(value);

            structure = {};
            for(name in this.structure) {
                field = this.structure[name];
                if(value[name] !== undefined) {
                    names.splice(_.indexOf(names, name), 1);
                    try {
                        structure[name] = field.validate(value[name], mimetype);
                    } catch(error) {
                        if(error instanceof ValidationError) {
                            valid = false;
                            structure[name] = error;
                        } else {
                            throw error;
                        }
                    }
                } else if(field.required) {
                    valid = false;
                    structure[name] = new ValidationError('missing');
                }
            }

            for(var i = 0, l = names.length; i < l; i++) {
                valid = false;
                structure[names[i]] = new ValidationError('unknown');
            }
            if(valid) {
                return structure;
            } else {
                throw new ValidationError(null, structure);
            }
        }
    });

    fields.TextField = Field.extend({
        _validateValue: function(value) {
            if(!isString(value)) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.min_length) && value.length < this.min_length) {
                throw new ValidationError('invalid');
            }
            if(isNumber(this.max_length) && value.length > this.max_length) {
                throw new ValidationError('invalid');
            }
        }
    });

    fields.TextListField = Field.extend({
        serialize: function(mimetype, value) {
            if(value != null) {
                value = value.join(this.separator || ',');
            }
            return value;
        }
    });

    fields.TimeField = Field.extend({
        serialize: function(mimetype, value) {
            if(value != null) {
                value = value.toISOString();
            }
            return value;
        },
        unserialize: function(mimetype, value) {
            if(value != null) {
               value = new datetime.Time(value);
            }
            return value;
        },
        _validateValue: function(value) {
            if(!(value instanceof datetime.Time)) {
                throw new ValidationError('invalid');
            }
        }
    });

    return fields;
});

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = {
    type: 'object',
    custom(value, errors, schema) {
        if (value && typeof value == 'object') {
            const input = new schema.model(value);
            const result = input.validateSync();
            if (result?.errors) Object.values(result.errors).forEach(err => errors.push({ type: 'schema', message: err.message, field: err.path }));
        }
        return value;
    },
    validationGenerator(schema, name = 'Schema') {
        const model = mongoose.model(name,  new Schema({ ...schema.attributes }, { autoCreate: false }));
        return [{ type: 'schema', model }];
    },
}

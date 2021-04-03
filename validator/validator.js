const FastestValidator = require('moleculer').Validators.Fastest;

const schema = require('./schema');

class Validator extends FastestValidator {
    constructor(opts) {
        super(opts);
        this.validator.alias('schema', schema);
    }
}

module.exports = Validator;

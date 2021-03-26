'use strict';

const { MoleculerError, ServiceSchemaError } = require('moleculer').Errors;
const mongoose = require('mongoose');
const { Schema } = mongoose;
const _ = require('lodash');
require('dotenv').config();

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    settings: {
        database: {
            dialect: process.env.NODE_ENV === 'test' ? 'sqlite' : 'mongo',
            name: 'winhacks',
            uri: process.env.MONGO_URI,
            ops: { useNewUrlParser: true, useUnifiedTopology: true },
        },
    },

    async created() {
        _.set(this.settings, 'database.name', this.schema.name);
    },

    async started() {
        if (process.env.MONGO_URI) {
            this.adapter = mongoose.createConnection(`${this.settings.database.uri}/${this.settings.database.name}?retryWrites=true&w=majority`, this.settings.database.ops);
        } else {
            throw new MoleculerError('Could Not Create Mongoose Adapter');
        }

        const models = this.schema.models;

        Object.keys(models).map((name) => {
            if (this[name]) throw new ServiceSchemaError(`Could not add model name ${name} to service, it already exists`, {});
            const model = models[name];
            this[name] = this.adapter.model(name, new Schema({ ...model.attributes, created: { type: Date, default: Date.now } }, { autoCreate: true, ...model.options }));
        });
    },

    async stopped() {
        if (this.adapter) {
            this.logger.info('Closing database connection');
            try {
                await this.adapter.close();
                this.logger.info('Database connection closed');
            } catch (err) {
                this.logger.error('Error closing database connection', err);
            }
        }
    },
};

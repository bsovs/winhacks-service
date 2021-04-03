'use strict';

const { MoleculerError } = require('moleculer').Errors;
const _ = require('lodash');
const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
    settings: {
        query: {
            name: 'default',
            location: 'US',
            autoRetry: true,
            cert: JSON.parse(process.env.BIGQUERY_API),
        },
    },

    async created() {
        _.set(this.settings, 'client.name', this.schema.name);
    },

    async started() {
        this.bigqueryClient = new BigQuery({ autoRetry: this.settings.query.autoRetry, credentials: this.settings.query.cert, projectId: this.settings.query.cert.project_id });
    },

    methods: {
        async bigQuery(query, params, location) {
            const options = {
                query,
                params,
                location: location || this.settings.query.location,
            };
            const [rows] = await this.bigqueryClient.query(options);
            return rows;
        },
    },

    async stopped() {},
};

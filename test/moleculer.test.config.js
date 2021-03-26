require('dotenv').config();

process.env.NODE_ENV = process.env.INTEGRATION === 'true' ? 'integration' : 'test';

/**
 * @module moleculer.test.config
 * @type {import('moleculer').BrokerOptions}
 */
module.exports = {
    logger: process.env.DEBUG_LOGS === 'true',
    validator: { type: 'Fastest', options: { useNewCustomCheckerFunction: true } },
};

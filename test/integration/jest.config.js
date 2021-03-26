process.env.INTEGRATION = 'true';
process.env.MONGO_URI = 'mongodb://localhost:1234';

module.exports = {
    coverageDirectory: '../coverage/integration',
    testEnvironment: 'node',
    rootDir: '../../services',
    roots: ['../test'],
};

module.exports = {
    root: true,
    env: {
        node: true,
        commonjs: true,
        es6: true,
        jquery: false,
        jest: true,
        jasmine: true,
    },
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: '2020',
    },
    rules: {
        'no-var': ['error'],
        'no-console': ['off'],
        'no-unused-vars': ['warn'],
        'no-mixed-spaces-and-tabs': ['warn'],
        indent: ['error', 4, { SwitchCase: 1 }],
        'max-len': ['error', { code: 1000 }],
    },
}
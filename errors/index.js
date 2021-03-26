const MoleculerErrors = require('moleculer').Errors;

class AuthenticationError extends MoleculerErrors.MoleculerError {
    constructor(message, data) {
        super(message || 'AUTHENTICATION_FAILED', 401, 'AUTHENTICATION_ERROR', data);
    }
}

class AuthorizationError extends MoleculerErrors.MoleculerError {
    constructor(message, data) {
        super(message || 'AUTHORIZATION_FAILED', 403, 'AUTHORIZATION_ERROR', data);
    }
}

class RegistrationError extends MoleculerErrors.MoleculerError {
    constructor(message, data) {
        super(message || 'REGISTRATION_FAILED', 400, 'REGISTRATION_ERROR', data);
    }
}

class B2CError extends Error {
    constructor(data) {
        super(data.message);
        this.code = data.code;
        this.errorCode = data.errorCode;
        this.errorSummary = data.errorSummary;
        this.errorLink = data.errorLink;
        this.errorId = data.errorId;
        this.errorCauses = data.errorCauses;
    }
}

class ConfigurationError extends MoleculerErrors.MoleculerError {
    constructor(message, data) {
        super(message || 'CONFIGURATION_ERROR', 500, 'CONFIGURATION_ERROR', data);
    }
}

class ValidationError extends MoleculerErrors.ValidationError {
    constructor(message, data) {
        super(message || 'VALIDATION_ERROR', 'VALIDATION_ERROR', data);
    }
}

class NotFoundError extends MoleculerErrors.MoleculerError {
    constructor(message, data) {
        super(message || 'NOT_FOUND', 404, 'NOT_FOUND', data);
    }
}

module.exports = {
    AuthorizationError,
    AuthenticationError,
    RegistrationError,
    B2CError: B2CError,
    ConfigurationError,
    ValidationError,
    NotFoundError,
};

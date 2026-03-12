class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.message = message;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export function successResponse(data) {
    return {
        success: true,
        data
    };
}

export function errorResponse(message) {
    return {
        success: false,
        message
    };
}

export default ApiError;
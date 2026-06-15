class AppError extends Error {
  constructor(message, status = 500, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

function createHttpError(status, message) {
  return new AppError(message, status);
}

function unauthorized(message = 'Unauthorized') {
  return createHttpError(401, message);
}

function locked(message = 'Account locked') {
  return createHttpError(423, message);
}

module.exports = {
  AppError,
  createHttpError,
  unauthorized,
  locked,
};

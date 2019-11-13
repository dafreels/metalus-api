class ValidationError extends Error {
  constructor(message, validations) {
    super(message);
    this.name = "ValidationError";
    this.validationErrors = validations;
  }

  getValidationErrors() {
    return this.validationErrors;
  }
}

module.exports = ValidationError;

/**
 * Base UseCase interface
 * All use cases should implement this interface
 * 
 * @template TInput - Input type for the use case
 * @template TOutput - Output type for the use case
 */
export class UseCase {
    /**
     * Execute the use case
     * @param {TInput} input - Input data for the use case
     * @returns {Promise<TOutput>} The result of the use case execution
     * @abstract
     */
    async execute() {
        throw new Error('UseCase.execute() must be implemented by subclass');
    }
}

/**
 * Result wrapper for use case execution
 * Provides consistent success/error handling
 */
export class Result {
    /**
     * @param {boolean} success - Whether the operation succeeded
     * @param {*} data - The result data (if success)
     * @param {string} [error] - Error message (if failed)
     */
    constructor(success, data, error = null) {
        this.success = success;
        this.data = data;
        this.error = error;
    }

    /**
     * Create a successful result
     * @param {*} data - The result data
     * @returns {Result}
     */
    static ok(data) {
        return new Result(true, data, null);
    }

    /**
     * Create a failed result
     * @param {string} error - Error message
     * @returns {Result}
     */
    static fail(error) {
        return new Result(false, null, error);
    }

    /**
     * Check if the result is successful
     * @returns {boolean}
     */
    isSuccess() {
        return this.success;
    }

    /**
     * Check if the result failed
     * @returns {boolean}
     */
    isFailure() {
        return !this.success;
    }

    /**
     * Get the data (throws if failed)
     * @returns {*}
     */
    getValue() {
        if (!this.success) {
            throw new Error(`Cannot get value from failed result: ${this.error}`);
        }
        return this.data;
    }

    /**
     * Get the error message (returns null if success)
     * @returns {string|null}
     */
    getError() {
        return this.error;
    }
}

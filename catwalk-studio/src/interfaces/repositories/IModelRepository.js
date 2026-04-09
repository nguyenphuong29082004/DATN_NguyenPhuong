/* eslint-disable no-unused-vars */
/**
 * IModelRepository Interface
 * Defines the contract for Model data access
 */
export class IModelRepository {
    async findById(_id) { throw new Error('Not implemented'); }
    async findByUsername(_username) { throw new Error('Not implemented'); }
    async findPublic(_filters) { throw new Error('Not implemented'); }
    async create(_model) { throw new Error('Not implemented'); }
    async save(_model) { throw new Error('Not implemented'); }
    async delete(_id) { throw new Error('Not implemented'); }
    async findShootable(_userId) { throw new Error('Not implemented'); }
    async findActiveAIEngines() { throw new Error('Not implemented'); }
}

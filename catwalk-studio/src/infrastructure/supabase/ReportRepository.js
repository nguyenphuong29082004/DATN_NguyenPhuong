import { IReportRepository } from '../../interfaces/repositories/IReportRepository.js';
import { getSupabaseClient } from './supabase.client.js';

export class ReportRepository extends IReportRepository {
    constructor() {
        super();
        this.tableName = 'model_reports';
    }

    get client() {
        return getSupabaseClient();
    }

    async create(report) {
        try {
            const { data, error } = await this.client
                .from(this.tableName)
                .insert(report)
                .select()
                .single();

            if (error) {
                throw new Error(`Failed to create report: ${error.message}`);
            }

            return data;
        } catch (error) {
            console.error('ReportRepository.create:', error);
            throw error;
        }
    }
}

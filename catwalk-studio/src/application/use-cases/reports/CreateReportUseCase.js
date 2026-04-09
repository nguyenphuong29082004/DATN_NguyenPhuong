import { UseCase, Result } from '../UseCase.js';

export class CreateReportUseCase extends UseCase {
    constructor(reportRepository) {
        super();
        this.reportRepository = reportRepository;
    }

    async execute(input) {
        try {
            const { modelId, reporterId, reason } = input;

            if (!modelId) return Result.fail('Model ID is required');
            if (!reporterId) return Result.fail('Reporter ID is required');
            if (!reason || !reason.trim()) return Result.fail('Report reason is required');

            const report = await this.reportRepository.create({
                model_id: modelId,
                reporter_id: reporterId,
                reason: reason.trim(),
                status: 'pending',
            });

            return Result.ok(report);
        } catch (error) {
            return Result.fail(error.message || 'Failed to create report');
        }
    }
}

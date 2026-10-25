import {
    PaymentReportService
} from "../../services/payment-report.service";

import type {
    PaymentReportRepository
} from "../../repositories/payment-report.repository";

import type { DateRange } from "../../utils/date-range";

const range: DateRange = {
    from: "2026-03-01",
    to: "2026-03-31",
    start: "2026-03-01 00:00:00",
    endExclusive: "2026-04-01 00:00:00"
};

const createRepository = () => ({
    getSummary: jest.fn(),
    getTimeseries: jest.fn()
});

describe("PaymentReportService", () => {

    it("computes the success rate from completed attempts", async () => {
        const repository = createRepository();

        repository.getSummary.mockResolvedValue({
            totalPayments: 44,
            initiated: 0,
            processing: 0,
            success: 39,
            failed: 5,
            refundPending: 0,
            refunded: 0,
            successfulAmount: 1250000
        });

        const service = new PaymentReportService(
            repository as unknown as PaymentReportRepository
        );

        const result = await service.getSummary(range);

        expect(
            repository.getSummary
        ).toHaveBeenCalledWith(
            range.start,
            range.endExclusive
        );

        expect(result.successRate).toBe(88.64);
        expect(result.successfulAmount).toBe(1250000);
        expect(result.range).toEqual({
            from: "2026-03-01",
            to: "2026-03-31"
        });
    });

    it("reports a zero success rate when there are no attempts", async () => {
        const repository = createRepository();

        repository.getSummary.mockResolvedValue({
            totalPayments: 0,
            initiated: 0,
            processing: 0,
            success: 0,
            failed: 0,
            refundPending: 0,
            refunded: 0,
            successfulAmount: 0
        });

        const service = new PaymentReportService(
            repository as unknown as PaymentReportRepository
        );

        const result = await service.getSummary(range);

        expect(result.successRate).toBe(0);
    });

    it("forwards the bucket to the repository", async () => {
        const repository = createRepository();

        repository.getTimeseries.mockResolvedValue([]);

        const service = new PaymentReportService(
            repository as unknown as PaymentReportRepository
        );

        const result = await service.getTimeseries(
            range,
            "month"
        );

        expect(
            repository.getTimeseries
        ).toHaveBeenCalledWith(
            range.start,
            range.endExclusive,
            "month"
        );

        expect(result.bucket).toBe("month");
        expect(result.points).toEqual([]);
    });
});

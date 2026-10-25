import {
    parseBucket,
    parseDateRange
} from "../../utils/date-range";

describe("payment parseDateRange", () => {

    it("returns an inclusive range with an exclusive SQL upper bound", () => {
        expect(
            parseDateRange("2026-03-01", "2026-03-31")
        ).toEqual({
            from: "2026-03-01",
            to: "2026-03-31",
            start: "2026-03-01 00:00:00",
            endExclusive: "2026-04-01 00:00:00"
        });
    });

    it("defaults to the last 30 days ending today", () => {
        const range = parseDateRange(
            undefined,
            undefined
        );

        expect(range.to).toBe(
            new Date().toISOString().slice(0, 10)
        );
    });

    const expectBadRequest = (
        action: () => unknown
    ): void => {
        try {
            action();

            throw new Error(
                "expected parseDateRange to throw"
            );
        } catch (error) {
            const typed = error as {
                statusCode?: number;
            };

            expect(typed.statusCode).toBe(400);
        }
    };

    it("rejects malformed dates with a 400 status", () => {
        expectBadRequest(() =>
            parseDateRange("01-03-2026", undefined)
        );

        expectBadRequest(() =>
            parseDateRange("2026-02-30", undefined)
        );
    });

    it("rejects a from date after the to date", () => {
        expectBadRequest(() =>
            parseDateRange("2026-06-02", "2026-06-01")
        );
    });
});

describe("payment parseBucket", () => {

    it("defaults to day and accepts month", () => {
        expect(parseBucket(undefined)).toBe("day");
        expect(parseBucket("month")).toBe("month");
    });

    it("rejects unknown buckets with a 400 status", () => {
        try {
            parseBucket("quarter");

            throw new Error("expected parseBucket to throw");
        } catch (error) {
            expect(
                (error as { statusCode?: number })
                    .statusCode
            ).toBe(400);
        }
    });
});

import { createRequestHash } from "../../utils/request-hash.util";

describe("createRequestHash", () => {

    it("should generate a SHA-256 hash for a request payload", () => {
        const payload = {
            orderId: "ORD-TEST-001",
            amount: 50000,
            paymentMethod: "UPI"
        };

        const hash = createRequestHash(payload);

        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should generate the same hash for the same payload", () => {
        const payload = {
            orderId: "ORD-TEST-002",
            amount: 50000,
            paymentMethod: "UPI"
        };

        const firstHash =
            createRequestHash(payload);

        const secondHash =
            createRequestHash(payload);

        expect(firstHash).toBe(secondHash);
    });

    it("should generate different hashes for different payloads", () => {
        const firstPayload = {
            orderId: "ORD-TEST-003",
            amount: 50000,
            paymentMethod: "UPI"
        };

        const secondPayload = {
            orderId: "ORD-TEST-003",
            amount: 60000,
            paymentMethod: "UPI"
        };

        const firstHash =
            createRequestHash(firstPayload);

        const secondHash =
            createRequestHash(secondPayload);

        expect(firstHash).not.toBe(secondHash);
    });
});
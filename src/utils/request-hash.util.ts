import crypto from "node:crypto";

export const createRequestHash = (
    payload: unknown
): string => {
    const serializedPayload =
        JSON.stringify(payload);

    return crypto
        .createHash("sha256")
        .update(serializedPayload)
        .digest("hex");
};
import HttpError from './HttpError';

const MAX_REASON_LENGTH = 200;

// Why a CSR cancelled or refunded something. Shared, so every reason follows the same rule;
// only the message for a missing reason differs.
const readReason = (
	body: Record<string, unknown> | undefined,
	missingMessage: string,
): string => {
	const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
	if (!reason) throw new HttpError(400, missingMessage);
	if (reason.length > MAX_REASON_LENGTH) {
		throw new HttpError(
			400,
			`Reason must be ${MAX_REASON_LENGTH} characters or less`,
		);
	}
	return reason;
};

export default readReason;

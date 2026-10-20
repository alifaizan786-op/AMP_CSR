import HttpError from './HttpError';

const MAX_REASON_LENGTH = 200;

// Shared by single-membership and whole-account cancellations, so both follow the same rule
const readCancelReason = (
	body: Record<string, unknown> | undefined,
): string => {
	const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
	if (!reason) throw new HttpError(400, 'A cancellation reason is required');
	if (reason.length > MAX_REASON_LENGTH) {
		throw new HttpError(
			400,
			`Reason must be ${MAX_REASON_LENGTH} characters or less`,
		);
	}
	return reason;
};

export default readCancelReason;
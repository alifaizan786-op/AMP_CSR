// A card works through the last day of its expiry month, so 10/26 is still valid on Oct 31, 2026.
// Compared as month counts in UTC, so the answer is the same in every time zone.
const isCardExpired = (
	card: { expMonth: number; expYear: number },
	now = new Date(),
): boolean =>
	now.getUTCFullYear() * 12 + now.getUTCMonth() >
	card.expYear * 12 + (card.expMonth - 1);

export default isCardExpired;

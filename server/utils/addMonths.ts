// Returns a new date the given number of months later (or earlier, if negative),
// leaving the original untouched. A day that doesn't exist in the target month is
// clamped to its last day: Jan 31 + 1 month is Feb 28 (or 29), not Mar 3.
// UTC throughout, so the result doesn't depend on the server's time zone.
const addMonths = (date: Date, months: number): Date => {
	const result = new Date(date);
	const day = result.getUTCDate();
	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + months);
	const lastDay = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
	).getUTCDate();
	result.setUTCDate(Math.min(day, lastDay));
	return result;
};

export default addMonths;

// Reads a positive whole number from a query string value,
// falling back to a default
const parsePositiveInt = (value: unknown, fallback: number): number => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default parsePositiveInt;

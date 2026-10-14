// Returns a new date the given number of months later, leaving the original untouched
const addMonths = (date: Date, months: number): Date => {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
};

export default addMonths;

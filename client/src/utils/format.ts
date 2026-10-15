// Display helpers. The API stores money in cents and phones as digits only.

export const formatPhone = (digits: string): string => {
	if (digits.length === 10) {
		return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
	}
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
	}
	// UK and other international numbers: show with a leading + rather than guess the grouping
	return `+${digits}`;
};

export const formatMoney = (cents: number): string =>
	(cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const formatDate = (iso: string): string =>
	new Date(iso).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

export const fullName = (person: {
	firstName: string;
	lastName: string;
}): string => `${person.firstName} ${person.lastName}`;

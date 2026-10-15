import type { AccountFields } from '../types';

export type AccountField = keyof AccountFields;
export type AccountErrors = Partial<Record<AccountField, string>>;

// Same cleanup the server applies, so "changed" means changed after normalizing
export const normalizeAccountField = (
	field: AccountField,
	value: string,
): string => {
	if (field === 'email') return value.trim().toLowerCase();
	if (field === 'phone') return value.replace(/\D/g, '');
	return value.trim();
};

// Quick feedback before a round trip; the server still validates everything
export const validateAccount = (form: AccountFields): AccountErrors => {
	const errors: AccountErrors = {};
	if (!form.firstName.trim()) errors.firstName = 'First name is required';
	if (!form.lastName.trim()) errors.lastName = 'Last name is required';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
		errors.email = 'Enter a valid email address';
	}
	if (!/^\d{10,15}$/.test(normalizeAccountField('phone', form.phone))) {
		errors.phone = 'Enter 10 to 15 digits';
	}
	return errors;
};
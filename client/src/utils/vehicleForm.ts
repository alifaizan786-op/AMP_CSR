import type { PlanKey, VehicleInput } from '../types';

// What the CSR types; every field is a string until we build the request
export interface VehicleForm {
	plate: string;
	year: string;
	make: string;
	model: string;
	color: string;
	plan: PlanKey | '';
}

export type VehicleErrors = Partial<Record<'plate' | 'year', string>>;

export const EMPTY_VEHICLE_FORM: VehicleForm = {
	plate: '',
	year: '',
	make: '',
	model: '',
	color: '',
	plan: '',
};

// Same as the server's setter: "abc-123" and "ABC 123" are the same plate
export const normalizePlate = (value: string): string =>
	value.replace(/[\s-]/g, '').toUpperCase();

// Quick feedback before a round trip; the server still validates everything
export const validateVehicle = (form: VehicleForm): VehicleErrors => {
	const errors: VehicleErrors = {};

	if (!/^[A-Z0-9]{2,8}$/.test(normalizePlate(form.plate))) {
		errors.plate = 'Enter 2 to 8 letters or numbers';
	}

	const year = form.year.trim();
	const maxYear = new Date().getFullYear() + 1;
	if (
		year &&
		(!/^\d{4}$/.test(year) || Number(year) < 1980 || Number(year) > maxYear)
	) {
		errors.year = `Enter a year from 1980 to ${maxYear}`;
	}

	return errors;
};

// Only sends fields the CSR filled in, with year as a number
export const toVehicleInput = (form: VehicleForm): VehicleInput => {
	const input: VehicleInput = { plate: normalizePlate(form.plate) };
	if (form.year.trim()) input.year = Number(form.year.trim());
	if (form.make.trim()) input.make = form.make.trim();
	if (form.model.trim()) input.model = form.model.trim();
	if (form.color.trim()) input.color = form.color.trim();
	return input;
};

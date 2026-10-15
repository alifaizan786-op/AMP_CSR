import { useState } from 'react';
import type { VehicleErrors, VehicleForm } from '../utils/vehicleForm';
import { EMPTY_VEHICLE_FORM, validateVehicle } from '../utils/vehicleForm';

// Form state shared by every dialog that collects a vehicle (add, transfer to a new car)
const useVehicleForm = () => {
	const [form, setForm] = useState<VehicleForm>(EMPTY_VEHICLE_FORM);
	const [errors, setErrors] = useState<VehicleErrors>({});

	const changeField = (field: keyof VehicleForm, value: string) => {
		setForm({ ...form, [field]: value });
		// Only plate and year are validated; clear their error as soon as the CSR edits them
		if (field === 'plate' || field === 'year') {
			setErrors({ ...errors, [field]: undefined });
		}
	};

	// Shows any errors and returns true when the form is ready to send
	const validate = (): boolean => {
		const found = validateVehicle(form);
		setErrors(found);
		return Object.keys(found).length === 0;
	};

	return { form, errors, changeField, validate };
};

export default useVehicleForm;

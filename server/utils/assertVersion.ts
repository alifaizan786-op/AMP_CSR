import { CustomerDocument } from '../models';
import HttpError from './HttpError';

// Rejects a write made from an out-of-date page. The version check on save() only catches two
// saves racing on the server; this catches a CSR acting on data loaded minutes ago, which would
// otherwise silently overwrite a newer change. The client sends the __v it loaded.
const assertVersion = (customer: CustomerDocument, expected: unknown) => {
	if (typeof expected !== 'number' || !Number.isInteger(expected)) {
		throw new HttpError(400, 'expectedVersion must be a whole number');
	}
	if (customer.__v !== expected) {
		throw new HttpError(
			409,
			'This account was changed by someone else since you opened it',
		);
	}
};

export default assertVersion;

import { Types } from 'mongoose';
import { Activity } from '../models';

// Records a change in the customer's activity log so other CSRs can see
// what was done and when
const logActivity = (
	customerId: Types.ObjectId,
	message: string,
	type: 'change' | 'note' = 'change',
) => Activity.create({ customer: customerId, type, message, author: 'CSR' });

export default logActivity;

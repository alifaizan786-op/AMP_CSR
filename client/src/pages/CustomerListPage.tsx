import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { getCustomers } from '../api/customers';

const CustomerListPage = () => {
	useEffect(() => {
		getCustomers({ search: 'jordan' }).then(console.log).catch(console.error);
	}, []);

	return <Typography variant='h1'>Customers</Typography>;
};

export default CustomerListPage;

import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';

const CustomerDetailPage = () => {
	const { id } = useParams();
	return <Typography variant='h1'>Customer {id}</Typography>;
};

export default CustomerDetailPage;

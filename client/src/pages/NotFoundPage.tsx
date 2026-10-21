import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button, Paper, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Shown for any URL that isn't a page, so a mistyped or old link still has a way back
const NotFoundPage = () => (
	<Paper sx={{ p: 4, textAlign: 'center' }}>
		<Typography variant='h2'>Page not found</Typography>
		<Typography sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
			The link may be wrong or out of date.
		</Typography>
		<Button
			component={RouterLink}
			to='/'
			variant='contained'
			startIcon={<ArrowBackIcon />}>
			Back to customers
		</Button>
	</Paper>
);

export default NotFoundPage;

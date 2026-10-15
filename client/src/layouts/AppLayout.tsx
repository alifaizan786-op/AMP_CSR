import {
	AppBar,
	Box,
	Container,
	LinearProgress,
	Toolbar,
	Typography,
} from '@mui/material';
import { Suspense } from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';

// Top bar shared by every page; <Outlet /> is where the current page renders
const AppLayout = () => (
	<Box sx={{ minHeight: '100vh' }}>
		<AppBar position='static' elevation={0} sx={{ bgcolor: 'text.primary' }}>
			<Toolbar variant='dense'>
				<Typography
					component={RouterLink}
					to='/'
					sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
					AMP Support
				</Typography>
			</Toolbar>
		</AppBar>
		<Container maxWidth='lg' sx={{ py: 4 }}>
			<Suspense fallback={<LinearProgress />}>
				<Outlet />
			</Suspense>
		</Container>
	</Box>
);

export default AppLayout;

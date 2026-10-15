import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
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
			<Outlet />
		</Container>
	</Box>
);

export default AppLayout;

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { colors } from '../theme';

// Top bar shared by every page; <Outlet /> is where the current page renders
const AppLayout = () => (
	<Box sx={{ minHeight: '100vh' }}>
		<AppBar position='static' elevation={0} sx={{ bgcolor: colors.ink }}>
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

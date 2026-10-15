import { createTheme } from '@mui/material/styles';

// Status colors carry the meaning; everything else stays quiet
export const colors = {
	ink: '#17202A',
	muted: '#5B6673',
	surface: '#F2F5F7',
	paper: '#FFFFFF',
	line: '#DCE3E8',
	primary: '#0B6E99',
	overdue: '#B42318',
	active: '#1E7B4F',
	inactive: '#5B6673',
};

const theme = createTheme({
	palette: {
		primary: { main: colors.primary },
		error: { main: colors.overdue },
		success: { main: colors.active },
		text: { primary: colors.ink, secondary: colors.muted },
		background: { default: colors.surface, paper: colors.paper },
		divider: colors.line,
	},
	typography: {
		fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
		h1: { fontSize: '1.75rem', fontWeight: 600 },
		h2: { fontSize: '1.25rem', fontWeight: 600 },
		button: { textTransform: 'none', fontWeight: 600 },
	},
	shape: { borderRadius: 8 },
	components: {
		// Flat panels with a thin border instead of drop shadows
		MuiPaper: {
			defaultProps: { elevation: 0 },
			styleOverrides: { root: { border: `1px solid ${colors.line}` } },
		},
	},
});

export default theme;

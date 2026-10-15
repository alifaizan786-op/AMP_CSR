import { Box } from '@mui/material';

// Styled like a real license plate, since plates are how CSRs and customers identify a car:
// an outer rim, an inner embossed border, a colored band across the top, and two mounting holes
const PlateBadge = ({ plate }: { plate: string }) => (
	<Box
		component='span'
		sx={{
			position: 'relative',
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			minWidth: 60,
			height: 30,
			px: 1.75,
			pt: '4px',
			border: '1.5px solid',
			borderColor: 'text.primary',
			borderTop: '5px solid',
			borderTopColor: 'primary.main',
			borderRadius: '5px',
			bgcolor: 'background.paper',
			// Inner embossed border, inset from the rim
			boxShadow: (theme) =>
				`inset 0 0 0 2px ${theme.palette.background.paper}, inset 0 0 0 3px ${theme.palette.divider}`,
			fontSize: '0.8rem',
			fontWeight: 700,
			letterSpacing: '0.12em',
			lineHeight: 1,
			whiteSpace: 'nowrap',
			// Mounting holes
			'&::before, &::after': {
				content: '""',
				position: 'absolute',
				top: 4,
				width: 4,
				height: 4,
				borderRadius: '50%',
				bgcolor: 'grey.400',
			},
			'&::before': { left: 5 },
			'&::after': { right: 5 },
		}}>
		{plate}
	</Box>
);

export default PlateBadge;

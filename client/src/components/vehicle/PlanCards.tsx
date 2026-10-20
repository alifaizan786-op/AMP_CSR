import CheckIcon from '@mui/icons-material/Check';
import {
	Box,
	Card,
	CardActionArea,
	Chip,
	Stack,
	Typography,
} from '@mui/material';
import PLANS from '../../constants/plans';
import type { PlanKey } from '../../types';
import { formatMoney } from '../../utils/format';

const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];

interface PlanCardsProps {
	value: PlanKey | '';
	onChange: (plan: PlanKey) => void;
	// The plan the car is on now; marked and not selectable when changing plans
	currentPlan?: PlanKey;
	disabled?: boolean;
}

// Plans side by side, so a CSR can compare them and explain the difference on the call.
// Behaves like a radio group: one choice, announced as such to screen readers.
const PlanCards = ({
	value,
	onChange,
	currentPlan,
	disabled = false,
}: PlanCardsProps) => (
	<Stack
		role='radiogroup'
		aria-label='Plan'
		direction={{ xs: 'column', sm: 'row' }}
		spacing={1.5}>
		{PLAN_KEYS.map((key) => {
			const plan = PLANS[key];
			const isCurrent = key === currentPlan;
			const isSelected = key === value;

			return (
				<Card
					key={key}
					sx={{
						flex: 1,
						borderWidth: 2,
						borderColor: isSelected ? 'primary.main' : 'divider',
					}}>
					<CardActionArea
						role='radio'
						aria-checked={isSelected}
						disabled={disabled || isCurrent}
						onClick={() => onChange(key)}
						// Buttons center their content; pin it to the top so the cards line up
						sx={{
							height: '100%',
							p: 2,
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'flex-start',
							alignItems: 'stretch',
						}}>
						<Stack spacing={1}>
							<Stack
								direction='row'
								sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography sx={{ fontWeight: 600 }}>{plan.name}</Typography>
								{isCurrent && <Chip label='Current' size='small' />}
							</Stack>
							<Typography variant='h2' component='p'>
								{formatMoney(plan.price)}
								<Typography
									component='span'
									sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
									/mo
								</Typography>
							</Typography>
							<Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none' }}>
								{plan.includes.map((item) => (
									<Stack
										key={item}
										component='li'
										direction='row'
										spacing={0.75}
										sx={{ alignItems: 'center', py: 0.25 }}>
										<CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
										<Typography variant='body2'>{item}</Typography>
									</Stack>
								))}
							</Box>
						</Stack>
					</CardActionArea>
				</Card>
			);
		})}
	</Stack>
);

export default PlanCards;

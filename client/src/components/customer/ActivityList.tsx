import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { Paper, Stack, Typography } from '@mui/material';
import type { Activity } from '../../types';
import { formatDate } from '../../utils/format';

// Notes (written by CSRs) and changes (recorded by the system) get different icons,
// so a CSR can skim for what a person said vs what the system did
const ActivityList = ({ activities }: { activities: Activity[] }) => (
	<Paper sx={{ p: 2.5 }}>
		<Typography variant='h2' sx={{ mb: 2 }}>
			Activity ({activities.length})
		</Typography>

		{activities.length === 0 ? (
			<Typography sx={{ color: 'text.secondary' }}>No activity yet.</Typography>
		) : (
			<Stack spacing={2}>
				{activities.map((activity) => {
					const Icon =
						activity.type === 'note'
							? StickyNote2OutlinedIcon
							: HistoryOutlinedIcon;
					return (
						<Stack key={activity._id} direction='row' spacing={1.5}>
							<Icon
								fontSize='small'
								sx={{ color: 'text.secondary', mt: 0.25 }}
							/>
							<div>
								<Typography sx={{ wordBreak: 'break-word' }}>
									{activity.message}
								</Typography>
								<Typography variant='body2' sx={{ color: 'text.secondary' }}>
									{formatDate(activity.createdAt)} · {activity.author}
								</Typography>
							</div>
						</Stack>
					);
				})}
			</Stack>
		)}
	</Paper>
);

export default ActivityList;

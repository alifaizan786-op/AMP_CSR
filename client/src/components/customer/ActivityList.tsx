import AddIcon from '@mui/icons-material/Add';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { Activity } from '../../types';
import { formatDate } from '../../utils/format';
import AddNoteDialog from './AddNoteDialog';

interface ActivityListProps {
	customerId: string;
	activities: Activity[];
	onSaved: (message: string) => void;
}

// Notes (written by CSRs) and changes (recorded by the system) get different icons,
// so a CSR can skim for what a person said vs what the system did
const ActivityList = ({
	customerId,
	activities,
	onSaved,
}: ActivityListProps) => {
	const [adding, setAdding] = useState(false);

	return (
		<Paper sx={{ p: 2.5 }}>
			<Stack
				direction='row'
				sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
				<Typography variant='h2'>Activity ({activities.length})</Typography>
				<Button
					size='small'
					startIcon={<AddIcon />}
					onClick={() => setAdding(true)}>
					Add note
				</Button>
			</Stack>

			{activities.length === 0 ? (
				<Typography sx={{ color: 'text.secondary' }}>
					No activity yet.
				</Typography>
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
									<Typography
										sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
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

			{adding && (
				<AddNoteDialog
					customerId={customerId}
					onClose={() => setAdding(false)}
					onSaved={() => {
						setAdding(false);
						onSaved('Note added');
					}}
				/>
			)}
		</Paper>
	);
};

export default ActivityList;

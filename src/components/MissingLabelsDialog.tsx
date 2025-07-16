import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from './ui/button';

// Updated interface to include open prop
interface MissingLabelsDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (startDate: Date) => void;
	isLoading: boolean;
}

const MissingLabelsDialog: React.FC<MissingLabelsDialogProps> = ({ 
	open, 
	onClose, 
	onConfirm, 
	isLoading 
}) => {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [selectedTime, setSelectedTime] = useState('');

	const handleSubmit = () => {
		if (!selectedDate || !selectedTime) {
			toast.error('Please select both date and time');
			return;
		}

		// Create a date object by combining the selected date and time
		const [hours, minutes, seconds = '00'] = selectedTime.split(':');
		const combinedDateTime = new Date(selectedDate);
		combinedDateTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));

		if (combinedDateTime > new Date()) {
			toast.error('Start date cannot be in the future');
			return;
		}

		// The Date object is already in local time (Perth), so toISOString() will convert to UTC correctly
		onConfirm(combinedDateTime);
	};

	const handleClose = () => {
		// Reset form state immediately
		setSelectedDate(undefined);
		setSelectedTime('');
		// Call parent close handler immediately
		onClose();
	};

	// Set default values to current date/time in Perth timezone
	useEffect(() => {
		if (open && !selectedDate && !selectedTime) {
			const now = new Date();
			setSelectedDate(now);
			setSelectedTime(now.toTimeString().slice(0, 8)); // HH:MM:SS format
		}
	}, [open, selectedDate, selectedTime]);

	// Reset form when dialog closes
	useEffect(() => {
		if (!open) {
			setSelectedDate(undefined);
			setSelectedTime('');
		}
	}, [open]);

	return (
		<Dialog 
			open={open} 
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					handleClose();
				}
			}}
            modal={true}
		>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Print Missing Labels</DialogTitle>
					<DialogDescription>
						Select the start date and time to find orders placed since then (Perth time)
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{/* Time Picker */}
					<div className="flex flex-col gap-3">
						<Label htmlFor="time-picker" className="px-1">
							Time
						</Label>
						<Input
							type="time"
							id="time-picker"
							step="1"
							value={selectedTime}
							onChange={(e) => setSelectedTime(e.target.value)}
							className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
						/>
					</div>

					{/* Date Picker */}
					<div className="flex flex-col gap-3">
						<Label className="px-1">
							Date
						</Label>
						<div className="flex justify-center">
							<Calendar
								mode="single"
								selected={selectedDate}
								onSelect={setSelectedDate}
								disabled={(date) => date > new Date()}
								className="rounded-md border"
							/>
						</div>
					</div>

					<div className="text-xs text-gray-500 mt-2">
						<p>Times are in Perth, Western Australia timezone (UTC+8)</p>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isLoading}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							'Generate Labels'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default MissingLabelsDialog;
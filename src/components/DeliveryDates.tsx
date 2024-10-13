import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Calendar } from '../components/ui/calendar';
import { Button } from '../components/ui/button';
import { updateBlockedDates, getBlockedDates } from '../services/date-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import toast from 'react-hot-toast';

const DeliveryDateController: React.FC = () => {
	const { dispatch } = useAppContext();
	const [selectedDates, setSelectedDates] = useState<Date[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchBlockedDates = async () => {
			try {
				setIsLoading(true);
				const dates = await getBlockedDates();
				setSelectedDates(removeDuplicateDates(dates.map((date) => new Date(date))));
			} catch (error) {
				console.error('Error fetching blocked dates:', error);
				toast.error('Failed to load blocked dates. Please try again.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchBlockedDates();
	}, []);

	const handleDateSelect = (dates: Date[] | undefined) => {
		if (!dates) return;
		const weekdayDates = dates.filter((date) => date.getDay() !== 0 && date.getDay() !== 6);
		setSelectedDates(removeDuplicateDates(weekdayDates));
	};

	const handleSaveDates = async () => {
		setIsLoading(true);
		try {
			const uniqueSelectedDates = removeDuplicateDates(selectedDates);
			await updateBlockedDates(uniqueSelectedDates);

			const updatedBlockedDates = uniqueSelectedDates.map((d) => d.toISOString());
			dispatch({ type: 'SET_BLOCKED_DATES', payload: updatedBlockedDates });
			setSelectedDates(uniqueSelectedDates);
			toast.success('Blocked dates updated successfully!');
		} catch (error) {
			console.error('Error saving blocked dates:', error);
			toast.error('Failed to update blocked dates. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const removeDuplicateDates = (dates: Date[]): Date[] => {
		return Array.from(new Set(dates.map((d) => d.toISOString()))).map((d) => new Date(d));
	};

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	};

	const getUpcomingBlockedDates = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return selectedDates.filter((date) => date >= today).sort((a, b) => a.getTime() - b.getTime());
	};

	const upcomingBlockedDates = getUpcomingBlockedDates();

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold">Manage Delivery Dates</h2>
			<p>Select weekdays to block or unblock for delivery:</p>
			<div className="flex flex-col md:flex-row gap-4">
				<div className="flex flex-col justify-start items-center gap-2">
					<Calendar
						mode="multiple"
						selected={selectedDates}
						onSelect={handleDateSelect}
						disabled={isWeekend}
						className="rounded-md"
					/>
					<Button
						onClick={handleSaveDates}
						disabled={isLoading}
					>
						{isLoading ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Upcoming Blocked Dates</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{upcomingBlockedDates.length === 0 ? (
							<TableRow>
								<TableCell>No upcoming blocked dates</TableCell>
							</TableRow>
						) : (
							upcomingBlockedDates.map((date, index) => (
								<TableRow key={index}>
									<TableCell>{formatDate(date)}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default DeliveryDateController;

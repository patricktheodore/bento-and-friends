import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getSchools, updateSchoolValidDates, updateSchoolMenuItems } from '../services/school-operations';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Main } from '@/models/item.model';

const Schools: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [isAdmin, setIsAdmin] = useState(false);
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [schoolSelectedDates, setSchoolSelectedDates] = useState<Record<string, Date[]>>({});
	const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
	const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
	const [availableMenuItems, setAvailableMenuItems] = useState<Main[]>([]);
	const [schoolMenuItems, setSchoolMenuItems] = useState<Record<string, string[]>>({});
	const [savingMenuStates, setSavingMenuStates] = useState<Record<string, boolean>>({});

	// Hook to track screen size for responsive calendar
	useEffect(() => {
		const updateScreenSize = () => {
			setScreenSize({ width: window.innerWidth, height: window.innerHeight });
		};

		// Set initial screen size
		updateScreenSize();

		// Add event listener
		window.addEventListener('resize', updateScreenSize);

		// Cleanup
		return () => window.removeEventListener('resize', updateScreenSize);
	}, []);

	// Determine number of months based on screen size
	const getNumberOfMonths = () => {
		if (screenSize.width >= 1280) return 3; // xl screens
		if (screenSize.width >= 768) return 2; // md screens
		return 1; // sm screens
	};

	useEffect(() => {
		const fetchSchoolsAndCheckAdmin = async () => {
			try {
				const user = await getCurrentUser();
				if (!user) {
					toast.error('User not authenticated');
					return;
				}

				const adminStatus = user.isAdmin;
				setIsAdmin(adminStatus);

				// Fetch schools
				const response = await getSchools();
				if (response.success && response.data) {
					dispatch({ type: 'SET_SCHOOLS', payload: response.data });

					// Initialize selected dates for each school
					const initialDates: Record<string, Date[]> = {};
					const initialMenuItems: Record<string, string[]> = {};

					response.data.forEach((school) => {
						initialDates[school.id] = school.validDates.map((date) => new Date(date)) || [];
						initialMenuItems[school.id] = school.menuItems || [];
					});

					setSchoolSelectedDates(initialDates);
					setSchoolMenuItems(initialMenuItems);
				} else {
					toast.error(response.error || 'Failed to fetch schools');
				}

                const activeMenuItems = state.mains.filter((item) => item.isActive);
                setAvailableMenuItems(activeMenuItems);
			} catch (error) {
				toast.error((error as Error).message);
			}
		};

		fetchSchoolsAndCheckAdmin();
	}, [dispatch]);

	const toggleRowExpansion = (schoolId: string) => {
		const newExpandedRows = new Set(expandedRows);
		if (newExpandedRows.has(schoolId)) {
			newExpandedRows.delete(schoolId);
		} else {
			newExpandedRows.add(schoolId);
		}
		setExpandedRows(newExpandedRows);
	};

	const handleSchoolDateSelect = (schoolId: string, dates: Date[] | undefined) => {
		if (!dates) return;
		const uniqueDates = removeDuplicateDates(dates);

		setSchoolSelectedDates((prev) => ({
			...prev,
			[schoolId]: uniqueDates,
		}));
	};

	const handleSaveSchoolDates = async (schoolId: string) => {
		setSavingStates((prev) => ({ ...prev, [schoolId]: true }));

		try {
			const selectedDates = schoolSelectedDates[schoolId] || [];
			const uniqueSelectedDates = removeDuplicateDates(selectedDates);

			const response = await updateSchoolValidDates(schoolId, uniqueSelectedDates);

			if (response.success) {
				const updatedSchools = state.schools.map((school) =>
					school.id === schoolId ? { ...school, validDates: response.data || [] } : school
				);

				dispatch({ type: 'SET_SCHOOLS', payload: updatedSchools });

				setSchoolSelectedDates((prev) => ({
					...prev,
					[schoolId]: uniqueSelectedDates,
				}));

				toast.success(`Valid dates updated for ${state.schools.find((s) => s.id === schoolId)?.name}`);
			} else {
				toast.error(response.error || 'Failed to update school dates');
			}
		} catch (error) {
			console.error('Error saving school dates:', error);
			toast.error('Failed to update school dates. Please try again.');
		} finally {
			setSavingStates((prev) => ({ ...prev, [schoolId]: false }));
		}
	};

	const handleMenuItemToggle = (schoolId: string, menuItemId: string) => {
		setSchoolMenuItems((prev) => {
			const currentItems = prev[schoolId] || [];
			const updatedItems = currentItems.includes(menuItemId)
				? currentItems.filter((id) => id !== menuItemId)
				: [...currentItems, menuItemId];

			return {
				...prev,
				[schoolId]: updatedItems,
			};
		});
	};

	const handleSaveSchoolMenuItems = async (schoolId: string) => {
		setSavingMenuStates((prev) => ({ ...prev, [schoolId]: true }));

		try {
			const selectedMenuItems = schoolMenuItems[schoolId] || [];
			const response = await updateSchoolMenuItems(schoolId, selectedMenuItems);

			if (response.success) {
				// Update the school in the global state
				const updatedSchools = state.schools.map((school) =>
					school.id === schoolId ? { ...school, menuItems: selectedMenuItems } : school
				);
				dispatch({ type: 'SET_SCHOOLS', payload: updatedSchools });

				toast.success(`Menu items updated for ${state.schools.find((s) => s.id === schoolId)?.name}`);
			} else {
				toast.error(response.error || 'Failed to update school menu items');
			}
		} catch (error) {
			console.error('Error saving school menu items:', error);
			toast.error('Failed to update school menu items. Please try again.');
		} finally {
			setSavingMenuStates((prev) => ({ ...prev, [schoolId]: false }));
		}
	};

	const removeDuplicateDates = (dates: Date[]): Date[] => {
        return Array.from(new Set(dates.map((d) => d.toISOString()))).map((d) => new Date(d));
	};

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	if (!isAdmin) {
		return <div>You do not have permission to access this page.</div>;
	}

	return (
		<div className="w-full px-4 space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold">Schools</h2>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[50px]"></TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Address</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{state.schools.map((school) => (
							<React.Fragment key={school.id}>
								<TableRow className="cursor-pointer hover:bg-gray-50">
									<TableCell>
										<button
											onClick={(e) => {
												e.stopPropagation();
												toggleRowExpansion(school.id);
											}}
											className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200">
											{expandedRows.has(school.id) ? (
												<ChevronDownIcon className="w-4 h-4" />
											) : (
												<ChevronRightIcon className="w-4 h-4" />
											)}
										</button>
									</TableCell>
									<TableCell className="font-medium">
										<div className="flex items-center">
											<span
												className={`w-2 h-2 ${
													school.isActive ? 'bg-green-500' : 'bg-red-500'
												} rounded-full mr-2`}></span>
											{school.name}
										</div>
									</TableCell>
									<TableCell>{school.address}</TableCell>
									<TableCell>{school.isActive ? 'Active' : 'Inactive'}</TableCell>
								</TableRow>
								{expandedRows.has(school.id) && (
									<TableRow>
										<TableCell
											colSpan={5}
											className="bg-gray-50 p-6">
											<div className="space-y-6">
												<div className="grid grid-cols-1 gap-4">
													{/* Menu Items Management Section */}
													<div>
														<h4 className="text-md font-semibold mb-4">
															Manage Menu Items
														</h4>
														<p className="text-sm text-gray-600 mb-4">
															Select menu items available for this school:
														</p>

														<div className="space-y-4">
															{/* Menu Items Grid */}
															<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
																{availableMenuItems.map((menuItem) => (
																	<div
																		key={menuItem.id}
																		className="flex items-start space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50">
																		<input
																			type="checkbox"
																			id={`${school.id}-${menuItem.id}`}
																			checked={(
																				schoolMenuItems[school.id] || []
																			).includes(menuItem.id)}
																			onChange={() =>
																				handleMenuItemToggle(
																					school.id,
																					menuItem.id
																				)
																			}
																			className="mt-1 h-4 w-4 text-brand-dark-green accent-brand-dark-green focus:ring-brand-dark-green border-gray-300 rounded"
																		/>
																		<div className="flex-1 min-w-0">
																			<label
																				htmlFor={`${school.id}-${menuItem.id}`}
																				className="text-sm font-medium text-gray-900 cursor-pointer">
																				{menuItem.display}
																			</label>
																			{menuItem.description && (
																				<p className="text-xs text-gray-500 mt-1">
																					{menuItem.description}
																				</p>
																			)}
																			{menuItem.price && (
																				<p className="text-xs text-green-600 font-medium mt-1">
																					${menuItem.price.toFixed(2)}
																				</p>
																			)}
																		</div>
																	</div>
																))}
															</div>

															{/* Selected items summary */}
															<div className="bg-blue-50 p-3 rounded-lg">
																<p className="text-sm font-medium text-blue-900">
																	Selected Items:{' '}
																	{(schoolMenuItems[school.id] || []).length}
																</p>
																{(schoolMenuItems[school.id] || []).length > 0 && (
																	<div className="mt-2 flex flex-wrap gap-1">
																		{(schoolMenuItems[school.id] || []).map(
																			(itemId) => {
																				const item = availableMenuItems.find(
																					(mi) => mi.id === itemId
																				);
																				return item ? (
																					<span
																						key={itemId}
																						className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																						{item.display}
																					</span>
																				) : null;
																			}
																		)}
																	</div>
																)}
															</div>

															<Button
																onClick={() => handleSaveSchoolMenuItems(school.id)}
																disabled={savingMenuStates[school.id]}
																className="w-fit px-8">
																{savingMenuStates[school.id]
																	? 'Saving...'
																	: 'Save Menu Items'}
															</Button>
														</div>
													</div>
												</div>

												{/* Date Management Section */}
												<div className="border-t pt-6">
													<h4 className="text-md font-semibold mb-4">
														Manage Valid Delivery Dates
													</h4>
													<p className="text-sm text-gray-600 mb-4">
														Select weekdays when this school can receive deliveries:
													</p>

													<div className="flex flex-col items-start gap-4">
														<Calendar
															mode="multiple"
															selected={schoolSelectedDates[school.id] || []}
															onSelect={(dates) => handleSchoolDateSelect(school.id, dates)}
															disabled={isWeekend}
															numberOfMonths={getNumberOfMonths()}
															className="rounded-md border w-fit"
															showOutsideDays={true}
														/>
														<Button
															onClick={() => handleSaveSchoolDates(school.id)}
															disabled={savingStates[school.id]}
															className="w-fit px-8">
															{savingStates[school.id] ? 'Saving...' : 'Save Valid Dates'}
														</Button>
													</div>
												</div>
											</div>
										</TableCell>
									</TableRow>
								)}
							</React.Fragment>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};

export default Schools;
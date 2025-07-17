import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { getCurrentUser } from '../services/auth';
import { getSchools, addSchool, updateSchool, updateSchoolValidDates, updateSchoolMenuItems, getSchoolEnrollmentData, SchoolEnrollmentData, SchoolChildrenData } from '../services/school-operations';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Users, GraduationCap, UserCheck, Mail, Loader2, Plus, Power } from 'lucide-react';
import { Main } from '@/models/item.model';
import { School } from '@/models/school.model';

// Add these imports for the dialog
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

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
	const [enrollmentData, setEnrollmentData] = useState<SchoolEnrollmentData>({});
	const [loadingEnrollment, setLoadingEnrollment] = useState(false);
	const [savingActiveStates, setSavingActiveStates] = useState<Record<string, boolean>>({});
	const [editingSchoolNames, setEditingSchoolNames] = useState<Record<string, string>>({});
	const [savingNameStates, setSavingNameStates] = useState<Record<string, boolean>>({});

	// Add School Dialog State
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [addSchoolForm, setAddSchoolForm] = useState({
		name: '',
		address: ''
	});
	const [isAddingSchool, setIsAddingSchool] = useState(false);

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

	// Fetch enrollment data
	const fetchEnrollmentData = async () => {
		setLoadingEnrollment(true);
		try {
			const response = await getSchoolEnrollmentData();
			if (response.success && response.data) {
				setEnrollmentData(response.data);
			} else {
				console.error('Failed to fetch enrollment data:', response.error);
			}
		} catch (error) {
			console.error('Error fetching enrollment data:', error);
		} finally {
			setLoadingEnrollment(false);
		}
	};

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
				const initialNames: Record<string, string> = {};

				response.data.forEach((school) => {
					initialDates[school.id] = school.validDates.map((date) => new Date(date)) || [];
					initialMenuItems[school.id] = school.menuItems || [];
					initialNames[school.id] = school.name;
				});

				setSchoolSelectedDates(initialDates);
				setSchoolMenuItems(initialMenuItems);
				setEditingSchoolNames(initialNames);
			} else {
				toast.error(response.error || 'Failed to fetch schools');
			}

			const activeMenuItems = state.mains.filter((item) => item.isActive);
			setAvailableMenuItems(activeMenuItems);

			// Fetch enrollment data
			await fetchEnrollmentData();
		} catch (error) {
			toast.error((error as Error).message);
		}
	};

	useEffect(() => {
		fetchSchoolsAndCheckAdmin();
	}, [dispatch]);

	// Add School Handler
	const handleAddSchool = async () => {
		// Validate form
		if (!addSchoolForm.name.trim() || !addSchoolForm.address.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}

		setIsAddingSchool(true);

		try {
			const newSchoolData: Omit<School, 'id'> = {
				name: addSchoolForm.name.trim(),
				address: addSchoolForm.address.trim(),
				isActive: false,
				menuItems: [],
				validDates: []
			};

			const response = await addSchool(newSchoolData);

			if (response.success && response.data) {
				// Add the new school to the state
				dispatch({ type: 'SET_SCHOOLS', payload: [...state.schools, response.data] });
				
				// Initialize the new school's data
				setSchoolSelectedDates(prev => ({
					...prev,
					[response.data!.id]: []
				}));
				setSchoolMenuItems(prev => ({
					...prev,
					[response.data!.id]: []
				}));
				setEditingSchoolNames(prev => ({
					...prev,
					[response.data!.id]: response.data!.name
				}));

				// Reset form and close dialog
				setAddSchoolForm({ name: '', address: '' });
				setIsAddDialogOpen(false);

				toast.success(`School "${response.data.name}" added successfully`);
			} else {
				toast.error(response.error || 'Failed to add school');
			}
		} catch (error) {
			console.error('Error adding school:', error);
			toast.error('Failed to add school. Please try again.');
		} finally {
			setIsAddingSchool(false);
		}
	};

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

	const handleUpdateSchoolActiveStatus = async (schoolId: string, isActive: boolean) => {
		setSavingActiveStates((prev) => ({ ...prev, [schoolId]: true }));

		try {
			const response = await updateSchool(schoolId, { isActive });

			if (response.success) {
				// Update the school in the global state
				const updatedSchools = state.schools.map((school) =>
					school.id === schoolId ? { ...school, isActive } : school
				);
				dispatch({ type: 'SET_SCHOOLS', payload: updatedSchools });

				const schoolName = state.schools.find((s) => s.id === schoolId)?.name;
				toast.success(`${schoolName} is now ${isActive ? 'active' : 'inactive'}`);
			} else {
				toast.error(response.error || 'Failed to update school status');
			}
		} catch (error) {
			console.error('Error updating school status:', error);
			toast.error('Failed to update school status. Please try again.');
		} finally {
			setSavingActiveStates((prev) => ({ ...prev, [schoolId]: false }));
		}
	};

	const handleUpdateSchoolName = async (schoolId: string) => {
		const newName = editingSchoolNames[schoolId]?.trim();
		
		if (!newName) {
			toast.error('School name cannot be empty');
			return;
		}

		setSavingNameStates((prev) => ({ ...prev, [schoolId]: true }));

		try {
			const response = await updateSchool(schoolId, { name: newName });

			if (response.success) {
				// Update the school in the global state
				const updatedSchools = state.schools.map((school) =>
					school.id === schoolId ? { ...school, name: newName } : school
				);
				dispatch({ type: 'SET_SCHOOLS', payload: updatedSchools });

				toast.success(`School name updated to "${newName}"`);
			} else {
				toast.error(response.error || 'Failed to update school name');
				// Reset the name input to the original value on error
				const originalName = state.schools.find((s) => s.id === schoolId)?.name || '';
				setEditingSchoolNames(prev => ({ ...prev, [schoolId]: originalName }));
			}
		} catch (error) {
			console.error('Error updating school name:', error);
			toast.error('Failed to update school name. Please try again.');
			// Reset the name input to the original value on error
			const originalName = state.schools.find((s) => s.id === schoolId)?.name || '';
			setEditingSchoolNames(prev => ({ ...prev, [schoolId]: originalName }));
		} finally {
			setSavingNameStates((prev) => ({ ...prev, [schoolId]: false }));
		}
	};

	const removeDuplicateDates = (dates: Date[]): Date[] => {
        return Array.from(new Set(dates.map((d) => d.toISOString()))).map((d) => new Date(d));
	};

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	const getInitials = (name: string): string => {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	};

	const getSchoolEnrollment = (schoolId: string): SchoolChildrenData => {
		return enrollmentData[schoolId] || { childrenCount: 0, users: [] };
	};

	// Enrollment Summary Component
	const EnrollmentSummary = ({ schoolId }: { schoolId: string }) => {
		const enrollment = getSchoolEnrollment(schoolId);
		const maxUsersToShow = 3;

		if (loadingEnrollment) {
			return (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-lg flex items-center gap-2">
							Enrollment Information
						</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
						<span className="ml-2 text-gray-500">Loading enrollment data...</span>
					</CardContent>
				</Card>
			);
		}

		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-lg flex items-center gap-2">
						Enrollment Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 rounded-full">
								<GraduationCap className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Children</p>
								<p className="text-2xl font-bold text-blue-900">{enrollment.childrenCount}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 rounded-full">
								<UserCheck className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Parent Users</p>
								<p className="text-2xl font-bold text-green-900">{enrollment.users.length}</p>
							</div>
						</div>
					</div>

					{enrollment.users.length > 0 ? (
						<div className="space-y-3">
							<h5 className="font-medium text-gray-900">
								Recent {enrollment.users.length > maxUsersToShow && `(${maxUsersToShow} of ${enrollment.users.length})`}
							</h5>
							<div className="space-y-3">
								{enrollment.users.slice(0, maxUsersToShow).map((user) => (
									<div key={user.userId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
										<Avatar className="h-10 w-10">
											<AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
												{getInitials(user.userName)}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<p className="font-medium text-gray-900 truncate">{user.userName}</p>
												<Badge variant="secondary" className="text-xs">
													{user.children.length} child{user.children.length !== 1 ? 'ren' : ''}
												</Badge>
											</div>
											<div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
												<Mail className="h-3 w-3" />
												<span className="truncate">{user.userEmail}</span>
											</div>
											<div className="space-y-1">
												{user.children.map((child) => (
													<div key={child.id} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
														<span className="font-medium">{child.name}</span>
														{!child.isTeacher && child.year && child.className && (
															<span className="text-gray-500"> • Year {child.year}, {child.className}</span>
														)}
														{child.isTeacher && (
															<span className="text-green-600"> • Teacher</span>
														)}
													</div>
												))}
											</div>
										</div>
									</div>
								))}
							</div>
							{enrollment.users.length > maxUsersToShow && (
								<p className="text-sm text-gray-500 text-center mt-3">
									+ {enrollment.users.length - maxUsersToShow} more parent{enrollment.users.length - maxUsersToShow !== 1 ? 's' : ''}
								</p>
							)}
						</div>
					) : (
						<div className="text-center py-6">
							<div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
								<Users className="h-6 w-6 text-gray-400" />
							</div>
							<p className="text-gray-500">No children enrolled yet</p>
							<p className="text-sm text-gray-400 mt-1">Users will appear here when they register children for this school</p>
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	if (!isAdmin) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
						<UserCheck className="h-6 w-6 text-red-600" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
					<p className="text-gray-500">You do not have permission to access this page.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6 p-4 sm:p-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Schools</h1>
					<p className="text-gray-600 mt-1">Manage schools, enrollment, and delivery settings</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={fetchEnrollmentData}
						disabled={loadingEnrollment}
						variant="outline"
						className="flex items-center gap-2"
					>
						{loadingEnrollment ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Users className="h-4 w-4" />
						)}
						Refresh Enrollment
					</Button>
					
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button className="flex items-center gap-2">
								<Plus className="h-4 w-4" />
								Add School
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[425px]">
							<DialogHeader>
								<DialogTitle>Add New School</DialogTitle>
								<DialogDescription>
									Create a new school. You can configure menu items and delivery dates after creation.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="school-name">School Name *</Label>
									<Input
										id="school-name"
										placeholder="Enter school name"
										value={addSchoolForm.name}
										onChange={(e) => setAddSchoolForm(prev => ({ ...prev, name: e.target.value }))}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="school-address">Address *</Label>
									<Input
										id="school-address"
										placeholder="Enter school address"
										value={addSchoolForm.address}
										onChange={(e) => setAddSchoolForm(prev => ({ ...prev, address: e.target.value }))}
									/>
								</div>
								<div className="text-sm text-gray-500">
									* Required fields. School will be created as inactive by default.
								</div>
							</div>
							<DialogFooter>
								<Button 
									variant="outline" 
									onClick={() => {
										setIsAddDialogOpen(false);
										setAddSchoolForm({ name: '', address: '' });
									}}
									disabled={isAddingSchool}
								>
									Cancel
								</Button>
								<Button 
									onClick={handleAddSchool}
									disabled={isAddingSchool || !addSchoolForm.name.trim() || !addSchoolForm.address.trim()}
								>
									{isAddingSchool ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
											Adding...
										</>
									) : (
										'Add School'
									)}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<Card>
				<div className="rounded-lg border overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="bg-gray-50">
								<TableHead className="w-[50px]"></TableHead>
								<TableHead className="font-semibold">School Name</TableHead>
								<TableHead className="font-semibold">Address</TableHead>
								<TableHead className="font-semibold text-center">Recipients</TableHead>
								<TableHead className="font-semibold">Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{state.schools.map((school) => {
								const enrollment = getSchoolEnrollment(school.id);
								return (
									<React.Fragment key={school.id}>
										<TableRow className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleRowExpansion(school.id)}>
											<TableCell>
												<button
													onClick={(e) => {
														e.stopPropagation();
														toggleRowExpansion(school.id);
													}}
													className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-200 transition-colors">
													{expandedRows.has(school.id) ? (
														<ChevronDownIcon className="w-4 h-4 text-gray-600" />
													) : (
														<ChevronRightIcon className="w-4 h-4 text-gray-600" />
													)}
												</button>
											</TableCell>
											<TableCell className="font-medium">
												<div className="flex items-center gap-3">
													<span
														className={`w-3 h-3 ${
															school.isActive ? 'bg-green-500' : 'bg-red-500'
														} rounded-full flex-shrink-0`}></span>
													<span>{school.name}</span>
												</div>
											</TableCell>
											<TableCell className="text-gray-600">{school.address}</TableCell>
											<TableCell className="text-center">
												<Badge variant="secondary" className="rounded-full">
													{loadingEnrollment ? '...' : enrollment.childrenCount}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant={school.isActive ? 'default' : 'secondary'}>
													{school.isActive ? 'Active' : 'Inactive'}
												</Badge>
											</TableCell>
										</TableRow>
										{expandedRows.has(school.id) && (
											<TableRow>
												<TableCell colSpan={6} className="p-0">
													<div className="bg-gray-50 p-6 border-t">
														<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
															{/* Left Column */}
															<div className="space-y-6">
																{/* School Name Management */}
																<Card>
																	<CardHeader className="pb-3">
																		<CardTitle className="text-lg flex items-center gap-2">
																			School Name
																		</CardTitle>
																		<p className="text-sm text-gray-600">
																			Update the school name
																		</p>
																	</CardHeader>
																	<CardContent className="space-y-4">
																		<div className="flex gap-3">
																			<Input
																				value={editingSchoolNames[school.id] || ''}
																				onChange={(e) => setEditingSchoolNames(prev => ({ 
																					...prev, 
																					[school.id]: e.target.value 
																				}))}
																				placeholder="Enter school name"
																				disabled={savingNameStates[school.id]}
																				className="flex-1"
																			/>
																			<Button
																				onClick={() => handleUpdateSchoolName(school.id)}
																				disabled={
																					savingNameStates[school.id] || 
																					!editingSchoolNames[school.id]?.trim() ||
																					editingSchoolNames[school.id]?.trim() === school.name
																				}
																				className="px-4"
																			>
																				{savingNameStates[school.id] ? (
																					<Loader2 className="h-4 w-4 animate-spin" />
																				) : (
																					'Save'
																				)}
																			</Button>
																		</div>
																		{editingSchoolNames[school.id]?.trim() !== school.name && editingSchoolNames[school.id]?.trim() && (
																			<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
																				<p className="text-sm text-blue-800">
																					<strong>Preview:</strong> "{editingSchoolNames[school.id]?.trim()}"
																				</p>
																			</div>
																		)}
																	</CardContent>
																</Card>

																{/* Active Status Management */}
																<Card>
																	<CardHeader className="pb-3">
																		<CardTitle className="text-lg flex items-center gap-2">
																			School Status
																		</CardTitle>
																		<p className="text-sm text-gray-600">
																			Control whether this school is active and can receive orders
																		</p>
																	</CardHeader>
																	<CardContent className="space-y-4">
																		<div className="flex items-center justify-between p-4 bg-white rounded-lg border">
																			<div className="flex items-center gap-3">
																				<div className={`p-2 rounded-full ${school.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
																					<Power className={`h-5 w-5 ${school.isActive ? 'text-green-600' : 'text-red-600'}`} />
																				</div>
																				<div>
																					<p className="font-medium text-gray-900">
																						{school.isActive ? 'Active' : 'Inactive'}
																					</p>
																					<p className="text-sm text-gray-500">
																						{school.isActive 
																							? 'School can receive orders and deliveries' 
																							: 'School is disabled for orders and deliveries'
																						}
																					</p>
																				</div>
																			</div>
																			<div className="flex items-center gap-3">
																				<Switch
																					checked={school.isActive}
																					onCheckedChange={(checked) => handleUpdateSchoolActiveStatus(school.id, checked)}
																					disabled={savingActiveStates[school.id]}
																				/>
																				{savingActiveStates[school.id] && (
																					<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
																				)}
																			</div>
																		</div>
																		{!school.isActive && (
																			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
																				<p className="text-sm text-yellow-800">
																					<strong>Note:</strong> While inactive, this school will not appear in ordering options and cannot receive deliveries.
																				</p>
																			</div>
																		)}
																	</CardContent>
																</Card>

																{/* Date Management Section */}
																<Card>
																	<CardHeader className="pb-3">
																		<CardTitle className="text-lg">Delivery Dates</CardTitle>
																		<p className="text-sm text-gray-600">
																			Select weekdays when this school can receive deliveries
																		</p>
																	</CardHeader>
																	<CardContent className="space-y-4">
																		<div className="flex flex-col items-center gap-4">
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
																				className="w-full">
																				{savingStates[school.id] ? 'Saving...' : 'Save Valid Dates'}
																			</Button>
																		</div>
																	</CardContent>
																</Card>

																{/* Enrollment Information */}
																<EnrollmentSummary schoolId={school.id} />
															</div>

															{/* Right Column - Menu Items Management */}
															<div className="space-y-6">
																<Card>
																	<CardHeader className="pb-3">
																		<CardTitle className="text-lg">Menu Items Management</CardTitle>
																		<p className="text-sm text-gray-600">
																			Select menu items available for this school
																		</p>
																	</CardHeader>
																	<CardContent className="space-y-4">
																		{/* Menu Items Grid */}
																		<div className="grid grid-cols-1 gap-3">
																			{availableMenuItems.map((menuItem) => (
																				<div
																					key={menuItem.id}
                                                                                    onClick={() => handleMenuItemToggle(school.id, menuItem.id)}
																					className="flex items-start space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
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
																						className="mt-1 h-4 w-4 text-blue-600 accent-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
																								<Badge key={itemId} variant="secondary" className="text-xs">
																									{item.display}
																								</Badge>
																							) : null;
																						}
																					)}
																				</div>
																			)}
																		</div>

																		<Button
																			onClick={() => handleSaveSchoolMenuItems(school.id)}
																			disabled={savingMenuStates[school.id]}
																			className="w-full">
																			{savingMenuStates[school.id]
																				? 'Saving...'
																				: 'Save Menu Items'}
																		</Button>
																	</CardContent>
																</Card>
															</div>
														</div>
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</Card>
		</div>
	);
};

export default Schools;
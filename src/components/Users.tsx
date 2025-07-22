import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ChevronDown, ChevronUp, Loader2, Search, UserCog, Phone, Mail, School, Users, Calendar, DollarSign, Filter, X } from 'lucide-react';
import { fetchUserDetails, updateUserInFirebase } from '../services/user-service';
import { User as UserType, OrderHistory, Child } from '../models/user.model';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { db } from '@/firebase';
import { query, collection, orderBy, startAfter, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import debounce from 'lodash/debounce';
import ChildManagementDialog from './ChildManagementDialog';
import { Label } from './ui/label';
import { useAppContext } from '@/context/AppContext';

const PAGE_SIZE = 50;

const UsersComponent: React.FC = () => {
    const { state } = useAppContext();
	const [users, setUsers] = useState<UserType[]>([]);
	const [lastVisible, setLastVisible] = useState<any>(null);
	const [hasMore, setHasMore] = useState(true);
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
	const [expandedUserDetails, setExpandedUserDetails] = useState<UserType | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedSchool, setSelectedSchool] = useState<string>('all');
	const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
	const [selectedChild, setSelectedChild] = useState<Child | null>(null);
	const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
	const [isEditingPhone, setIsEditingPhone] = useState(false);
	const [editedPhone, setEditedPhone] = useState('');

    const schools = state.schools || [];

	const handleEditChild = async (childId: string) => {
		const user = expandedUserDetails;
		if (!user) return;

		const child = user.children.find((c) => c.id === childId);
		if (!child) return;

		setSelectedChild(child);
		setIsChildDialogOpen(true);
	};

	const handlePhoneUpdate = async (userId: string, newPhone: string) => {
		if (!expandedUserDetails) return;
	
		try {
			// Basic validation
			const cleanPhone = newPhone.replace(/\D/g, '');
			if (newPhone && (cleanPhone.length !== 10 || !cleanPhone.startsWith('0'))) {
				toast.error('Please enter a valid Australian phone number');
				return;
			}
	
			const updatedUser = {
				...expandedUserDetails,
				phone: cleanPhone || '', // Save empty string if no phone provided
			};
	
			await updateUserInFirebase(updatedUser);
			
			// Update expandedUserDetails
			setExpandedUserDetails(updatedUser);
			
			// Update the users array
			setUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId ? { ...user, phone: cleanPhone || '' } : user
				)
			);
			
			// Update the filtered users array
			setFilteredUsers(prevUsers => 
				prevUsers.map(user => 
					user.id === userId ? { ...user, phone: cleanPhone || '' } : user
				)
			);
	
			setIsEditingPhone(false);
			toast.success('Phone number updated successfully');
		} catch (error) {
			console.error('Error updating phone number:', error);
			toast.error('Failed to update phone number');
		}
	};

	const formatPhoneNumber = (phone: string): string => {
		if (!phone) return 'Not provided';

		const cleanPhone = phone.replace(/\D/g, '');
		if (cleanPhone.startsWith('04')) {
			// Mobile format: 04XX XXX XXX
			return cleanPhone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
		} else {
			// Landline format: 0X XXXX XXXX
			return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
		}
	};

	const fetchUsers = async (lastDoc?: any) => {
		setIsLoading(true);
		try {
			let usersQuery = query(collection(db, 'users-test2'), orderBy('displayName', 'asc'));

			if (lastDoc) {
				usersQuery = query(usersQuery, startAfter(lastDoc));
			}

			const querySnapshot = await getDocs(usersQuery);
			const newUsers = querySnapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						...doc.data(),
					} as UserType)
			);

			setUsers((prevUsers) => (lastDoc ? [...prevUsers, ...newUsers] : newUsers));
			setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
			setHasMore(querySnapshot.docs.length === PAGE_SIZE);
		} catch (error) {
			console.error('Error fetching users: ', error);
			toast.error('Failed to fetch users');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// Enhanced filtering function that handles both search and school filter
	const filterUsers = (searchTerm: string, schoolId: string) => {
		let filtered = users;

		// Filter by school if not "all"
		if (schoolId !== 'all') {
			filtered = filtered.filter(user => 
				user.children.some(child => child.schoolId === schoolId)
			);
		}

		// Filter by search term if provided
		if (searchTerm.trim()) {
			const lowerSearchTerm = searchTerm.toLowerCase();
			filtered = filtered.filter((user) => {
				// Check user name
				const nameMatch = user.displayName.toLowerCase().includes(lowerSearchTerm);

				// Check email
				const emailMatch = user.email.toLowerCase().includes(lowerSearchTerm);

				// Check children names
				const childrenMatch = user.children.some((child) => child.name.toLowerCase().includes(lowerSearchTerm));

				return nameMatch || emailMatch || childrenMatch;
			});
		}

		setFilteredUsers(filtered);
	};

	// Debounce the search to avoid too many re-renders
	const debouncedFilter = debounce((searchTerm: string, school: string) => {
		filterUsers(searchTerm, school);
	}, 300);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		debouncedFilter(value, selectedSchool);
	};

	const handleSchoolChange = (school: string) => {
		setSelectedSchool(school);
		filterUsers(searchTerm, school);
	};

	// Update filtered users when users change
	useEffect(() => {
		filterUsers(searchTerm, selectedSchool);
	}, [users]);

	const loadMore = () => {
		if (!isLoading && hasMore) {
			fetchUsers(lastVisible);
		}
	};

	const handleUserClick = async (userId: string) => {
		if (expandedUserId === userId) {
			setExpandedUserId(null);
			setExpandedUserDetails(null);
		} else {
			setIsLoading(true);
			setExpandedUserId(userId);
			try {
				const userDetails = await fetchUserDetails(userId);
				setExpandedUserDetails(userDetails);
			} catch (error) {
				console.error('Error fetching user details:', error);
				toast.error('Failed to fetch user details');
			} finally {
				setIsLoading(false);
			}
		}
	};

	const handleChildUpdate = async (updatedChildData: Omit<Child, 'id'>) => {
		if (!expandedUserDetails || !selectedChild) return;

		try {
			const updatedChildren = expandedUserDetails.children.map((child) =>
				child.id === selectedChild.id ? { ...child, ...updatedChildData } : child
			);

			const updatedUser = {
				...expandedUserDetails,
				children: updatedChildren,
			};

			await updateUserInFirebase(updatedUser);
			setExpandedUserDetails(updatedUser);
			toast.success('Child information updated successfully');
		} catch (error) {
			console.error('Error updating child:', error);
			toast.error('Failed to update child information');
		}
	};

	const handleRemoveChild = async (childId: string) => {
		if (!expandedUserDetails) return;

		try {
			const updatedChildren = expandedUserDetails.children.filter((child) => child.id !== childId);

			const updatedUser = {
				...expandedUserDetails,
				children: updatedChildren,
			};

			await updateUserInFirebase(updatedUser);
			setExpandedUserDetails(updatedUser);
			toast.success('Child removed successfully');
		} catch (error) {
			console.error('Error removing child:', error);
			toast.error('Failed to remove child');
		}
	};

	// Get schools for a specific user
	const getUserSchools = (user: UserType): string[] => {
		const schools = user.children
			.map(child => child.schoolId)
			.filter(school => school && school.trim())
			.filter((school, index, arr) => arr.indexOf(school) === index); // Remove duplicates
		return schools;
	};

	const clearFilters = () => {
		setSearchTerm('');
		setSelectedSchool('all');
		setFilteredUsers(users);
	};

	const getInitials = (name: string): string => {
		return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
	};

    const startAnAdminOrder = () => {
        console.log('start')
    }

	// Mobile Card Component
	const MobileUserCard = ({ user }: { user: UserType }) => {
		const isExpanded = expandedUserId === user.id;
		const userSchools = getUserSchools(user);

		return (
			<Card className="w-full">
				<CardContent className="p-4">
					<div 
						className="flex items-center justify-between cursor-pointer" 
						onClick={() => handleUserClick(user.id)}
					>
						<div className="flex items-center space-x-3 flex-1 min-w-0">
							<Avatar className="h-10 w-10 flex-shrink-0">
								<AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
									{getInitials(user.displayName)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<h3 className="font-medium text-gray-900 truncate">{user.displayName}</h3>
								<p className="text-sm text-gray-500 truncate">{user.email}</p>
								<div className="flex items-center gap-2 mt-1">
									<span className="text-xs text-gray-400">{user.orders?.length || 0} orders</span>
									{user.phone && (
										<span className="text-xs text-gray-400">• {formatPhoneNumber(user.phone)}</span>
									)}
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-2 flex-shrink-0">
							<div className="flex flex-wrap gap-1 max-w-[100px]">
								{userSchools.slice(0, 2).map((school, index) => (
									<Badge key={index} variant="secondary" className="text-xs">
										{schools.find(s => s.id === school)?.name?.substring(0, 8) || school.substring(0, 8)}
									</Badge>
								))}
								{userSchools.length > 2 && (
									<Badge variant="secondary" className="text-xs">+{userSchools.length - 2}</Badge>
								)}
							</div>
							{isExpanded ? (
								isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin text-gray-500" />
								) : (
									<ChevronUp className="h-4 w-4 text-gray-500" />
								)
							) : (
								<ChevronDown className="h-4 w-4 text-gray-500" />
							)}
						</div>
					</div>

					{isExpanded && expandedUserDetails && (
						<div className="mt-4 pt-4 border-t space-y-4">
							{/* Contact Information */}
							<div className="space-y-3">
								<h4 className="font-medium text-gray-900 flex items-center gap-2">
									Contact Information
								</h4>
								<div className="space-y-2 pl-6">
									<div className="flex items-center gap-2 text-sm">
										<Mail className="h-3 w-3 text-gray-400" />
										<span className="text-gray-600">{user.email}</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Phone className="h-3 w-3 text-gray-400" />
										{isEditingPhone ? (
											<div className="flex items-center gap-2 flex-1">
												<Input
													value={editedPhone}
													onChange={(e) => setEditedPhone(e.target.value)}
													placeholder="Enter phone number"
													className="text-sm h-8"
												/>
												<Button size="sm" onClick={() => handlePhoneUpdate(user.id, editedPhone)}>
													Save
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														setIsEditingPhone(false);
														setEditedPhone(user.phone || '');
													}}
												>
													Cancel
												</Button>
											</div>
										) : (
											<div className="flex items-center gap-2 flex-1">
												<span className="text-gray-600">
													{formatPhoneNumber(user.phone || '')}
												</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setEditedPhone(user.phone || '');
														setIsEditingPhone(true);
													}}
													className="h-6 px-2 text-xs"
												>
													Edit
												</Button>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Children */}
							{expandedUserDetails.children.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-medium text-gray-900 flex items-center gap-2">
										Children / Recipients ({expandedUserDetails.children.length})
									</h4>
									<div className="space-y-3 pl-6">
										{expandedUserDetails.children.map((child) => (
											<div key={child.id} className="bg-gray-50 rounded-lg p-3">
												<div className="flex items-center justify-between mb-2">
													<span className="font-medium text-sm">{child.name}</span>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleEditChild(child.id)}
														className="h-6 w-6 p-0"
													>
														<UserCog className="h-3 w-3" />
													</Button>
												</div>
												<div className="space-y-1 text-xs text-gray-600">
													<div>School: {schools.find(s => s.id === child.schoolId)?.name || 'Unknown'}</div>
													{!child.isTeacher && (
														<>
															<div>Year: {child.year}</div>
															<div>Class: {child.className}</div>
														</>
													)}
													<div>Role: {child.isTeacher ? 'Teacher' : 'Student'}</div>
													{child.allergens && <div>Allergens: {child.allergens}</div>}
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Orders */}
							{expandedUserDetails.orders && expandedUserDetails.orders.length > 0 && (
								<div className="space-y-3">
									<h4 className="font-medium text-gray-900 flex items-center gap-2">
										Recent Orders ({expandedUserDetails.orders.length})
									</h4>
									<div className="space-y-2 pl-6">
										{expandedUserDetails.orders.slice(0, 3).map((order: OrderHistory) => (
											<div key={order.orderId} className="bg-gray-50 rounded-lg p-3">
												<div className="flex justify-between items-start text-sm">
													<div>
														<div className="font-medium">#{order.orderId}</div>
														<div className="text-gray-600 flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															{new Date(order.orderedOn).toLocaleDateString()}
														</div>
													</div>
													<div className="text-right">
														<div className="font-medium flex items-center gap-1">
															<DollarSign className="h-3 w-3" />
															{order.totalPaid}
														</div>
														<div className="text-gray-600 text-xs">{order.itemCount} items</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	const NoUsersDisplay = () => (
		<Card className="mt-8">
			<CardContent className="text-center py-12">
				<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
					<Users className="h-8 w-8 text-gray-400" />
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
				<p className="text-gray-500 mb-6 max-w-sm mx-auto">
					{searchTerm || selectedSchool !== 'all' 
						? 'No users match your current filter criteria. Try adjusting your search terms.' 
						: 'There are no users in the system yet. Users will appear here once they sign up.'
					}
				</p>
				{(searchTerm || selectedSchool !== 'all') && (
					<Button variant="outline" onClick={clearFilters} className="inline-flex items-center gap-2">
						<X className="h-4 w-4" />
						Clear Filters
					</Button>
				)}
			</CardContent>
		</Card>
	);

	return (
		<div className="w-full space-y-4">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Users</h1>
					<p className="text-gray-600 mt-1">Manage and view user information</p>
				</div>
				
				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					{/* School Filter */}
					<div className="min-w-[200px]">
						<Select value={selectedSchool} onValueChange={handleSchoolChange}>
							<SelectTrigger className="w-full">
								<div className="flex items-center gap-2">
									<School className="h-4 w-4 text-gray-500" />
									<SelectValue placeholder="Filter by school" />
								</div>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Schools</SelectItem>
								{schools.map((school) => (
                                    <SelectItem key={school.id} value={school.id}>
                                        {school.name}
                                    </SelectItem>
                                ))}
							</SelectContent>
						</Select>
					</div>

					{/* Search Input */}
					<div className="relative min-w-[280px]">
						<Input
							type="text"
							placeholder="Search by name, email, or child name..."
							value={searchTerm}
							onChange={handleSearch}
							className="pl-10"
						/>
						<Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
					</div>
				</div>
			</div>

			{/* Active Filters */}
			{(searchTerm || selectedSchool !== 'all') && (
				<div className="flex flex-wrap items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4 text-blue-600" />
						<span className="text-sm font-medium text-blue-900">Active Filters:</span>
					</div>
					{selectedSchool !== 'all' && (
						<Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
							School: {schools.find(s => s.id === selectedSchool)?.name}
						</Badge>
					)}
					{searchTerm && (
						<Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
							Search: "{searchTerm}"
						</Badge>
					)}
					<div className="flex items-center gap-2 ml-auto">
						<span className="text-sm text-blue-700">
							{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
						</span>
						<Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2 hover:bg-blue-200">
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
			)}

			{filteredUsers.length === 0 ? (
				<NoUsersDisplay />
			) : (
				<>
					{/* Desktop Table View */}
					<div className="hidden lg:block">
						<Card>
							<div className="rounded-lg border overflow-hidden">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50">
											<TableHead className="font-semibold">Name</TableHead>
											<TableHead className="font-semibold">Email</TableHead>
											<TableHead className="font-semibold">Phone</TableHead>
											<TableHead className="font-semibold">Schools</TableHead>
											<TableHead className="font-semibold text-center">Orders</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredUsers.map((user) => (
											<React.Fragment key={user.id}>
												<TableRow
													className="cursor-pointer hover:bg-gray-50 transition-colors"
													onClick={() => handleUserClick(user.id)}
												>
													<TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {expandedUserId === user.id ? (
                                                                isLoading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                                                ) : (
                                                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                                                )
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                                            )}
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                                                                    {getInitials(user.displayName)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{user.displayName}</span>
                                                        </div>
													</TableCell>
													<TableCell>
														<span className="text-gray-600">{user.email}</span>
													</TableCell>
													<TableCell>
														<span className="text-gray-600">
															{user.phone ? formatPhoneNumber(user.phone) : 'Not provided'}
														</span>
													</TableCell>
													<TableCell>
														<div className="flex flex-wrap gap-1">
															{getUserSchools(user).map((school, index) => (
																<Badge key={index} variant="outline" className="text-xs">
																	{schools.find(s => s.id === school)?.name || school}
																</Badge>
															))}
															{getUserSchools(user).length === 0 && (
																<span className="text-gray-400 text-sm">No school assigned</span>
															)}
														</div>
													</TableCell>
													<TableCell className="text-center">
														<Badge variant="secondary" className="rounded-full">
															{user.orders?.length || 0}
														</Badge>
													</TableCell>
												</TableRow>
												{expandedUserId === user.id && expandedUserDetails && (
													<TableRow>
														<TableCell colSpan={5} className="p-0">
															<div className="bg-gray-50 p-6 border-t">
																<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
																	{/* Contact Information */}
																	<Card>
																		<CardHeader className="pb-3">
																			<CardTitle className="text-lg flex items-center gap-2">
																				Contact Information
																			</CardTitle>
																		</CardHeader>
																		<CardContent className="space-y-4">
																			<div className="space-y-2">
																				<div className="flex items-center gap-2 text-sm text-gray-500">
																					<Label>Email</Label>
																				</div>
																				<p className="text-gray-900 font-medium">{user.email}</p>
																			</div>

																			<div className="space-y-2">
																				<div className="flex items-center gap-2 text-sm text-gray-500">
																					<Label>Phone Number</Label>
																				</div>
																				{isEditingPhone ? (
																					<div className="space-y-2">
																						<Input
																							value={editedPhone}
																							onChange={(e) => setEditedPhone(e.target.value)}
																							placeholder="Enter phone number"
																						/>
																						<div className="flex gap-2">
																							<Button
																								size="sm"
																								onClick={() => handlePhoneUpdate(user.id, editedPhone)}
																							>
																								Save
																							</Button>
																							<Button
																								size="sm"
																								variant="outline"
																								onClick={() => {
																									setIsEditingPhone(false);
																									setEditedPhone(user.phone || '');
																								}}
																							>
																								Cancel
																							</Button>
																						</div>
																					</div>
																				) : (
																					<div className="flex items-center justify-between">
																						<p className="text-gray-900 font-medium">
																							{formatPhoneNumber(user.phone || '')}
																						</p>
																						<Button
																							variant="ghost"
																							size="sm"
																							onClick={() => {
																								setEditedPhone(user.phone || '');
																								setIsEditingPhone(true);
																							}}
																						>
																							Edit
																						</Button>
																					</div>
																				)}
																			</div>
																		</CardContent>
																	</Card>

																	{/* Children */}
																	<Card>
																		<CardHeader className="pb-3">
																			<CardTitle className="text-lg flex items-center gap-2">
																				Children / Recipients ({expandedUserDetails.children.length})
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			{expandedUserDetails.children.length > 0 ? (
																				<div className="space-y-3">
																					{expandedUserDetails.children.map((child) => (
																						<div key={child.id} className="border rounded-lg p-3 bg-white">
																							<div className="flex items-center justify-between mb-2">
																								<span className="font-medium">{child.name}</span>
																								<Button
																									variant="ghost"
																									size="sm"
																									onClick={() => handleEditChild(child.id)}
																								>
																									Edit
																								</Button>
																							</div>
																							<div className="space-y-1 text-sm text-gray-600">
																								<div>School: {schools.find(s => s.id === child.schoolId)?.name || 'Unknown'}</div>
																								{!child.isTeacher && (
																									<>
																										<div>Year: {child.year} | Class: {child.className}</div>
																									</>
																								)}
																								<div>Role: {child.isTeacher ? 'Teacher' : 'Student'}</div>
																								{child.allergens && <div>Allergens: {child.allergens}</div>}
																							</div>
																						</div>
																					))}
																				</div>
																			) : (
																				<p className="text-gray-500 text-center py-4">No children registered</p>
																			)}
																		</CardContent>
																	</Card>

																	{/* Orders */}
																	<Card>
																		<CardHeader className="pb-3">
																			<CardTitle className="text-lg flex justify-between items-center gap-2">
																				Order History ({expandedUserDetails.orders?.length || 0})

                                                                                <Button variant="outline" size="sm" onClick={startAnAdminOrder}>
                                                                                    Manual Order
                                                                                </Button>
																			</CardTitle>
																		</CardHeader>
																		<CardContent>
																			{expandedUserDetails.orders?.length ? (
																				<div className="space-y-3">
																					{expandedUserDetails.orders.slice(0, 5).map((order: OrderHistory) => (
																						<div key={order.orderId} className="border rounded-lg p-3 bg-white">
																							<div className="flex justify-between items-start">
																								<div>
																									<div className="font-medium text-sm">#{order.orderId}</div>
																									<div className="text-gray-600 text-xs flex items-center gap-1 mt-1">
																										<Calendar className="h-3 w-3" />
																										{new Date(order.orderedOn).toLocaleDateString()}
																									</div>
																								</div>
																								<div className="text-right">
																									<div className="font-medium text-green-600 flex items-center gap-1">
																										<DollarSign className="h-3 w-3" />
																										{order.totalPaid}
																									</div>
																									<div className="text-gray-500 text-xs">{order.itemCount} items</div>
																								</div>
																							</div>
																						</div>
																					))}
																				</div>
																			) : (
																				<p className="text-gray-500 text-center py-4">No order history</p>
																			)}
																		</CardContent>
																	</Card>
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
						</Card>
					</div>

					{/* Mobile Card View */}
					<div className="lg:hidden space-y-4">
						{filteredUsers.map((user) => (
							<MobileUserCard key={user.id} user={user} />
						))}
					</div>
				</>
			)}

			{/* Load More Button */}
			{!searchTerm && selectedSchool === 'all' && hasMore && filteredUsers.length > 0 && (
				<div className="flex justify-center pt-8">
					<Button
						onClick={loadMore}
						disabled={isLoading}
						variant="outline"
						className="min-w-[120px]"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							'Load More Users'
						)}
					</Button>
				</div>
			)}

			{/* Child Management Dialog */}
			<ChildManagementDialog
				isOpen={isChildDialogOpen}
				onClose={() => setIsChildDialogOpen(false)}
				onSubmit={handleChildUpdate}
				onRemove={handleRemoveChild}
				editingChild={selectedChild}
			/>
		</div>
	);
};

export default UsersComponent;
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ChevronDown, ChevronUp, Loader2, User, Search, UserCog, Phone, Mail } from 'lucide-react';
import { fetchUserDetails, updateUserInFirebase } from '../services/user-service';
import { User as UserType, OrderHistorySummary, Child } from '../models/user.model';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { db } from '@/firebase';
import { query, collection, orderBy, startAfter, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import debounce from 'lodash/debounce';
import ChildManagementDialog from './ChildManagementDialog';
import ManualOrderDialog from './ManualOrderDialog';
import { Label } from './ui/label';

const PAGE_SIZE = 50;

const UsersComponent: React.FC = () => {
	const [users, setUsers] = useState<UserType[]>([]);
	const [lastVisible, setLastVisible] = useState<any>(null);
	const [hasMore, setHasMore] = useState(true);
	const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
	const [expandedUserDetails, setExpandedUserDetails] = useState<UserType | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
	const [selectedChild, setSelectedChild] = useState<Child | null>(null);
	const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
	const [isEditingPhone, setIsEditingPhone] = useState(false);
	const [editedPhone, setEditedPhone] = useState('');
	const [isManualOrderDialogOpen, setIsManualOrderDialogOpen] = useState(false);

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

	// Add this to format phone numbers for display
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
			let usersQuery = query(collection(db, 'users'), orderBy('displayName', 'asc'));

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
			setFilteredUsers((prevUsers) => (lastDoc ? [...prevUsers, ...newUsers] : newUsers));
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

	const filterUsers = (searchTerm: string) => {
		if (!searchTerm.trim()) {
			setFilteredUsers(users);
			return;
		}

		const lowerSearchTerm = searchTerm.toLowerCase();
		const filtered = users.filter((user) => {
			// Check user name
			const nameMatch = user.displayName.toLowerCase().includes(lowerSearchTerm);

			// Check email
			const emailMatch = user.email.toLowerCase().includes(lowerSearchTerm);

			// Check children names
			const childrenMatch = user.children.some((child) => child.name.toLowerCase().includes(lowerSearchTerm));

			return nameMatch || emailMatch || childrenMatch;
		});

		setFilteredUsers(filtered);
	};

	// Debounce the search to avoid too many re-renders
	const debouncedSearch = debounce((term: string) => {
		filterUsers(term);
	}, 300);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setSearchTerm(value);
		debouncedSearch(value);
	};

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

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

	const NoUsersDisplay = () => (
		<Card className="mt-8">
			<CardHeader>
				<CardTitle className="text-2xl font-bold text-center">No Users Found</CardTitle>
			</CardHeader>
			<CardContent className="text-center">
				<User className="mx-auto h-12 w-12 text-brand-taupe mb-4" />
				<p className="text-lg mb-4">
					{searchTerm ? 'No users match your search criteria.' : 'There are no users in the system yet.'}
				</p>
			</CardContent>
		</Card>
	);

	return (
		<div className="w-full space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold">Users</h2>
				<div className="relative max-w-sm w-full">
					<Input
						type="text"
						placeholder="Search by name or email..."
						value={searchTerm}
						onChange={handleSearch}
						className="pl-10"
					/>
					<Search className="absolute left-3 top-2.5 h-5 w-5 text-brand-taupe" />
				</div>
			</div>

			{filteredUsers.length === 0 ? (
				<NoUsersDisplay />
			) : (
				<div className="rounded-md border overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[200px]">Name</TableHead>
								<TableHead className="w-[200px]">Email</TableHead>
								<TableHead className="w-[150px]">Phone</TableHead>
								<TableHead className="w-[100px]">Total Orders</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.map((user) => (
								<React.Fragment key={user.id}>
									<TableRow
										className="cursor-pointer"
										onClick={() => handleUserClick(user.id)}
									>
										<TableCell className="flex justify-start items-center gap-2">
											{expandedUserId === user.id ? (
												isLoading ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<ChevronUp className="h-4 w-4" />
												)
											) : (
												<ChevronDown className="h-4 w-4" />
											)}
											{user.displayName}
										</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>{user.phone ? formatPhoneNumber(user.phone) : '-'}</TableCell>
										<TableCell>{user.orderHistory?.length}</TableCell>
									</TableRow>
									{expandedUserId === user.id && expandedUserDetails && (
										<TableRow>
											<TableCell colSpan={4}>
												<div className="p-4 bg-gray-50 space-y-4">
													<div className="bg-white p-4 rounded-lg shadow-sm">
														<div className="flex justify-between items-center mb-4">
														<div className="flex items-center gap-2 mb-4">
															<User className="h-5 w-5 text-gray-500" />
															<h3 className="font-semibold">Contact Information</h3>
														</div>
														</div>
														<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
															<div className="space-y-2">
																<div className="flex items-center gap-2">
																	<Mail className="h-4 w-4 text-gray-500" />
																	<Label className="text-sm text-gray-500">
																		Email
																	</Label>
																</div>
																<p className="text-gray-700">{user.email}</p>
															</div>

															<div className="space-y-2">
																<div className="flex items-center gap-2">
																	<Phone className="h-4 w-4 text-gray-500" />
																	<Label className="text-sm text-gray-500">
																		Phone Number
																	</Label>
																</div>
																{isEditingPhone ? (
																	<div className="flex items-center gap-2">
																		<Input
																			value={editedPhone}
																			onChange={(e) =>
																				setEditedPhone(e.target.value)
																			}
																			placeholder="Enter phone number"
																			className="max-w-[200px]"
																		/>
																		<Button
																			size="sm"
																			onClick={() =>
																				handlePhoneUpdate(user.id, editedPhone)
																			}
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
																) : (
																	<div className="flex items-center gap-2">
																		<p className="text-gray-700">
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
														</div>
													</div>

													<div className="flex justify-between items-center">
														<h3 className="font-semibold">Members</h3>
														<Button
															onClick={() => {
																setSelectedChild(null);
																setIsChildDialogOpen(true);
															}}
															size="sm"
														>
															Add Member
														</Button>
													</div>
													<div className='w-full bg-white p-4 rounded-lg shadow-sm'>

														<Table>
															<TableHeader>
																<TableRow>
																	<TableHead>Name</TableHead>
																	<TableHead>School</TableHead>
																	<TableHead>Year</TableHead>
																	<TableHead>Class</TableHead>
																	<TableHead>Allergens</TableHead>
																	<TableHead>Role</TableHead>
																	<TableHead>Actions</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{expandedUserDetails.children.map((child) => (
																	<TableRow key={child.id}>
																		<TableCell>{child.name}</TableCell>
																		<TableCell>{child.school}</TableCell>
																		<TableCell>
																			{child.isTeacher ? '-' : child.year}
																		</TableCell>
																		<TableCell>
																			{child.isTeacher ? '-' : child.className}
																		</TableCell>
																		<TableCell>{child.allergens || 'None'}</TableCell>
																		<TableCell>
																			{child.isTeacher ? 'Teacher' : 'Student'}
																		</TableCell>
																		<TableCell>
																			<Button
																				variant="ghost"
																				size="sm"
																				onClick={() => handleEditChild(child.id)}
																			>
																				<UserCog className="h-4 w-4" />
																			</Button>
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>

													</div>

													<div className="flex justify-between items-center">
														<h4 className="font-semibold mt-4">Order History</h4>
														<Button 
															size="sm" 
															onClick={() => setIsManualOrderDialogOpen(true)}
														>
															New Order
														</Button>
													</div>
													<div className='w-full bg-white p-4 rounded-lg shadow-sm'>
														{expandedUserDetails.orderHistory?.length > 0 ? (
															<Table>
																<TableHeader>
																	<TableRow>
																		<TableHead>Order ID</TableHead>
																		<TableHead>Date</TableHead>
																		<TableHead>Total</TableHead>
																		<TableHead>Items</TableHead>
																	</TableRow>
																</TableHeader>
																<TableBody>
																	{expandedUserDetails.orderHistory?.map(
																		(order: OrderHistorySummary) => (
																			<TableRow key={order.customOrderNumber}>
																				<TableCell>
																					{order.customOrderNumber}
																				</TableCell>
																				<TableCell>
																					{formatDate(order.createdAt)}
																				</TableCell>
																				<TableCell>
																					${order.total.toFixed(2)}
																				</TableCell>
																				<TableCell>{order.items}</TableCell>
																			</TableRow>
																		)
																	)}
																</TableBody>
															</Table>
														) : (
															<p>No order history</p>
														)}
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
			)}

			<ChildManagementDialog
				isOpen={isChildDialogOpen}
				onClose={() => setIsChildDialogOpen(false)}
				onSubmit={handleChildUpdate}
				onRemove={handleRemoveChild}
				editingChild={selectedChild}
			/>

			{expandedUserDetails && (
			<ManualOrderDialog
				isOpen={isManualOrderDialogOpen}
				onClose={() => setIsManualOrderDialogOpen(false)}
				user={expandedUserDetails}
			/>
			)}

			{!searchTerm && hasMore && (
				<div className="flex justify-center mt-4">
					<Button
						onClick={loadMore}
						disabled={isLoading}
						className="text-sm"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</>
						) : (
							'Load More'
						)}
					</Button>
				</div>
			)}
		</div>
	);
};

export default UsersComponent;

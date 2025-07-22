import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, User, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { User as UserType } from '@/models/user.model';
import { db } from '@/firebase';
import { query, collection, orderBy, limit, getDocs, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import ManualOrderDialog from '@/components/ManualOrderDialog';
import { useAppContext } from '@/context/AppContext';
import debounce from 'lodash/debounce';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Type for the manual order creation result
interface ManualOrderResult {
	success: boolean;
	orderId: string;
	totalAmount: number;
	itemCount: number;
	message: string;
}

// Type for the manual order creation request
interface ManualOrderRequest {
	userId: string;
	userEmail: string;
	cartData: any;
	createdBy: string;
}

const ManualOrdersPage: React.FC = () => {
	const { state } = useAppContext();
	const { schools } = state;

	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<UserType[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
	const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
	
	// Loading states
	const [isCreatingOrder, setIsCreatingOrder] = useState(false);
	const [lastCreatedOrder, setLastCreatedOrder] = useState<{
		orderId: string;
		userName: string;
		totalAmount: number;
	} | null>(null);

	// Debounced search function
	const debouncedSearch = useMemo(
		() =>
			debounce(async (term: string) => {
				if (!term.trim()) {
					setSearchResults([]);
					return;
				}

				setIsSearching(true);
				try {
					// Search by email first (exact match)
					let emailResults: UserType[] = [];
					if (term.includes('@')) {
						const emailQuery = query(
							collection(db, 'users-test2'),
							where('email', '==', term.toLowerCase()),
							limit(5)
						);
						const emailSnapshot = await getDocs(emailQuery);
						emailResults = emailSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserType);
					}

					// Search by display name (starts with)
					const nameQuery = query(
						collection(db, 'users-test2'),
						where('displayName', '>=', term),
						where('displayName', '<=', term + '\uf8ff'),
						orderBy('displayName'),
						limit(10)
					);
					const nameSnapshot = await getDocs(nameQuery);
					const nameResults = nameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as UserType);

					// Combine and deduplicate results
					const allResults = [...emailResults, ...nameResults];
					const uniqueResults = allResults.filter(
						(user, index, arr) => arr.findIndex((u) => u.id === user.id) === index
					);

					setSearchResults(uniqueResults.slice(0, 10)); // Limit to 10 results
				} catch (error) {
					console.error('Error searching users:', error);
					toast.error('Failed to search users');
				} finally {
					setIsSearching(false);
				}
			}, 500),
		[]
	);

	// Handle search input change
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		debouncedSearch(value);
	};

	// Get user initials for avatar
	const getInitials = (name: string): string => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	// Start manual order for selected user
	const startManualOrder = (user: UserType) => {
		setSelectedUser(user);
		setIsOrderDialogOpen(true);
		setSearchTerm('');
		setSearchResults([]);
		setLastCreatedOrder(null); // Clear any previous success state
	};

	// Handle manual order creation
	const handleManualOrderCreated = async (orderData: any) => {
		if (!selectedUser) return;

		setIsCreatingOrder(true);
		
		try {
			const functions = getFunctions();
			const createManualOrder = httpsCallable<ManualOrderRequest, ManualOrderResult>(functions, 'createManualOrder');

			const result = await createManualOrder({
				userId: selectedUser.id,
				userEmail: selectedUser.email,
				cartData: orderData,
				createdBy: state.user?.displayName || state.user?.email || 'Admin',
			});

			// Store the successful order details
			setLastCreatedOrder({
				orderId: result.data.orderId,
				userName: selectedUser.displayName,
				totalAmount: result.data.totalAmount,
			});

			toast.success(`Manual order created successfully! Order ID: ${result.data.orderId}`);

			setIsOrderDialogOpen(false);
			setSelectedUser(null);
		} catch (error) {
			console.error('Error creating manual order:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			toast.error(`Failed to create manual order: ${errorMessage}`);
		} finally {
			setIsCreatingOrder(false);
		}
	};

	// Load recent manual orders on component mount
	useEffect(() => {
		const loadRecentOrders = async () => {
			try {
				// You might want to create a separate collection for recent admin activities
				// or query the orders collection with specific filters
				// This is a placeholder - implement based on your data structure
			} catch (error) {
				console.error('Error loading recent orders:', error);
			}
		};

		loadRecentOrders();
	}, []);

	return (
		<div className="w-full space-y-6 p-4 sm:p-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-gray-900">Manual Orders Page</h1>
					<p className="text-gray-600 mt-1">Create and manage manual orders for customers</p>
				</div>

				{/* Admin Badge */}
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className="bg-blue-100 text-blue-800">
						Admin Access
					</Badge>
				</div>
			</div>

			{/* Success Banner */}
			{lastCreatedOrder && (
				<Card className="border-green-200 bg-green-50">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<CheckCircle className="h-8 w-8 text-green-600" />
							<div className="flex-1">
								<h3 className="font-semibold text-green-900">Order Created Successfully!</h3>
								<p className="text-sm text-green-700">
									Order <strong>{lastCreatedOrder.orderId}</strong> for <strong>{lastCreatedOrder.userName}</strong>
									{' '}totaling <strong>${lastCreatedOrder.totalAmount.toFixed(2)}</strong> has been created.
								</p>
							</div>
							<Button 
								variant="outline" 
								size="sm"
								onClick={() => setLastCreatedOrder(null)}
								className="border-green-300 text-green-700 hover:bg-green-100"
							>
								Dismiss
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Loading Overlay */}
			{isCreatingOrder && (
				<Card className="border-blue-200 bg-blue-50">
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
							<div className="flex-1">
								<h3 className="font-semibold text-blue-900">Creating Manual Order...</h3>
								<p className="text-sm text-blue-700">
									Please wait while we process the order for {selectedUser?.displayName}. This may take a few moments.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Find Customer
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Search by email address..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10"
                            disabled={isCreatingOrder}
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Search Results */}
                    {isSearching && (
                        <div className="text-center py-4">
                            <Loader2 className="inline-block animate-spin h-6 w-6 text-blue-600" />
                            <p className="text-sm text-gray-500 mt-2">Searching...</p>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Search Results</h4>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                                    {getInitials(user.displayName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h5 className="font-medium">{user.displayName}</h5>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Button
                                                onClick={() => startManualOrder(user)}
                                                disabled={isCreatingOrder}
                                                className="flex items-center gap-2">
                                                {isCreatingOrder ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                                Create Order
                                            </Button>
                                        </div>
                                    </div>

                                    {/* User's Children */}
                                    {user.children && user.children.length > 0 && (
                                        <div className="mt-3 pt-3 border-t">
                                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                Children/Recipients:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.children.map((child) => (
                                                    <Badge
                                                        key={child.id}
                                                        variant="outline"
                                                        className="text-xs">
                                                        {child.name} -{' '}
                                                        {schools.find((s) => s.id === child.schoolId)?.name ||
                                                            'Unknown School'}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {searchTerm.trim() && !isSearching && searchResults.length === 0 && (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                No users found matching "{searchTerm}". Try searching with a different name or
                                email address.
                            </p>
                        </div>
                    )}

                    {!searchTerm.trim() && (
                        <div className="text-center py-12">
                            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <Search className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for a Customer</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Enter a customer's name or email address to find their account and create a
                                manual order.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

			{/* Manual Order Dialog */}
			<ManualOrderDialog
				isOpen={isOrderDialogOpen}
				onClose={() => {
					if (!isCreatingOrder) {
						setIsOrderDialogOpen(false);
						setSelectedUser(null);
					}
				}}
				preselectedUser={selectedUser}
				onOrderCreated={handleManualOrderCreated}
				isCreatingOrder={isCreatingOrder}
			/>
		</div>
	);
};

export default ManualOrdersPage;
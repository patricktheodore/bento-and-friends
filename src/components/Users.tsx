import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ChevronDown, ChevronUp, Loader2, User, Search } from 'lucide-react';
import { fetchUserDetails } from '../services/user-service';
import { User as UserType, OrderHistorySummary } from '../models/user.model';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { db } from '@/firebase';
import { query, collection, orderBy, startAfter, getDocs, } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import debounce from 'lodash/debounce';

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

    const fetchUsers = async (lastDoc?: any) => {
        setIsLoading(true);
        try {
            let usersQuery = query(
                collection(db, 'users'),
                orderBy('displayName', 'asc')
            );

            if (lastDoc) {
                usersQuery = query(usersQuery, startAfter(lastDoc));
            }

            const querySnapshot = await getDocs(usersQuery);
            const newUsers = querySnapshot.docs.map(
                (doc) => ({
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
            const childrenMatch = user.children.some(child => 
                child.name.toLowerCase().includes(lowerSearchTerm)
            );

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
                                        <TableCell className='flex justify-start items-center gap-2'>
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
                                        <TableCell>{user.orderHistory.length}</TableCell>
                                    </TableRow>
                                    {expandedUserId === user.id && expandedUserDetails && (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <div className="p-4 bg-gray-50 space-y-4">
                                                    <h3 className="font-semibold">User Details</h3>
                                                    <p>Children: {expandedUserDetails.children.map(child => child.name).join(', ')}</p>
                                                    <h4 className="font-semibold mt-4">Order History</h4>
                                                    {expandedUserDetails.orderHistory.length > 0 ? (
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
                                                                {expandedUserDetails.orderHistory.map((order: OrderHistorySummary) => (
                                                                    <TableRow key={order.orderId}>
                                                                        <TableCell>{order.orderId}</TableCell>
                                                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                                                        <TableCell>${order.total.toFixed(2)}</TableCell>
                                                                        <TableCell>{order.items}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <p>No order history</p>
                                                    )}
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
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import MenuItemCard from '../components/MenuItemCard';
import OrderDialog from '../components/OrderDialog';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { School } from '@/models/school.model';
import { GraduationCap, Users, Loader2, ShoppingCart, Plus } from 'lucide-react';

const OrderPage: React.FC = () => {
    const {state, dispatch} = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMain, setSelectedMain] = useState<Main | null>(null);
    const [userSchools, setUserSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);

    useEffect(() => {
        setShowOrderDialog(isModalOpen && !!selectedSchool);
    }, [isModalOpen, selectedSchool]);

    useEffect(() => {
        const schools = getUserSchools();
        setUserSchools(schools);
        
        // Enhanced default school selection logic
        const defaultSchool = getDefaultSchool(schools);
        setSelectedSchool(defaultSchool);

        console.log('User schools:', schools);
        console.log('Selected school:', defaultSchool);
        
    }, [state.user, state.schools]); // Added state.schools as dependency

    const getUserSchools = (): School[] => {
        if (!state.user?.children || state.user.children.length === 0) {
            return [];
        }
        
        // Get unique school IDs from children
        const schoolIds = [...new Set(
            state.user.children
                .map(child => child.schoolId)
                .filter(Boolean) // Remove null/undefined values
        )];
        
        // Filter and sort schools
        return state.schools
            .filter(school => schoolIds.includes(school.id))
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    };

    const getDefaultSchool = (schools: School[]): School | null => {
        if (schools.length === 0) return null;

        // Strategy 1: Use previously selected school from localStorage
        const savedSchoolId = localStorage.getItem('lastSelectedSchool');
        if (savedSchoolId) {
            const savedSchool = schools.find(school => school.id === savedSchoolId);
            if (savedSchool) {
                return savedSchool;
            }
        }

        // Strategy 2: Use school with most children enrolled
        const schoolChildrenCount = schools.map(school => ({
            school,
            childrenCount: state.user?.children?.filter(child => child.schoolId === school.id).length || 0
        }));

        const schoolWithMostChildren = schoolChildrenCount
            .sort((a, b) => b.childrenCount - a.childrenCount)[0];

        if (schoolWithMostChildren.childrenCount > 0) {
            return schoolWithMostChildren.school;
        }

        // Strategy 3: Fallback to first school (alphabetically sorted)
        return schools[0];
    };

    // Get menu items for selected school
    const getSchoolMenuItems = (): Main[] => {
        if (!selectedSchool?.menuItems) return [];
        
        return state.mains.filter(main => 
            selectedSchool.menuItems.includes(main.id) && main.isActive
        );
    };

    const schoolMenuItems = getSchoolMenuItems();
    const sortedMains = schoolMenuItems.sort((a, b) => {
        // Featured items first, then alphabetical
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.display.localeCompare(b.display);
    });

    const handleOrderNow = (itemId: string) => {
        if (!selectedSchool) {
            toast.error('Please select a school first');
            return;
        }

        const main = state.mains.find(m => m.id === itemId);
        if (main) {
            setSelectedMain(main);
            setIsModalOpen(true);
        }
    };

    const handleSaveMeals = (meals: Meal | Meal[]) => {
        const mealsArray = Array.isArray(meals) ? meals : [meals];
        mealsArray.forEach(meal => {
            dispatch({ type: 'ADD_TO_CART', payload: meal });
        });
    };

    const handleSchoolChange = (schoolId: string) => {
        const school = userSchools.find(s => s.id === schoolId);
        if (!school) {
            toast.error('Selected school not found');
            return;
        }
        
        setSelectedSchool(school);
        
        // Save selection for next time
        localStorage.setItem('lastSelectedSchool', schoolId);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMain(null);
    };

    // Combined school display/select component
    const renderSchoolSelector = () => {
        if (userSchools.length === 0) {
            return null;
        }

        // If only one school, display it in a card
        if (userSchools.length === 1) {
            const school = userSchools[0];
            const childrenCount = state.user?.children?.filter(child => child.schoolId === school.id).length || 0;
            
            return (
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{school.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            {childrenCount} {childrenCount === 1 ? 'child' : 'children'} enrolled
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        // If multiple schools, render select dropdown in a card
        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Select School
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedSchool?.id || ''} 
                        onValueChange={handleSchoolChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a school to view menu items" />
                        </SelectTrigger>
                        <SelectContent>
                            {userSchools.map((school) => {
                                const childrenCount = state.user?.children?.filter(child => child.schoolId === school.id).length || 0;
                                return (
                                    <SelectItem key={school.id} value={school.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4" />
                                                <span>{school.name}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 ml-2">
                                                {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                                            </span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>
        );
    };

    // Show message if no children
    if (!state.user?.children || state.user.children.length === 0) {
        return (
            <div className="w-full space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Order</h1>
                    <p className="text-gray-600 mt-1">Browse and order meals</p>
                </div>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Setup Required</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Add Children to Your Account</h3>
                        <p className="text-gray-500 mb-6">
                            You need to add children to your account before you can place orders.
                        </p>
                        <Button 
                            onClick={() => window.location.href = '/account'} 
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Go to Account Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show loading state if schools haven't loaded yet
    if (state.isLoading || userSchools.length === 0) {
        return (
            <div className="w-full space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Order</h1>
                    <p className="text-gray-600 mt-1">Browse and order meals for your children</p>
                </div>

                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
                    <p className="text-lg text-gray-600">Loading schools and menu items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 p-4 sm:p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Order</h1>
                <p className="text-gray-600 mt-1">Browse and order meals for your children</p>
            </div>

            {renderSchoolSelector()}

            {/* Menu Items */}
            {selectedSchool ? (
                <>
                    {sortedMains.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Available Menu Items</h2>
                                    <p className="text-gray-600 mt-1">
                                        {sortedMains.length} item{sortedMains.length !== 1 ? 's' : ''} available at {selectedSchool.name}
                                    </p>
                                </div>
                                {sortedMains.some(item => item.isFeatured) && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Featured items available
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sortedMains.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={item}
                                        onOrderNow={() => handleOrderNow(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Items Available</h3>
                                <p className="text-gray-500 mb-6">
                                    No menu items are currently available for {selectedSchool.name}. Please check back later or contact the school.
                                </p>
                                <div className="text-sm text-gray-400">
                                    Menu items may be temporarily unavailable or under maintenance.
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a School</h3>
                        <p className="text-gray-500">
                            Please select a school above to view available menu items for ordering.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Only render OrderDialog when we have a selected school and modal is open */}
            {showOrderDialog && selectedSchool && (
                <OrderDialog
                    key={`${selectedSchool.id}-${isModalOpen}`}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    selectedMain={selectedMain}
                    selectedSchool={selectedSchool}
                    onSave={handleSaveMeals}
                />
            )}
        </div>
    );
};

export default OrderPage;
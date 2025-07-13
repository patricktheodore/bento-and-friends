import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import MenuItemCard from '../components/MenuItemCard';
import OrderDialog from '../components/OrderDialog';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { School } from '@/models/school.model';
import { GraduationCap } from 'lucide-react';

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

        // If only one school, just display it
        if (userSchools.length === 1) {
            const school = userSchools[0];
            const childrenCount = state.user?.children?.filter(child => child.schoolId === school.id).length || 0;
            
            return (
                <div className="flex items-center gap-2 text-xl text-gray-700 mt-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>{school.name}</span>
                    <span className="text-gray-500 text-base">
                        ({childrenCount} {childrenCount === 1 ? 'child' : 'children'})
                    </span>
                </div>
            );
        }

        // If multiple schools, render select dropdown with enhanced styling
        return (
            <div className="mt-2">
                <div className="max-w-md">
                    <Select
                        value={selectedSchool?.id || ''} 
                        onValueChange={handleSchoolChange}
                    >
                        <SelectTrigger className="text-xl text-brand-taupe font-semibold mt-2 w-fit border-2 border-brand-taupe min-w-[200px] shadow-sm p-2 h-auto focus:ring-0 bg-white">
                            <div className="flex items-center gap-2 pr-2">
                                <SelectValue placeholder="Choose a school" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {userSchools.map((school) => (
                                <SelectItem key={school.id} value={school.id}>
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4" />
                                        <span>{school.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    };

    // Show message if no children
    if (!state.user?.children || state.user.children.length === 0) {
        return (
            <div className="container mx-auto p-4 py-8">
                <h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">Order</h1>
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">
                        You need to add children to your account before you can place orders.
                    </p>
                    <a href="/account" className="text-brand-dark-green hover:underline">
                        Go to Account Settings
                    </a>
                </div>
            </div>
        );
    }

    // Show loading state if schools haven't loaded yet
    if (state.isLoading || userSchools.length === 0) {
        return (
            <div className="container mx-auto p-4 py-8">
                <h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">Order</h1>
                <div className="mt-8 text-center">
                    <p className="text-gray-600">Loading schools...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 py-8">
            <div className="mb-6">
                <h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">Order</h1>
                {renderSchoolSelector()}
            </div>

            {/* Menu Items */}
            {selectedSchool ? (
                <>
                    {sortedMains.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {sortedMains.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    onOrderNow={() => handleOrderNow(item.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                No menu items available for this school at the moment.
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div className="mt-8 text-center">
                    <p className="text-gray-600">
                        Please select a school to view available menu items.
                    </p>
                </div>
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
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Main } from '@/models/item.model';
import { Meal } from '@/models/order.model';
import { School } from '@/models/school.model';
import OrderDialog from '@/components/OrderDialog';
import toast from 'react-hot-toast';
import { GraduationCap, ShoppingCart, Sparkles, Leaf, AlertCircle } from 'lucide-react';

const MenuPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
    const navigate = useNavigate();
    const [selectedMain, setSelectedMain] = useState<Main | null>(null);
    const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
    const [userSchools, setUserSchools] = useState<School[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [showOrderDialog, setShowOrderDialog] = useState(false);

    useEffect(() => {
        setShowOrderDialog(isOrderDialogOpen && !!selectedSchool);
    }, [isOrderDialogOpen, selectedSchool]);

    useEffect(() => {
        if (state.user) {
            const schools = getUserSchools();
            setUserSchools(schools);
            
            // Enhanced default school selection logic
            const defaultSchool = getDefaultSchool(schools);
            setSelectedSchool(defaultSchool);

            console.log('User schools:', schools);
            console.log('Selected school:', defaultSchool);
        } else {
            // Reset school selection for guests
            setUserSchools([]);
            setSelectedSchool(null);
        }
        
    }, [state.user, state.schools]);

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
        const savedSchoolId = localStorage.getItem('lastSelectedSchoolMenu');
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

    // Get menu items for selected school or all items for guests
    const getFilteredMainItems = (): Main[] => {
        if (!state.user) {
            // Show all active items for guests
            return state.mains.filter(main => main.isActive);
        }

        if (!selectedSchool?.menuItems) {
            return [];
        }
        
        return state.mains.filter(main => 
            selectedSchool.menuItems.includes(main.id) && main.isActive
        );
    };

    const getFilteredItems = (items: any[]) => {
        if (!state.user) {
            // Show all active items for guests
            return items.filter(item => item.isActive);
        }

        if (!selectedSchool?.menuItems) {
            return [];
        }
        
        // For non-main items, show all active items if user is logged in
        // (assuming add-ons, sides, fruits are not school-specific)
        return items.filter(item => item.isActive);
    };

    const filteredMainItems = getFilteredMainItems();
	const sortedMains = filteredMainItems.sort((a, b) => {
        // Featured items first, then alphabetical
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return a.display.localeCompare(b.display);
    });

    const handleSchoolChange = (schoolId: string) => {
        const school = userSchools.find(s => s.id === schoolId);
        if (!school) {
            toast.error('Selected school not found');
            return;
        }
        
        setSelectedSchool(school);
        
        // Save selection for next time (separate from order page)
        localStorage.setItem('lastSelectedSchoolMenu', schoolId);
    };

    // Combined school display/select component
    const renderSchoolSelector = () => {
        if (!state.user || userSchools.length === 0) {
            return null;
        }

        // If only one school, just display it
        if (userSchools.length === 1) {
            return (
                <div className="flex items-center gap-2 text-xl text-brand-taupe mt-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>{userSchools[0].name}</span>
                </div>
            );
        }

        // If multiple schools, render select dropdown
        return (
            <div className="w-fit mt-2">
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
        );
    };

	const renderAddOns = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{getFilteredItems(state.addOns).map((addon) => (
				<Card key={addon.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{addon.display}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-brand-dark-green">${addon.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const renderSides = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{getFilteredItems(state.sides).map((side) => (
				<Card key={side.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader>
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{side.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const renderFruits = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{getFilteredItems(state.fruits).map((fruit) => (
				<Card key={fruit.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader>
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{fruit.display}</CardTitle>
					</CardHeader>
				</Card>
			))}
		</div>
	);

	const renderDrinks = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{getFilteredItems(state.drinks).map((drink) => (
				<Card key={drink.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
					<CardHeader className="pb-3">
						<CardTitle className="text-lg group-hover:text-brand-dark-green transition-colors">{drink.display}</CardTitle>
					</CardHeader>
					<CardContent>
						{drink.image && (
							<img
								src={drink.image}
								alt={drink.display}
								className="w-full h-40 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300"
							/>
						)}
						<p className="text-2xl font-bold text-brand-dark-green">${drink.price.toFixed(2)}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);

	const handleOrderNow = (item: Main) => {
        if (!state.user) {
            navigate('/signin');
            return;
        }

        if (!selectedSchool) {
            toast.error('Please select a school first');
            return;
        }

        setSelectedMain(item);
        setIsOrderDialogOpen(true);
    };

    const handleAddToCart = (meals: Meal | Meal[]) => {
        const mealsArray = Array.isArray(meals) ? meals : [meals];
        mealsArray.forEach(meal => {
            dispatch({ type: 'ADD_TO_CART', payload: meal });
        });
        setIsOrderDialogOpen(false);
    };

    const handleCloseModal = () => {
        setIsOrderDialogOpen(false);
        setSelectedMain(null);
    };

    const renderMainItems = () => {
        // Show loading state for logged in users
        if (state.user && (state.isLoading || (userSchools.length === 0 && state.user.children?.length > 0))) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-green mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading menu items...</p>
                    </div>
                </div>
            );
        }

        // Show message if user has no children
        if (state.user && (!state.user.children || state.user.children.length === 0)) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Card className="max-w-md text-center p-8 bg-brand-cream/10 border-brand-dark-green/20">
                        <AlertCircle className="h-12 w-12 text-brand-dark-green mx-auto mb-4" />
                        <p className="text-gray-700 mb-6 text-lg">
                            You need to add children to your account to see school-specific menu items.
                        </p>
                        <Button 
                            onClick={() => navigate('/account')}
                            className="bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90"
                        >
                            Go to Account Settings
                        </Button>
                    </Card>
                </div>
            );
        }

        // Show message if user is logged in but no school selected
        if (state.user && !selectedSchool && userSchools.length > 0) {
            return (
                <div className="text-center py-20">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                        Please select a school to view available menu items.
                    </p>
                </div>
            );
        }

        // Show no items message
        if (sortedMains.length === 0) {
            const message = state.user 
                ? "No menu items available for this school at the moment."
                : "No menu items available at the moment.";
            
            return (
                <div className="text-center py-20">
                    <p className="text-gray-600 text-lg">{message}</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedMains.map((item) => (
                    <Card key={item.id} className="group overflow-hidden transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20">
                        <div className="relative overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.display}
                                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {item.isFeatured && (
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-brand-dark-green text-brand-cream border-0 px-3 py-1.5 flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Featured
                                    </Badge>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <p className='text-3xl font-bold text-white'>${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl group-hover:text-brand-dark-green transition-colors">
                                {item.display}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-brand-taupe">
                                {item.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {item.isNew && (
                                    <Badge variant="secondary" className="bg-brand-cream/20 text-brand-dark-green border-brand-dark-green/20">
                                        New
                                    </Badge>
                                )}
                                {item.isVegetarian && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                        <Leaf className="h-3 w-3" />
                                        Vegetarian
                                    </Badge>
                                )}
                                {item.allergens?.map((allergen) => (
                                    <Badge
                                        key={allergen}
                                        variant="outline"
                                        className="uppercase text-xs"
                                    >
                                        {allergen}
                                    </Badge>
                                ))}
                            </div>
                            {state.user ? (
                                <Button
                                    className="w-full bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 h-12 text-base font-semibold group-hover:shadow-lg transition-all"
                                    onClick={() => handleOrderNow(item)}
                                >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Order Now
                                </Button>
                            ) : (
                                <div className="space-y-2">
                                    <Button 
                                        onClick={() => navigate('/signin')} 
                                        variant="outline"
                                        className="w-full h-11 border-brand-dark-green/20 hover:bg-brand-cream/10"
                                    >
                                        Create Account
                                    </Button>
                                    <Button 
                                        onClick={() => navigate('/signin')}
                                        className="w-full h-11 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90"
                                    >
                                        Login to Order
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-brand-cream/5">
			<div className="container mx-auto px-4 py-12">
				<Tabs defaultValue="mains" className="space-y-8">
					{/* Header Section with Title, School Selector, and Tabs */}
					<div className="space-y-8">
						{/* Top Row: Title and School Selector Combined */}
						<div className="flex-1">
							<h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">
								Menu
							</h1>
							{renderSchoolSelector()}
						</div>

						{/* Bottom Row: Tabs */}
						<div className="flex justify-center lg:justify-start">
							<ScrollArea className="w-fit max-w-3xl">
								<TabsList className="inline-flex items-center justify-start rounded-lg bg-brand-taupe p-1 text-brand-cream w-full backdrop-blur-sm">
									<TabsTrigger 
										value="mains" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Main Dishes
									</TabsTrigger>
									<TabsTrigger 
										value="addons" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Add-ons
									</TabsTrigger>
									<TabsTrigger 
										value="sides" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Sides
									</TabsTrigger>
									<TabsTrigger 
										value="fruits" 
										className="whitespace-nowrap flex-1 sm:flex-initial data-[state=active]:bg-brand-dark-green data-[state=active]:text-brand-cream rounded-lg px-6 transition-all"
									>
										Fruits
									</TabsTrigger>
								</TabsList>
							</ScrollArea>
						</div>
					</div>

					<TabsContent value="mains" className="mt-8">{renderMainItems()}</TabsContent>
					<TabsContent value="addons" className="mt-8">{renderAddOns()}</TabsContent>
					<TabsContent value="sides" className="mt-8">{renderSides()}</TabsContent>
					<TabsContent value="fruits" className="mt-8">{renderFruits()}</TabsContent>
					<TabsContent value="drinks" className="mt-8">{renderDrinks()}</TabsContent>

					<div className="flex justify-center w-full mt-16 mb-8">
						{state.user ? (
							<div className="text-center">
								<Link
									to="/order"
									className="inline-flex items-center gap-3 bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 font-bold py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-lg"
								>
									Start an Order Now
									<span className="text-2xl">→</span>
								</Link>
							</div>
						) : (
							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									onClick={() => navigate('/signin')}
									variant="outline"
									size="lg"
									className="border-brand-dark-green text-brand-dark-green hover:bg-brand-cream/20 px-8"
								>
									Create an Account
								</Button>
								<Button
									onClick={() => navigate('/signin')}
									size="lg"
									className="bg-brand-dark-green text-brand-cream hover:bg-brand-dark-green/90 px-8"
								>
									Login to Order
								</Button>
							</div>
						)}
					</div>
				</Tabs>
				
				{/* Only render OrderDialog when we have a selected school and modal is open */}
				{showOrderDialog && selectedSchool && (
					<OrderDialog
						key={`${selectedSchool.id}-${isOrderDialogOpen}`}
						isOpen={isOrderDialogOpen}
						onClose={handleCloseModal}
						selectedMain={selectedMain}
						selectedSchool={selectedSchool}
						onSave={handleAddToCart}
					/>
				)}
			</div>
		</div>
	);
};

export default MenuPage;
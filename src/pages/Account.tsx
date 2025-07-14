import React from 'react';
import { useAppContext } from '../context/AppContext';
import ChildrenManagement from '../components/ChildrenManagement';
import { Child } from '../models/user.model';
import { updateUserInFirebase } from '../services/user-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OrderHistory from '@/components/OrderHistory';
import AccountSummary from '@/components/AccountSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealCalendar from '@/components/MealCalendar';
import AccountDetails from '@/components/AccountDetails';
import toast from 'react-hot-toast';

const AccountPage: React.FC = () => {
	const { state, refreshUserData, dispatch } = useAppContext();

    // refreesh user data when the component mounts
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                await refreshUserData();
            } catch (error) {
                console.error('Error refreshing user data:', error);
                toast.error('Failed to load account data');
            }
        };

        fetchData();
    }, []);

	const handleAddChild = async (childData: Omit<Child, 'id'>) => {
        if (!state.user) return;
        
        try {
            const newChild = new Child(
                childData.name,
                childData.year,
                childData.isTeacher,
                childData.schoolId, // Use schoolId instead of school
                childData.className,
                childData.allergens
            );
            
            const updatedUser = {
                ...state.user,
                children: [...state.user.children, newChild],
            };
            
            // Update local state first
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            
            // Then update Firebase
            await updateUserInFirebase(updatedUser);
        } catch (error) {
            console.error('Error adding child:', error);
            toast.error('Failed to add member');
            throw error; // Re-throw so component can handle it
        }
    };

    const handleRemoveChild = async (childId: string) => {
        if (!state.user) return;
        
        try {
            const updatedChildren = state.user.children.filter((child) => child.id !== childId);
            const updatedUser = {
                ...state.user,
                children: updatedChildren,
            };
            
            // Update local state first
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            
            // Then update Firebase
            await updateUserInFirebase(updatedUser);
        } catch (error) {
            console.error('Error removing child:', error);
            toast.error('Failed to remove member');
            throw error; // Re-throw so component can handle it
        }
    };

    const handleEditChild = async (childId: string, updatedChildData: Omit<Child, 'id'>) => {
        if (!state.user) return;
        
        try {
            const updatedChildren = state.user.children.map((child) =>
                child.id === childId
                    ? {
                          ...child,
                          ...updatedChildData,
                      }
                    : child
            );
            
            const updatedUser = {
                ...state.user,
                children: updatedChildren,
            };
            
            // Update local state first
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            
            // Then update Firebase
            await updateUserInFirebase(updatedUser);
        } catch (error) {
            console.error('Error editing child:', error);
            toast.error('Failed to update member');
            throw error; // Re-throw so component can handle it
        }
    };

	const NoChildrenMessage = () => (
		<Alert className="mb-4 bg-green-50">
			<AlertTitle className="text-lg">Welcome to Your Account!</AlertTitle>
			<AlertDescription>
				Adding your children's details makes the ordering process easier and faster. We recommend setting this
				up now to streamline your future orders.
			</AlertDescription>
		</Alert>
	);

	const StartOrderMessage = () => (
		<Alert className="mt-4 bg-green-50">
			<AlertTitle className="text-lg">You're ready to start an order!</AlertTitle>
			<AlertDescription>
				Navigate to the <a className="underline" href="/order">Order</a> screen to start the ordering process.
			</AlertDescription>
		</Alert>
	);

	return (
		<div className="container mx-auto p-4 py-8">
			{state.isLoading ? (
				<div className="w-full flex flex-col justify-center items-center p-4">
					<h1 className="text-2xl font-semibold mb-4">Loading...</h1>
				</div>
			) : state.user ? (
				<Tabs defaultValue="profile">
					<div className="w-full flex justify-between items-center">
						<h1 className="text-4xl font-bold">My Account</h1>
						<TabsList>
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="order-history">Order History</TabsTrigger>
							<TabsTrigger value="meal-calendar">Meal Calendar</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="profile">
						<div className="w-full bg-white rounded-lg border border-stone-200 p-4 mt-4">
							<div className="space-y-6">
								<AccountDetails user={state.user} />
								{state.user.children.length === 0 && <NoChildrenMessage />}
								<ChildrenManagement
									user={state.user}
									onAddChild={handleAddChild}
									onRemoveChild={handleRemoveChild}
									onEditChild={handleEditChild}
								/>
								{state.user.children.length > 0 && <StartOrderMessage />}
								<AccountSummary user={state.user} />
							</div>
						</div>
					</TabsContent>

					<TabsContent value="order-history">
						<div className="w-full bg-white rounded-lg border border-stone-200 p-4 mt-4">
							<OrderHistory />
						</div>
					</TabsContent>

					<TabsContent value="meal-calendar">
						<div className="w-full bg-white rounded-lg border border-stone-200 p-4 mt-4">
							<MealCalendar />
						</div>
					</TabsContent>
				</Tabs>
			) : (
				<div className="w-full flex flex-col justify-center items-center p-4">
					<h1 className="text-2xl font-semibold mb-4">You are not signed in.</h1>
				</div>
			)}
		</div>
	);
};

export default AccountPage;
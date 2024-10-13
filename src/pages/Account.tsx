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

const AccountPage: React.FC = () => {
	const { state, dispatch } = useAppContext();

	const handleAddChild = (childData: Omit<Child, 'id'>) => {
        if (state.user) {
            const newChild = new Child(
                childData.name,
                childData.year,
				childData.isTeacher,
                childData.school,
                childData.className,
                childData.allergens
            );
            const updatedUser = {
                ...state.user,
                children: [...state.user.children, newChild],
            };
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            updateUserInFirebase(updatedUser);
        }
    };

    const handleRemoveChild = (childId: string) => {
        if (state.user) {
            const updatedChildren = state.user.children.filter((child) => child.id !== childId);
            const updatedUser = {
                ...state.user,
                children: updatedChildren,
            };
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            updateUserInFirebase(updatedUser);
        }
    };

    const handleEditChild = (childId: string, updatedChildData: Omit<Child, 'id'>) => {
        if (state.user) {
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
            dispatch({ type: 'UPDATE_USER', payload: updatedUser });
            updateUserInFirebase(updatedUser);
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
			{state.user ? (
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
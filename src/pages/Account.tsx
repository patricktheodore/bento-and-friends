import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ChildrenManagement from '../components/ChildrenManagement';
import { Child } from '../models/user.model';
import { updateUserInFirebase } from '../services/user-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const tabs = [
	{ name: 'Profile', component: ChildrenManagement },
	{ name: 'Order History', component: null },
];

const AccountPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [activeTab, setActiveTab] = useState<number>(0);

	const handleTabClick = (index: number) => {
		setActiveTab(index);
	};

	const handleAddChild = (childData: Omit<Child, 'id'>) => {
		if (state.user) {
			const newChild = new Child(childData.name, childData.year, childData.school, childData.className);
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
				child.id === childId ? { ...child, ...updatedChildData } : child
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
			<AlertTitle className='text-lg'>Welcome to Your Account!</AlertTitle>
			<AlertDescription>
				Adding your children's details makes the ordering process easier and faster. We recommend setting this
				up now to streamline your future orders.
			</AlertDescription>
		</Alert>
	);

	const StartOrderMessage = () => (
		<Alert className="mt-4 bg-green-50">
			<AlertTitle className='text-lg'>You're ready to start an order!</AlertTitle>
			<AlertDescription>
				Navigate to the <a className='underline' href='/order'>Order</a> screen to start the ordering process.
			</AlertDescription>
		</Alert>
	);

	return (
		<div className="min-h-[75vh] w-full mx-auto p-4 pb-8 flex flex-col justify-start items-center gap-2">
			{state.user ? (
				<>
					<div className="w-full flex justify-between items-center gap-4">
						<div className="flex justify-start items-center gap-2 rounded-md p-1 bg-stone-200">
							{tabs.map((tab, index) => (
								<div
									key={index}
									onClick={() => handleTabClick(index)}
									className={`text-sm rounded-md py-1 px-2 hover:cursor-pointer ${
										activeTab === index ? 'bg-white font-bold' : 'bg-stone-200'
									}`}
								>
									{tab.name}
								</div>
							))}
						</div>
					</div>

					<div className="w-full bg-white rounded-lg border border-stone-200 p-4">
						{activeTab === 0 && (
							<>
								{state.user.children.length === 0 && <NoChildrenMessage />}
								<ChildrenManagement
									user={state.user}
									onAddChild={handleAddChild}
									onRemoveChild={handleRemoveChild}
									onEditChild={handleEditChild}
								/>
								{state.user.children.length > 0 && <StartOrderMessage />}
							</>
						)}
					{activeTab === 1 && <div>Order History component not implemented yet</div>}
					</div>
				</>
			) : (
				<div className="w-full flex flex-col justify-center items-center p-4">
					<h1 className="text-2xl font-semibold mb-4">You are not signed in.</h1>
				</div>
			)}
		</div>
	);
};

export default AccountPage;

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Profile from '../components/UserProfile';
import ChildrenManagement from '../components/ChildrenManagement';
import { Child } from '../models/user.model';
import { updateUserInFirebase } from '../services/user-service';

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
							<ChildrenManagement
								user={state.user}
								onAddChild={handleAddChild}
								onRemoveChild={handleRemoveChild}
								onEditChild={handleEditChild}
							/>
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

import React, { useState } from 'react';
import Schools from '../components/Schools';
import ItemController from '../components/ItemController';
import CouponController from '@/components/CouponController';

const tabs = [
	{ name: 'Orders', component: null }, // TODO: Create Orders component
	{ name: 'Menu Items', component: ItemController },
	{ name: 'Schools', component: Schools },
	{ name: 'Coupons', component: CouponController }, // TODO: Create Coupons component
];

const AdminDashboardPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<number>(0);

	const handleTabClick = (index: number) => {
		setActiveTab(index);
	};

	const ActiveComponent = tabs[activeTab].component;

	return (
		<div className="w-full mx-auto p-4 pb-8 md:p-8 lg:p-12 flex flex-col justify-start items-center gap-2">
			<div className="w-full flex flex-col justify-start items-center md:flex-row md:justify-between gap-4 px-4">
				<h1 className="text-4xl font-bold">Admin Dashboard</h1>
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
				{ActiveComponent ? <ActiveComponent /> : <div>Component not implemented yet</div>}
			</div>
		</div>
	);
};

export default AdminDashboardPage;

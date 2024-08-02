import React, { useState } from 'react';
import MenuItem, { MenuItemProps } from '../components/MenuItem';

const MenuPage: React.FC = () => {
	const [newItem, setNewItem] = useState<Omit<MenuItemProps, 'id'>>({
		name: '',
		ingredients: [],
		calories: 0,
		allergens: [],
		image: '',
		isNew: true,
		isEnabled: true,
		isFeatured: false,
	});

	const menuItems: MenuItemProps[] = [
		{
			id: '1',
			name: 'Yogurt Parfait',
			ingredients: ['yogurt', 'granola', 'berries'],
			calories: 320,
			allergens: ['dairy', 'gluten'],
			image: 'https://plus.unsplash.com/premium_photo-1713719216015-00a348bc4526?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: true,
			isEnabled: true,
		},
		{
			id: '2',
			name: 'Fruit Salad',
			ingredients: ['strawberries', 'blueberries', 'kiwi', 'banana'],
			calories: 210,
			allergens: [],
			image: 'https://images.unsplash.com/photo-1658431618511-adeba775bd66?q=80&w=2888&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: false,
			isEnabled: true,
		},
		{
			id: '3',
			name: 'Egg & Cheese Sandwich',
			ingredients: ['egg', 'cheese', 'english muffin'],
			calories: 350,
			allergens: ['dairy', 'gluten'],
			image: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?q=80&w=2824&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: false,
			isEnabled: true,
		},
		{
			id: '4',
			name: 'Acai Bowl',
			ingredients: ['acai', 'granola', 'berries', 'banana'],
			calories: 400,
			allergens: [],
			image: 'https://images.unsplash.com/photo-1684403620650-81dc661a69db?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: false,
			isEnabled: true,
		},
		{
			id: '5',
			name: 'Blueberry Muffin',
			ingredients: ['blueberries', 'flour', 'sugar'],
			calories: 250,
			allergens: ['gluten'],
			image: 'https://images.unsplash.com/photo-1632498762310-50e4473bce92?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: false,
			isEnabled: true,
		},
		{
			id: '7',
			name: 'Sushi',
			ingredients: ['rice', 'fish', 'seaweed'],
			calories: 300,
			allergens: ['fish'],
			image: 'https://plus.unsplash.com/premium_photo-1664648184107-0e49c1d43668?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
			isNew: false,
			isEnabled: false,
		},
	];

	return (
		<>
			<div className="w-full max-w-screen-xl mx-auto p-4 pb-8 flex flex-col justify-start items-center gap-4">
				<div className="w-full flex flex-col justify-start items-center">
					<h2 className="w-full text-left text-2xl font-bold text-brand-dark-green mb-4">Menu</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{menuItems.map(
							(item) =>
								item.isEnabled && (
									<MenuItem
										key={item.id}
										{...item}
									/>
								)
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default MenuPage;

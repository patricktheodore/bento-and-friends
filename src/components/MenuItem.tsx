import React from 'react';

export interface MenuItemProps {
	id: string;
	name: string;
	ingredients: string[];
	calories: number;
	allergens: string[];
	image?: string;
	isNew?: boolean;
    isEnabled?: boolean;
    isFeatured?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ name, ingredients, calories, allergens, image, isNew }) => {
	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
			{image && (
				<div className="h-36 overflow-hidden">
					<img
						src={image}
						alt={name}
						className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
					/>
				</div>
			)}
			<div className="p-4">
				<div className="flex justify-between items-center mb-2">
					<h3 className="text-lg font-medium text-gray-900">{name}</h3>
					{isNew && (
						<span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">New</span>
					)}
				</div>
				<p className="text-sm text-gray-600 mb-2">{ingredients.join(', ')}</p>
				<div className="flex justify-between items-center mb-2">
					<span className="text-sm font-medium text-gray-600">{calories} cal</span>
				</div>
				{allergens.length > 0 && <div className="text-xs text-gray-500">Allergens: {allergens.join(', ')}</div>}
			</div>
		</div>
	);
};

export default MenuItem;

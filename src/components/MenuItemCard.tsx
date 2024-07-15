import React from 'react';

export interface MenuItemProps {
  image: string;
  title: string;
  description: string;
  price: number;
}

const MenuItemCard: React.FC<MenuItemProps> = ({ image, title, description, price }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
      <div className="overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-brand-dark-green m-0">{title}</h3>
        </div>
        <span className='text-xs leading-3 font-light tracking-widest'>
          CALORIES: {price} kcal
        </span>
        <p className="text-brand-taupe text-sm mb-4">{description}</p>
        <button className="w-full bg-brand-cream text-brand-dark-green py-2 rounded-md ring-2 ring-transparent hover:ring-brand-dark-green transition-all duration-300 ease-in-out">
          Order now
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
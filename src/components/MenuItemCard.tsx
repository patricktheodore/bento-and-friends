import React from 'react';

interface MenuItemProps {
  image: string;
  title: string;
  description: string;
  price: number;
}

const MenuItemCard: React.FC<MenuItemProps> = ({ image, title, description, price }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
      <img 
        src={image} 
        alt={title} 
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-brand-dark-green">{title}</h3>
          <span className="text-brand-gold font-bold">${price.toFixed(2)}</span>
        </div>
        <p className="text-brand-taupe text-sm mb-4">{description}</p>
        <button className="w-full bg-brand-cream text-brand-dark-green py-2 rounded-md hover:bg-brand-gold transition-colors duration-300 ease-in-out">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
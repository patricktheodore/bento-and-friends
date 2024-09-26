import React from 'react';
import { Link } from 'react-router-dom';
import { Apple, ShieldCheck, Leaf } from 'lucide-react';

const NutritionComponent: React.FC = () => {
  const nutritionPoints = [
    {
      icon: <Apple size={24} />,
      title: 'Balanced Nutrition',
      description: 'Low in sodium and sugar, high in essential nutrients',
    },
    {
      icon: <ShieldCheck size={24} />,
      title: 'Allergen-Safe',
      description: 'Nut-free meals with clear allergen information',
    },
    {
      icon: <Leaf size={24} />,
      title: 'Expert Oversight',
      description: 'Designed by qualified nutritionists and chefs',
    },
  ];

  return (
    <div className='w-full bg-brand-dark-green text-white py-16 px-4 md:px-8'>
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
        <h2 className="text-4xl">Nutrition First</h2>

        <div className="flex flex-col md:flex-row gap-12">
          <div className="md:w-1/2">
            <p className="text-lg text-white text-opacity-90 mb-6">
              At Bento & Friends, we believe that proper nutrition is crucial for growing minds and bodies. Our meals are carefully crafted to provide optimal nourishment while catering to various dietary needs and preferences.
            </p>
            <p className="text-lg text-white text-opacity-90 mb-6">
              Every bento box is a balanced meal, designed to fuel your child's day with the right mix of proteins, carbohydrates, and essential nutrients. We prioritize food safety, health hygiene, and allergen awareness in all our preparations.
            </p>
            <Link
              to="/menu"
			  className="inline-block bg-brand-cream text-brand-dark-green hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-cream ring-offset-2 ring-offset-brand-dark-green"
			  >
              Explore Our Menu &rarr;
            </Link>
          </div>

          <div className="md:w-1/2 bg-white bg-opacity-10 rounded-lg p-6">
            <h3 className="text-2xl font-semibold mb-4">Our Nutrition Promise</h3>
            {nutritionPoints.map((point, index) => (
              <div key={index} className="flex items-start mb-4 last:mb-0">
                <div className="mr-4 mt-1 text-brand-cream">{point.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold mb-1">{point.title}</h4>
                  <p className="text-white text-opacity-80">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionComponent;
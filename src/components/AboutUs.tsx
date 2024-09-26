import React from 'react';
import { Link } from 'react-router-dom';
import { Sandwich, Heart, Sprout } from 'lucide-react';

const AboutUsComponent: React.FC = () => {
  const missionPoints = [
    {
      icon: <Sandwich size={24} />,
      title: 'Delicious Meals',
      description: 'Kid-approved bento sets that excite',
    },
    {
      icon: <Heart size={24} />,
      title: 'Nutritious Choices',
      description: 'Balanced meals for growing minds',
    },
    {
      icon: <Sprout size={24} />,
      title: 'Sustainable Practices',
      description: 'Eco-friendly packaging and sourcing',
    },
  ];

  return (
    <div className='w-full text-primary py-16 px-4 md:px-8 bg-brand-cream'>
      <div className="max-w-screen-xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            About Bento & Friends
          </h2>
          <p className="text-xl max-w-2xl mx-auto">
            Revolutionizing primary school lunches with nutritious, delicious, and exciting meals.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg mb-6">
              Founded by passionate food lovers and parents, Bento & Friends understands the challenges of providing varied, healthy lunches day after day. Our all-in-one complete bento set meals make lunchtime easier for parents and more enjoyable for kids.
            </p>
            <p className="text-lg mb-6">
              We believe that every child deserves a meal that fuels their day of learning and play. That's why we're committed to delivering tasty, nutritionally balanced options using eco-friendly practices.
            </p>
            <Link
              to="/order"
			  className="inline-block bg-brand-dark-green text-brand-cream hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green ring-offset-2 ring-offset-brand-cream"
			>
              Try Our Meals
            </Link>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
            {missionPoints.map((point, index) => (
              <div key={index} className="flex items-start mb-4 last:mb-0">
                <div className="mr-4 text-brand-dark-green">{point.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold">{point.title}</h4>
                  <p className="text-gray-600">{point.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsComponent;
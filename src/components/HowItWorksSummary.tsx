import React from 'react';
import { ClipboardList, Utensils, Truck } from 'lucide-react';

const HowItWorksSummaryComponent: React.FC = () => {
  const steps = [
    {
      icon: <ClipboardList size={32} />,
      title: 'Select Your Meals',
      description: 'Browse our menu and choose from a variety of nutritious options.',
    },
    {
      icon: <Utensils size={32} />,
      title: 'Customize Your Plan',
      description: 'Pick your preferred delivery day.',
    },
    {
      icon: <Truck size={32} />,
      title: 'We Deliver',
      description: "Sit back and relax as we deliver fresh meals to your child's school.",
    },
  ];

  return (
    <div className="w-full bg-brand-cream py-12 px-4 md:px-8 mt-8">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
        <h2 className="text-4xl text-primary">How it Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white border-2 border-primary rounded-lg p-6"
            >
              <div className="flex justify-center mb-4 text-primary">{step.icon}</div>
              <h3 className="text-xl font-semibold text-primary mb-2 text-center">
                {step.title}
              </h3>
              <p className="text-gray-600 text-center">{step.description}</p>
            </div>
          ))}
        </div>
        
        <p className="text-lg text-center text-gray-700">
          Bento & Friends is designed to make a parent's life easier. Our streamlined menu and ordering
          process allow you to order with just a few clicks. Our weekly packages make it even simpler -
          order ahead and forget, confident that your child's nutritional needs are being taken care of.
        </p>
      </div>
    </div>
  );
};

export default HowItWorksSummaryComponent;
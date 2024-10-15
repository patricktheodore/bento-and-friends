import React from 'react';
import { ClipboardList, Utensils, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      description: "Sit back and relax as we deliver straight to your school.",
    },
  ];

  return (
    <div className="w-full bg-brand-cream py-12 px-4 md:px-8 mt-8">
      <div className="max-w-screen-xl mx-auto flex flex-col gap-8">
      <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          How it Works
          </h2>
        {/* <h2 className="text-4xl text-primary">How it Works</h2> */}

        <p className="text-lg text-justify text-gray-700">
          Bento & Friends is designed to make a parent's life easier. Our streamlined menu and ordering
          process allow you to order with just a few clicks. Our weekly packages make it even simpler -
          order ahead and forget, confident that your child's nutritional needs are being taken care of.
        </p>

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

        <div className="text-center">
					<Link
						to="/order"
						className="inline-block bg-brand-dark-green text-brand-cream hover:brightness-110 font-bold py-3 px-8 rounded-full transition duration-300 ease-in-out transform hover:shadow-lg ring-2 ring-transparent hover:ring-brand-dark-green ring-offset-2 ring-offset-brand-cream"
					>
						Order Now &rarr;
					</Link>
				</div>
      </div>
    </div>
  );
};

export default HowItWorksSummaryComponent;
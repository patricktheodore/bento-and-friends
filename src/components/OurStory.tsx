import React from 'react';
import image1 from '@/assets/BentoFriendsImage.jpg';
import image2 from '@/assets/1000029387.jpg';

const OurStoryComponent: React.FC = () => {
  return (
    <div className='w-full bg-brand-cream text-primary py-12 lg:py-24 px-4 md:px-8'>
      <div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-6">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Our<br />Story
          </h2>
          
          <p className="text-lg max-w-xl">
            Bento & Friends was born from the struggle of a single father who strived every day to give their child the nutrition that they deserved. Our single father, Alvin, would have to spend much of his limited and precious time with his daughter traveling to supermarkets, buying ingredients, cooking and packaging.
          </p>
          
          <p className="text-lg max-w-xl">
            This led to the inception of Bento and Friends, a simple way for parents to ensure their kids get a delicious meal that fuels them the right way and enables them to spend their time with their kids how they want to.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square bg-gray-300 rounded-lg overflow-hidden">
            <img src={image1} alt="Chef preparing bento boxes in large quantity" className="w-full h-full object-cover" />
          </div>
          <div className="aspect-square bg-gray-300 rounded-lg overflow-hidden mt-8">
            <img src={image2} alt="School child enjoying meal" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurStoryComponent;
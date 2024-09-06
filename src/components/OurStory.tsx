import React from 'react';

const OurStoryComponent: React.FC = () => {

	return (
		<div className='w-full bg-brand-dark-green text-white py-8'>
			<div className="w-full max-w-screen-xl mx-auto p-4 md:p-8 flex flex-col justify-start items-start gap-4 md:gap-8 my-8">
				<h2 className="text-2xl md:text-4xl">Our Story</h2>

				<div className='w-full'>
					<p className=''>
                    Bento & Friends was born from the struggle of a single father who strived every day to give their child the nutrition that they deserved. Our single father, Alvin, would have to spend much of his limited and precious time with his daughter traveling to supermarkets, buying ingredients, cooking and packaging. This led to the inception of Bento and Friends, a simple way for parents to ensure their kids get a delicious meal that fuels them the right way and enables them to spend their time with their kids how they want to.                    
                    </p>
				</div>

			</div>
		</div>
	);
};

export default OurStoryComponent;

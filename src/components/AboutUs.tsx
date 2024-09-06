import React from 'react';

const AboutUsComponent: React.FC = () => {

	return (
		<div className='w-full text-primary py-8'>
			<div className="w-full max-w-screen-xl mx-auto p-4 md:p-8 flex flex-col justify-start items-start gap-4 md:gap-8 my-8">
				<h2 className="text-2xl md:text-4xl">About Us</h2>

				<div className='w-full'>
					<p className=''>
                    Bento & Friends is looking to change the landscape of primary school lunches by providing nutritious & yummy all-in-one complete bento set meals! 					
                    </p>
				</div>

			</div>
		</div>
	);
};

export default AboutUsComponent;

import React from 'react';
import { Link } from 'react-router-dom';

const NutritionComponent: React.FC = () => {

	return (
		<div className='w-full bg-brand-dark-green text-white py-8'>
			<div className="w-full max-w-screen-xl mx-auto p-4 md:p-8 flex flex-col justify-start items-start gap-4 md:gap-8 my-8">
				<h2 className="text-2xl md:text-4xl">Nutrition</h2>

				<div className='w-full'>
					<p className=''>
						All of our meals are nut free, low in sodium, low in sugar and nutritionally balanced by our experienced kitchen team who are qualified in regards to all current food safety, health hygiene and allergens for schools. This ensures our bento meals are carefully regulated whilst optimally nutritious for students, providing ease of mind for schools and parents alike.				
					</p>
				</div>

				<Link
					to={'/menu'}
					className="underline text-lg font-light tracking-wide hover:cursor-pointer hover:brightness-75 underline-offset-[6px] hover:underline-offset-8 transition-all duration-300"
				>
					Check out the Menu &rarr;
				</Link>

			</div>
		</div>
	);
};

export default NutritionComponent;

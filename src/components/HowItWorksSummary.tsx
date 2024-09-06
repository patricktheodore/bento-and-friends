import React from 'react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Link } from 'react-router-dom';

const HowItWorksSummaryComponent: React.FC = () => {


	return (
		<div className="w-full max-w-screen-xl mx-auto p-4 md:p-8 flex flex-col justify-start items-start gap-4 md:gap-8 my-8">
			<h2 className="text-2xl md:text-4xl text-primary">How it Works</h2>

			<div className='w-full'>
				<p className=''>
					Simply fill out your details, select your meals and when you want them! Bento & Friends is designed to make the life of a parent easier. Our menu and ordering process is streamlined so that you can order within a few clicks of a button. Our weekly packages allow you to do it in even fewer clicks! Simply order ahead and forget, confident your child’s nutritional needs are being taken care of. 
				</p>
			</div>

			<Link
				to={'/order'}
				className="text-primary underline text-lg font-light tracking-wide hover:cursor-pointer hover:text-secondary underline-offset-[6px] hover:underline-offset-8 transition-all duration-300"
			>
				Order Now &rarr;
			</Link>

		</div>
	);
};

export default HowItWorksSummaryComponent;

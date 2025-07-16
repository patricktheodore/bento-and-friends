import React, { useEffect, useState } from 'react';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { Loader2 } from 'lucide-react';
import placeholder from '@/assets/banner.png';

const OurStoryComponent: React.FC = () => {
	const [image1, setImage1] = useState('');
	const [image2, setImage2] = useState('');
	const [imagesLoading, setImagesLoading] = useState(true);

	useEffect(() => {
		const fetchImages = async () => {
			const storage = getStorage();
			try {
				const [url1, url2] = await Promise.all([
					getDownloadURL(ref(storage, 'images/BentoFriendsImage (1).jpg')),
					getDownloadURL(ref(storage, 'images/1000029387 (1).jpg'))
				]);
				setImage1(url1);
				setImage2(url2);
			} catch (error) {
				console.error("Error fetching images:", error);
				setImage1(placeholder);
				setImage2(placeholder);
			} finally {
				setImagesLoading(false);
			}
		};

		fetchImages();
	}, []);

	return (
		<div className="w-full bg-brand-dark-green text-white py-16 lg:py-24 px-4 md:px-8">
			<div className="max-w-screen-xl mx-auto grid md:grid-cols-2 gap-12 items-start">
				{/* Content Section */}
				<div className="flex flex-col gap-8">
					<h2 className="text-5xl md:text-6xl font-bold leading-tight">
						Bento & Friends
						<br />
						School Vision
					</h2>
					
					<div className="space-y-6">
						<p className="text-lg text-white/90 leading-relaxed">
							As busy parents & hospitality professionals ourselves, Bento & Friends are passionately looking to advance the
							school lunch environment by providing nutritious & yummy all-in-one complete bento set meals.
						</p>
						
						<p className="text-lg text-white/90 leading-relaxed">
							We understand the time constraints & challenges of preparing engaging lunches everyday for our children, therefore our services aim to
							assist busy parents whilst alleviating any existing canteen workload/volunteer issues to directly benefit
							schoolchildren with our all-in-one bento school lunches.
						</p>
					</div>

					{/* Personal Touch */}
					<div className="border-l-4 border-white/30 pl-6 py-2">
						<p className="text-white/80 italic text-lg">
							"Made by parents, for parents — because we know the struggle is real."
						</p>
					</div>
				</div>
				
				{/* Images Section */}
				<div className="relative">
					{imagesLoading ? (
						<div className="grid grid-cols-2 gap-4">
							<div className="pb-24">
								<div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-white/60" />
								</div>
							</div>
							<div className="pt-24">
								<div className="w-full h-64 bg-white/10 rounded-lg flex items-center justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-white/60" />
								</div>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-4">
							<div className="pb-24">
								<div className="aspect-[4/5] overflow-hidden rounded-lg shadow-xl">
									<img 
										src={image1} 
										alt="Chef preparing bento boxes in large quantity" 
										className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
									/>
								</div>
							</div>
							<div className="pt-24">
								<div className="aspect-[4/5] overflow-hidden rounded-lg shadow-xl">
									<img 
										src={image2} 
										alt="School child enjoying meal" 
										className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
									/>
								</div>
							</div>
						</div>
					)}
					
					{/* Decorative Elements */}
					<div className="absolute -top-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
					<div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
				</div>
			</div>
		</div>
	);
};

export default OurStoryComponent;
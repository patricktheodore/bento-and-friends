import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import PlatterCard from '@/components/PlatterCard';
import CateringEnquiryForm from '@/components/CateringEnquiry';

const CateringPage = () => {
	const { state } = useAppContext();

	return (
		<div className="container mx-auto p-4 py-8">
			<h1 className="text-5xl md:text-6xl font-bold leading-tight">Catering</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
				<div className="space-y-8">
					<Card className="">
						<CardHeader>
							<CardTitle className="text-lg">Important Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center space-x-2">
								<MapPin size={20} />
								<span>Free delivery to Perth Metro areas</span>
							</div>
							<div className="flex items-center space-x-2">
								<Phone size={20} />
								<span>0405 787 777</span>
							</div>
							<div className="flex items-center space-x-2">
								<Mail size={20} />
								<span>bentoandfriends@outlook.com.au</span>
							</div>
							<div className="flex items-center space-x-2">
								<Clock size={20} />
								<span>24 hours notice required</span>
							</div>
						</CardContent>
					</Card>

					{state.platters.map((platter) => (
						<PlatterCard
							key={platter.id}
							platter={platter}
						/>
					))}

					<div className="bg-brand-cream p-6 rounded-lg">
						<h3 className="text-lg font-semibold mb-3">Additional Details</h3>
						<ul className="list-disc list-inside space-y-2">
							<li>Includes disposable cutlery and napkins</li>
							<li>Minimum order of 2 platters required</li>
							<li>Dietary requirements can be accommodated</li>
                            <li>We will cater our platters to try and accommodate most reasonable requests.</li>
						</ul>
					</div>
				</div>

				{/* Right Column - Enquiry Form */}
				<div>
					<CateringEnquiryForm />
				</div>
			</div>
		</div>
	);
};

export default CateringPage;

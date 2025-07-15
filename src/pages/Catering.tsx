import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail, Clock, ChefHat, Info, CheckCircle } from 'lucide-react';
import PlatterCard from '@/components/PlatterCard';
import CateringEnquiryForm from '@/components/CateringEnquiry';

const CateringPage = () => {
	const { state } = useAppContext();

	return (
		<div className="w-full space-y-6 p-4 sm:p-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Catering Services</h1>
				<p className="text-gray-600 mt-1">Professional catering for your special events</p>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				{/* Left Column - Information and Platters */}
				<div className="xl:col-span-2 space-y-6">
					{/* Contact & Service Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Info className="h-5 w-5" />
								Service Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-blue-100 rounded-lg">
											<MapPin className="h-4 w-4 text-blue-600" />
										</div>
										<div>
											<p className="font-medium">Delivery Area</p>
											<p className="text-sm text-gray-600">Free delivery to Perth Metro areas</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-green-100 rounded-lg">
											<Clock className="h-4 w-4 text-green-600" />
										</div>
										<div>
											<p className="font-medium">Notice Required</p>
											<p className="text-sm text-gray-600">24 hours advance notice</p>
										</div>
									</div>
								</div>
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-purple-100 rounded-lg">
											<Phone className="h-4 w-4 text-purple-600" />
										</div>
										<div>
											<p className="font-medium">Phone</p>
											<p className="text-sm text-gray-600">0405 787 777</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="p-2 bg-orange-100 rounded-lg">
											<Mail className="h-4 w-4 text-orange-600" />
										</div>
										<div>
											<p className="font-medium">Email</p>
											<p className="text-sm text-gray-600">bentoandfriends@outlook.com.au</p>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Available Platters */}
					{state.platters.length > 0 ? (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ChefHat className="h-5 w-5" />
									Available Platters
								</CardTitle>
								<p className="text-sm text-gray-600 mt-1">
									{state.platters.length} platter option{state.platters.length !== 1 ? 's' : ''} available for your event
								</p>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									{state.platters.map((platter) => (
										<PlatterCard
											key={platter.id}
											platter={platter}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="text-center py-12">
								<div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
									<ChefHat className="h-8 w-8 text-gray-400" />
								</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">No Platters Available</h3>
								<p className="text-gray-500">
									Catering options are currently being updated. Please contact us directly for availability.
								</p>
							</CardContent>
						</Card>
					)}

					{/* Service Details */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								What's Included
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="text-sm">Disposable cutlery and napkins</span>
									</div>
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="text-sm">Professional presentation</span>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="text-sm">Dietary requirements accommodated</span>
									</div>
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="text-sm">Customizable to your needs</span>
									</div>
								</div>
							</div>

							<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-start gap-2">
									<Info className="h-4 w-4 text-blue-600 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-blue-800">Important Notes</p>
										<ul className="text-sm text-blue-700 mt-1 space-y-1">
											<li>• Minimum order of 2 platters required</li>
											<li>• We accommodate most reasonable dietary requests</li>
											<li>• Contact us for custom catering solutions</li>
										</ul>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right Column - Enquiry Form */}
				<div className="xl:col-span-1">
					<div className="sticky top-6 space-y-4">
						<Card className="shadow-lg">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Mail className="h-5 w-5" />
									Request Quote
								</CardTitle>
								<p className="text-sm text-gray-600 mt-1">
									Get a personalized quote for your event
								</p>
							</CardHeader>
							<CardContent>
								<CateringEnquiryForm />
							</CardContent>
						</Card>

						{/* Quick Contact Card */}
						<Card>
							<CardContent className="pt-6">
								<div className="text-center space-y-3">
									<h4 className="font-medium">Need immediate assistance?</h4>
									<div className="space-y-2">
										<Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
											<Phone className="h-3 w-3 mr-1" />
											Call: 0405 787 777
										</Badge>
										<div className="text-xs text-gray-500">
											Available during business hours
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CateringPage;
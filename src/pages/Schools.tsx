import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { schoolSlug } from '@/utils/utils';
import { MapPin, ArrowRight } from 'lucide-react';

const SchoolsPage: React.FC = () => {
	const { state } = useAppContext();

	const activeSchools = [...state.schools]
		.filter((school) => school.isActive)
		.sort((a, b) => a.name.localeCompare(b.name));

	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-brand-cream/5">
			<div className="container mx-auto px-4 py-12">
				<div className="mb-10">
					<h1 className="text-4xl md:text-6xl font-bold text-brand-dark-green">Schools</h1>
					<p className="mt-3 text-lg text-brand-taupe">
						Choose a school to see its menu.
					</p>
				</div>

				{state.isLoading && state.schools.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-green mx-auto mb-4"></div>
							<p className="text-gray-600">Loading schools...</p>
						</div>
					</div>
				) : activeSchools.length === 0 ? (
					<div className="text-center py-20 text-gray-600">
						No schools are currently available.
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{activeSchools.map((school) => (
							<Link key={school.id} to={`/${schoolSlug(school.name)}`} className="group">
								<Card className="h-full transition-all duration-300 border-gray-200 hover:border-brand-dark-green/20 hover:shadow-lg">
									<CardHeader>
										<CardTitle className="text-xl text-brand-dark-green">
											{school.name}
										</CardTitle>
									</CardHeader>
									<CardContent className="flex flex-col justify-between gap-4">
										{school.address && (
											<p className="flex items-start gap-2 text-brand-taupe">
												<MapPin className="h-4 w-4 mt-1 shrink-0" />
												<span>{school.address}</span>
											</p>
										)}
										<span className="inline-flex items-center gap-2 font-semibold text-brand-dark-green group-hover:gap-3 transition-all">
											View menu
											<ArrowRight className="h-4 w-4" />
										</span>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default SchoolsPage;

import React from 'react';
import logo from "@/assets/bento-logo.png";

const MaintenancePage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
			<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
				<div className="mb-6">
                    <img
                        src={logo}
                        alt="Bento&Friends Logo"
                        className="h-16 w-auto mx-auto"
                    />
					<h1 className="text-2xl font-bold text-gray-800 mt-4 mb-2">Under Maintenance</h1>
					<p className="text-gray-600 mb-6">
						We're currently performing some updates to improve your experience. We'll be back online
						shortly. Thanks for your patience!
					</p>
				</div>

				<div className="mb-6">
					<div className="animate-pulse flex space-x-1 justify-center">
						<div className="h-2 w-2 bg-brand-dark-green rounded-full"></div>
						<div className="h-2 w-2 bg-brand-dark-green rounded-full animation-delay-200"></div>
						<div className="h-2 w-2 bg-brand-dark-green rounded-full animation-delay-400"></div>
					</div>
				</div>

				<div className="text-sm text-gray-500">
					<p className="mt-2">
						For urgent matters, please contact us at{' '}
						<a
							href="mailto:bentoandfriends@outlook.com.au"
							className="text-blue-500 hover:underline">
							bentoandfriends@outlook.com.au
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default MaintenancePage;

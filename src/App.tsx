import './App.css';
import { AppProvider } from './context/AppContext';
import Header from './layout/Header';
import Footer from './layout/Footer';
import { BrowserRouter as Router } from 'react-router-dom';
import AnimatedRoutes from './utils/AnimatedRoutes';
import ScrollToTop from './utils/ScrollToTop';
import { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
	return (
		<AppProvider>
			<Router>
				<ScrollToTop />
				<div className="flex flex-col min-h-screen">
					<Header />
					<main className="w-full min-h-[75vh] flex-grow bg-primary">
						<AnimatedRoutes />
					</main>
					<Footer />
				</div>
				<Toaster
					position="bottom-center"
					toastOptions={{
						success: {
							style: {
								background: 'green',
								color: 'white',
							},
						},
						error: {
							style: {
								background: 'red',
								color: 'white',
							},
						},
					}}
				/>
			</Router>
		</AppProvider>
	);
};

export default App;

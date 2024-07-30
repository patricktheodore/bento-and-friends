import './App.css';
import { AppProvider } from './context/AppContext';
import AccountPage from './pages/Account';
import UserloginPage from './pages/SignInRegister';
import SignOut from './pages/SignOut';
import Header from './layout/Header';
import Footer from './layout/Footer';
import HomePage from './pages/Home';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const App: React.FC = () => {
    return (
        <AppProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="w-full flex-grow bg-primary">
                <Routes>
                  <Route path="/" element={<HomePage />} />

                  {/* <Route path="/menu" element={<Menu />} /> */}
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/signin" element={<UserloginPage />} />
                  <Route path="/signout" element={<SignOut />} />
                  {/* <Route path="/signout" element={<SignOut />} /> */}
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AppProvider>
    );
};

export default App;

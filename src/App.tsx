import { useState } from 'react';
import './App.css';
import { AppProvider } from './context/AppContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Header from './layout/Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
const App: React.FC = () => {
    return (
        <AppProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow container mx-auto mt-4">
                <Routes>
                  <Route path="/" element={<SignUp />} />
                  {/* <Route path="/menu" element={<Menu />} /> */}
                  {/* <Route path="/cart" element={<Cart />} /> */}
                  <Route path="/signin" element={<SignIn />} />
                  {/* <Route path="/profile" element={<Profile />} /> */}
                  {/* <Route path="/signout" element={<SignOut />} /> */}
                </Routes>
              </main>
            </div>
          </Router>
        </AppProvider>
    );
};

export default App;

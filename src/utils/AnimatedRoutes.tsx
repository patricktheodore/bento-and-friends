import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../layout/PageTransition';
import HomePage from '../pages/Home';
import AccountPage from '../pages/Account';
import UserloginPage from '../pages/SignInRegister';
import SignOut from '../pages/SignOut';
import MenuPage from '../pages/Menu';
import OrderPage from '../pages/Order';
import AboutPage from '../pages/About';
import ContactPage from '../pages/Enquire';
import AdminDashboardPage from '../pages/AdminDashboard';
import SchoolsPage from '../pages/Schools';
import { AdminRoute } from './RouteGuard';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/menu" element={<PageTransition><MenuPage /></PageTransition>} />
        <Route path="/order" element={<PageTransition><OrderPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/account" element={<PageTransition><AccountPage /></PageTransition>} />
        <Route path="/signin" element={<PageTransition><UserloginPage /></PageTransition>} />
        <Route path="/signout" element={<PageTransition><SignOut /></PageTransition>} />
        <Route path="/schools" element={<PageTransition><SchoolsPage /></PageTransition>} />

        {/* admin routes */}
        <Route path='/admin' element={
          <AdminRoute>
            <PageTransition>
              <AdminDashboardPage />
            </PageTransition>
          </AdminRoute>} 
        />
        
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
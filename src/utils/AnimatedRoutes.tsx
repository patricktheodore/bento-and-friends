import React, { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../layout/PageTransition';
import { AdminRoute } from './RouteGuard';
import AnimatedLoadingScreen from '../utils/AnimatedLoadingScreen';
import CateringPage from '@/pages/Catering';

// Lazy load components
const HomePage = lazy(() => import('../pages/Home'));
const AccountPage = lazy(() => import('../pages/Account'));
const UserloginPage = lazy(() => import('../pages/SignInRegister'));
const SignOut = lazy(() => import('../pages/SignOut'));
const MenuPage = lazy(() => import('../pages/Menu'));
const OrderPage = lazy(() => import('../pages/Order'));
const ContactPage = lazy(() => import('../pages/Contact'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboard'));
const SchoolsPage = lazy(() => import('../pages/Schools'));
const CheckoutPage = lazy(() => import('@/pages/Checkout'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccess'));
const RunSheet = lazy(() => import('@/pages/RunSheet'));

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><HomePage /></Suspense></PageTransition>} />
        <Route path="/menu" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><MenuPage /></Suspense></PageTransition>} />
        <Route path="/order" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><OrderPage /></Suspense></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><ContactPage /></Suspense></PageTransition>} />
        <Route path="/catering" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><CateringPage /></Suspense></PageTransition>} />
        <Route path="/account" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><AccountPage /></Suspense></PageTransition>} />
        <Route path="/signin" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><UserloginPage /></Suspense></PageTransition>} />
        <Route path="/signout" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><SignOut /></Suspense></PageTransition>} />
        <Route path="/schools" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><SchoolsPage /></Suspense></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><CheckoutPage /></Suspense></PageTransition>} />
        <Route path="/order-success" element={<PageTransition><Suspense fallback={<AnimatedLoadingScreen />}><OrderSuccessPage /></Suspense></PageTransition>} />
        <Route path='/loading' element={<AnimatedLoadingScreen />} />

        {/* admin routes */}
        <Route path='/admin' element={
          <AdminRoute>
            <PageTransition>
              <Suspense fallback={<AnimatedLoadingScreen />}>
                <AdminDashboardPage />
              </Suspense>
            </PageTransition>
          </AdminRoute>} 
        />

        <Route path='/run-sheet' element={
          <AdminRoute>
            <PageTransition>
              <Suspense fallback={<AnimatedLoadingScreen />}>
                <RunSheet />
              </Suspense>
            </PageTransition>
          </AdminRoute>}
        />
        
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
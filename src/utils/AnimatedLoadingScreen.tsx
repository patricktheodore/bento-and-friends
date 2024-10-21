import React from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/bento-logo.png'; // Adjust the path as needed

const AnimatedLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-brand-cream">
      <div className="text-center">
        <motion.img
          src={logo}
          alt="Bento & Friends Logo"
          className="w-auto h-32 mb-4"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0, 0.71, 0.2, 1.01]
          }}
        />
        <motion.div
          className="loading-spinner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="spinner"></div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedLoadingScreen;
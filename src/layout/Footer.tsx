import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';


const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark-green text-brand-cream py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          {/* Brand and Logo */}
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <img src="/path/to/your/logo.png" alt="Bento&Friends Logo" className="h-10 w-auto mr-3" />
              <span className="text-2xl font-bold">Bento&Friends</span>
            </Link>
            <p className="mt-2">Delicious and healthy meals for students</p>
          </div>

          {/* Contact Information */}
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
            <p>Email: info@bentoandfriends.com</p>
            <p>Phone: (123) 456-7890</p>
            <p>Address: 123 Bento St, Foodville, FL 12345</p>
          </div>

          {/* Social Media Links */}
          <div className="w-full md:w-1/3">
            <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors duration-300">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold transition-colors duration-300">
                <FontAwesomeIcon icon={faInstagram} />
              </a>  
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-brand-cream/30 text-center">
          <p className='text-sm'>&copy; {new Date().getFullYear()} Bento&Friends. All rights reserved.</p>
          <span className='text-xs'>Designed by <a href="https://www.patricktheodore.dev" target="_blank" rel="noopener noreferrer" className="text-brand-gold">patricktheodore</a></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
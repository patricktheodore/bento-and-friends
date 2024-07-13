import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Header: React.FC = () => {
    const { state } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav
            className="bg-brand-cream shadow-md sticky top-0 z-10"
            role="navigation"
            aria-label="Main"
        >
            <div className='w-full relative'>
                <div className="container mx-auto flex justify-between items-center py-4 px-8 border-b">
                    <Link
                        to="/"
                        className="flex items-center hover:scale-105 transition-transform duration-300 ease-in-out hover:cursor-pointer"
                    >
                        <img
                            src="src/assets/logo-green.png"
                            alt="Bento&Friends Logo"
                            className="h-12 w-auto"
                        />
                    </Link>
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            to="/menu"
                            className="text-brand-dark-green hover:text-brand-gold"
                        >
                            Menu
                        </Link>
                        {state.user ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="text-brand-dark-green hover:text-brand-gold"
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/signout"
                                    className="text-brand-dark-green hover:text-brand-gold"
                                >
                                    Sign Out
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/signin"
                                className="text-brand-dark-green hover:text-brand-gold"
                            >
                                Sign In
                            </Link>
                        )}
                        <Link
                            to="/cart"
                            className="text-brand-dark-green hover:text-brand-gold"
                        >
                            Cart ({state.currentOrder?.items.length || 0})
                        </Link>
                    </div>
                    <button 
                        className={`md:hidden scale-75 text-brand-dark-green hover:text-brand-gold hamburger hamburger--collapse ${isOpen ? 'is-active' : ''}`}  type="button"
                        onClick={() => setIsOpen(!isOpen)}    
                    >
                        <span className="hamburger-box">
                            <span className="hamburger-inner"></span>
                        </span>
                    </button>
                </div>
                <div 
                    className={`md:hidden bg-brand-cream absolute top-full left-0 w-full overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100 rounded-b-md shadow-lg' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className={`py-4 flex flex-col items-center gap-y-2 transition-transform duration-300 ease-in-out ${
                        isOpen ? 'transform translate-y-0' : 'transform -translate-y-full'
                    }`}>
                        <Link
                            to="/menu"
                            className="text-brand-dark-green hover:text-brand-gold"
                        >
                            Menu
                        </Link>
                        {state.user ? (
                            <>
                                <Link
                                    to="/profile"
                                    className="text-brand-dark-green hover:text-brand-gold"
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/signout"
                                    className="text-brand-dark-green hover:text-brand-gold"
                                >
                                    Sign Out
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/signin"
                                className="text-brand-dark-green hover:text-brand-gold"
                            >
                                Sign In
                            </Link>
                        )}
                        <Link
                            to="/cart"
                            className="text-brand-dark-green hover:text-brand-gold"
                        >
                            Cart ({state.currentOrder?.items.length || 0})
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Header: React.FC = () => {
    const { state } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const menuItems = [
        { to: '/menu', label: 'Menu' },
        { to: '/order', label: 'Order' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
        ...(state.user
            ? [{ to: '/profile', label: 'Profile' }]
            : [{ to: '/signin', label: 'Sign In' }]
        )
    ];

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const renderMenuItems = (isMobile = false) => (
        menuItems.map((item, index) => (
            <Link
                key={index}
                to={item.to}
                className={`text-brand-dark-green hover:text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold ${isMobile ? 'w-full text-center py-2' : ''}`}
                onClick={() => isMobile && setIsOpen(false)}
            >
                {item.label}
            </Link>
        ))
    );

    return (
        <nav
            className="bg-brand-cream shadow-md sticky top-0 z-50"
            role="navigation"
            aria-label="Main"
        >
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-brand-cream text-brand-dark-green p-2">
                Skip to main content
            </a>
            <div className='w-full relative'>
                <div className="container mx-auto flex justify-between items-center py-4 px-8">
                    <Link
                        to="/"
                        className="flex items-center hover:scale-105 transition-transform duration-300 ease-in-out hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    >
                        <img
                            src="src/assets/logo-green.png"
                            alt="Bento&Friends Logo"
                            className="h-12 w-auto"
                        />
                    </Link>
                    <div className="hidden md:flex items-center space-x-4">
                        {renderMenuItems()}
                    </div>
                    <button 
                        className={`md:hidden scale-75 text-primary hover:text-brand-gold hamburger hamburger--collapse ${isOpen ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        aria-controls="mobile-menu"
                        aria-label={isOpen ? "Close main menu" : "Open main menu"}
                    >
                        <span className="hamburger-box">
                            <span className="hamburger-inner"></span>
                        </span>
                    </button>
                </div>
                <div 
                    id="mobile-menu"
                    ref={mobileMenuRef}
                    className={`md:hidden bg-brand-cream absolute top-full left-0 w-full overflow-hidden transition-all duration-500 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100 rounded-b-md shadow-lg' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className={`py-4 flex flex-col items-center gap-y-2 transition-transform duration-300 ease-in-out ${
                        isOpen ? 'transform translate-y-0' : 'transform -translate-y-full'
                    }`}>
                        {renderMenuItems(true)}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
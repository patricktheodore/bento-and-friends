import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import CartIcon from '@/components/CartIcon';
import Cart from '@/components/Cart';
import logo from "@/assets/bento-logo.png";
import { UpdateDetailsDialog } from '@/components/UpdateDetailsDialog';

const Header: React.FC = () => {
    const { state } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    
    const menuItems = [
        { to: '/menu', label: 'Menu' },
        { to: '/contact', label: 'Contact' },
        ...(state.user 
            ? (state.user.isAdmin
                ? [
                    { to: '/run-sheet', label: 'Run Sheet' },
                    { to: '/admin', label: 'Admin Console' },
                    { to: '/signout', label: 'Sign Out' }
                ]
                : [
                    { to: '/order', label: 'Order' },
                    { to: '/catering', label: 'Catering' },
                    { to: '/account', label: 'Account' },
                    { to: '/signout', label: 'Sign Out' }
                ])
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
                className={`text-brand-dark-green hover:text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                    isMobile ? 'w-full text-center py-2' : ''
                } ${
                    isActive(item.to) ? 'text-brand-dark-green underline underline-offset-2 font-bold' : ''
                }`}
                onClick={() => isMobile && setIsOpen(false)}
            >
                {item.label}
            </Link>
        ))
    );

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {state.user && <UpdateDetailsDialog />}
            <nav
                className={`bg-brand-cream border-b border-stone-300 sticky top-0 z-50 ${isOpen ? 'menu-open' : ''}`}
                role="navigation"
                aria-label="Main"
            >
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-brand-cream text-brand-dark-green p-2">
                    Skip to main content
                </a>
                <div className='w-full relative'>
                    <div className="container mx-auto flex justify-between items-center p-4">
                        <Link
                            to="/"
                            className="flex items-center hover:scale-105 transition-transform duration-300 ease-in-out hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold"
                        >
                            <img
                                src={logo}
                                alt="Bento&Friends Logo"
                                className="h-16 w-auto"
                            />
                        </Link>
                        {!state.isLoading && (
                            <>
                                <div className="hidden md:flex items-center space-x-4">
                                    {renderMenuItems()}
                                    {state.user && !state.user.isAdmin && (
                                        <CartIcon />
                                    )}
                                </div>

                                <div className='flex md:hidden justify-end items-center'>
                                    {state.user && !state.user.isAdmin && (
                                        <CartIcon />
                                    )}
                                    <button
                                        className={`scale-75 mt-[8px] text-brand-dark-green hover:text-brand-gold hamburger hamburger--collapse ${isOpen ? 'is-active' : ''}`}
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
                            </>
                        )}
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
            <div className="overlay"></div>
            <Cart />
        </>
    );
};

export default Header;  
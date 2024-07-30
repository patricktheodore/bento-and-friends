import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { signOut } from '../services/auth';
import { Link, useNavigate } from 'react-router-dom';

const SignOut: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            dispatch({ type: 'SIGN_OUT' });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    useEffect(() => {
        handleSignOut();
    }, []);

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {state.user ? 'Signing Out...' : 'You have been signed out!'}
                    </h2>
                </div>
                {!state.user && (
                    <div className="mt-8 space-y-6">
                        <div className="flex flex-col justify-start items-center gap-2">
                            <Link
                                to="/signin"
                                className="group relative w-full flex justify-center items-center p-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark-green hover:brightness-75 focus:outline-none transform transition-all duration-150 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-green"
                            >
                                Sign In Again
                            </Link>
                            <Link
                                to="/"
                                className="group relative w-full flex justify-center items-center p-4 border border-transparent text-sm font-medium rounded-md text-brand-dark-green bg-brand-alternate-green hover:brightness-75 focus:outline-none transform transition-all duration-150 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-green"
                            >
                                Go to Home Page
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SignOut;
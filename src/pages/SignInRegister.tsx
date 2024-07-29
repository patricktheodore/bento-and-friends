import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { signUp } from '../services/auth';

const UserloginPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isNewUserSignup, setIsNewUserSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    if (state.user) {
        return <Navigate to="/profile" replace />;
    }

    const handleToggleSignup = () => {
        setIsNewUserSignup(!isNewUserSignup);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const user = await signUp(email, password, displayName);
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
            console.error('Error signing up:', error);
        }
    };

    return (
        <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isNewUserSignup ? 'Create your account' : 'Sign in to your account'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="rounded-md shadow-sm -space-y-px">
                        {isNewUserSignup && (
                            <div>
                                <label htmlFor="display-name" className="sr-only">Display Name</label>
                                <input
                                    id="display-name"
                                    name="displayName"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm"
                                    placeholder="Display Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isNewUserSignup ? '' : 'rounded-t-md'} focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark-green hover:brightness-75 focus:outline-none transform transition-all duration-150 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-green"
                        >
                            {isNewUserSignup ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={handleToggleSignup} className="font-medium text-brand-dark-green hover:underline hover:brightness-75">
                        {isNewUserSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UserloginPage;
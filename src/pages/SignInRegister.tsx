import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { signUp, signIn } from '../services/auth';
import { FirebaseError } from 'firebase/app';

const UserloginPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isNewUserSignup, setIsNewUserSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [working, setWorking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (state.user) {
        return <Navigate to="/account" replace />;
    }

    const handleToggleSignup = () => {
        setIsNewUserSignup(!isNewUserSignup);
        setError(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear any existing errors
        try {
            setWorking(true);
            const user = isNewUserSignup ? await signUp(email, password, displayName) : await signIn(email, password);
            dispatch({ type: 'SET_USER', payload: user });
        } catch (error: unknown) {
            if (error instanceof FirebaseError) {
                setError(getErrorMessage(error));
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error('Authentication error:', error);
        } finally {
            setWorking(false);
        }
    };

    const getErrorMessage = (error: FirebaseError): string => {
        switch (error.message) {
            case "Firebase: Error (auth/invalid-credential).":
                return 'Invalid credentials. Please try again.';
            case 'Firebase: Error (auth/email-already-in-use).':
                return 'This email is already in use. Please try signing in instead.';
            case 'Firebase: Error (auth/invalid-email).':
                return 'The email address is not valid.';
            case 'Firebase: Error (auth/weak-password).':
                return 'The password is too weak. Please use a stronger password.';
            case 'Firebase: Error (auth/user-not-found).':
            case 'Firebase: Error (auth/wrong-password).':
                return 'Invalid email or password. Please try again.';
            case 'Firebase: Error (auth/too-many-requests).':
                return 'Too many unsuccessful login attempts. Please try again later.';
            default:
                return 'An unexpected error occurred. Please try again.';
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
                            disabled={working}
                            className={`group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark-green hover:brightness-75 focus:outline-none transform transition-all duration-150 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-green ${working ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isNewUserSignup ? 'Sign Up' : 'Sign In'}
                            {working && <div className='loader absolute right-2'></div>}
                        </button>
                    </div>
                </form>

                <div className='text-center text-red-700 text-base'>
                    {error ? error : ''}
                </div>

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
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { signUp, signIn, sendPasswordResetEmail } from '../services/auth';
import { FirebaseError } from 'firebase/app';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserloginPage: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const [isNewUserSignup, setIsNewUserSignup] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [working, setWorking] = useState(false);
	const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
	const [passwordsMatch, setPasswordsMatch] = useState(true);

	const navigate = useNavigate();

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const mode = searchParams.get('mode');
		if (mode === 'register') {
			setIsNewUserSignup(true);
		}
	}, [location]);

	const checkPasswordsMatch = (password: string, confirmPassword: string) => {
		setPasswordsMatch(password === confirmPassword);
	};

	const handleToggleSignup = () => {
		setIsNewUserSignup(!isNewUserSignup);
		setError(null);
		setPasswordError(null);
	};

	const validatePassword = (password: string): string | null => {
		if (password.length < 6) {
			return 'Password must be at least 6 characters long.';
		}
		if (!/\d/.test(password)) {
			return 'Password must contain at least one number.';
		}
		if (!/[A-Z]/.test(password)) {
			return 'Password must contain at least one uppercase letter.';
		}
		if (!/[a-z]/.test(password)) {
			return 'Password must contain at least one lowercase letter.';
		}
		return null;
	};

	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newPassword = e.target.value;
		setPassword(newPassword);
		if (isNewUserSignup) {
			const validationError = validatePassword(newPassword);
			setPasswordError(validationError);
			checkPasswordsMatch(newPassword, confirmPassword);
		}
	};
	
	const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newConfirmPassword = e.target.value;
		setConfirmPassword(newConfirmPassword);
		checkPasswordsMatch(password, newConfirmPassword);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (isNewUserSignup) {
			const validationError = validatePassword(password);
			if (validationError) {
				setPasswordError(validationError);
				return;
			}
			if (password !== confirmPassword) {
				setError('Passwords do not match');
				return;
			}
		}

		try {
			setWorking(true);
			if (isNewUserSignup) {
				const user = await signUp(email, password, displayName);
				dispatch({ type: 'SET_USER', payload: user });
				toast.success('Account created successfully! Welcome!');
				navigate('/account');
			} else {
				const user = await signIn(email, password);
				dispatch({ type: 'SET_USER', payload: user });
				toast.success('Signed in successfully!');
				user.isAdmin ? navigate('/admin') : navigate('/order');
			}
		} catch (error: unknown) {
			if (error instanceof FirebaseError) {
				const errorMessage = getErrorMessage(error);
				toast.error(errorMessage);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('An unexpected error occurred. Please try again.');
			}
			console.error('Authentication error:', error);
		} finally {
			setWorking(false);
		}
	};

	const handleForgotPassword = async () => {
		try {
			setWorking(true);
			await sendPasswordResetEmail(email);
			toast.success('Password reset email sent. Please check your inbox.');
		} catch (error) {
			if (error instanceof FirebaseError) {
				const errorMessage = getErrorMessage(error);
				toast.error(errorMessage);
			} else {
				toast.error('An unexpected error occurred. Please try again.');
			}
			console.error('Password reset error:', error);
		} finally {
			setWorking(false);
		}
	};

	const getErrorMessage = (error: FirebaseError): string => {
		switch (error.message) {
			case 'Firebase: Error (auth/invalid-credential).':
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
				<form
					className="mt-8 space-y-6"
					onSubmit={handleSubmit}
				>
					<input
						type="hidden"
						name="remember"
						defaultValue="true"
					/>
					<div className="rounded-md shadow-sm -space-y-px">
						{isNewUserSignup && (
							<div>
								<label
									htmlFor="display-name"
									className="sr-only"
								>
									Display Name
								</label>
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
							<label
								htmlFor="email-address"
								className="sr-only"
							>
								Email address
							</label>
							<input
								id="email-address"
								name="email"
								type="email"
								autoComplete="email"
								required
								className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
									isNewUserSignup ? '' : 'rounded-t-md'
								} focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm`}
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label
								htmlFor="password"
								className="sr-only"
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm"
								placeholder="Password"
								value={password}
								onChange={handlePasswordChange}
							/>
						</div>
						{isNewUserSignup && (
							<div>
								<label
									htmlFor="confirm-password"
									className="sr-only"
								>
									Confirm Password
								</label>
								<input
									id="confirm-password"
									name="confirmPassword"
									type="password"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-dark-green focus:border-brand-dark-green focus:z-10 sm:text-sm"
									placeholder="Confirm Password"
									value={confirmPassword}
									onChange={handleConfirmPasswordChange}
								/>

							</div>
						)}
					</div>
					{isNewUserSignup && !passwordsMatch && (<div className="text-sm text-red-600">Passwords do not match</div>)}
					{isNewUserSignup && passwordError && <div className="text-sm text-red-600">{passwordError}</div>}
					<div>
						<button
							type="submit"
							disabled={working || (isNewUserSignup && (!!passwordError || !passwordsMatch))}
							className={`group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark-green hover:brightness-75 focus:outline-none transform transition-all duration-150 hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-green ${
								working || (isNewUserSignup && !!passwordError) ? 'opacity-50 cursor-not-allowed' : ''
							}`}
						>
							{isNewUserSignup ? 'Sign Up' : 'Sign In'}
							{working && <div className="loader absolute right-2"></div>}
						</button>
					</div>
				</form>

				{!isNewUserSignup && (
					<div className="text-sm text-center">
						<button
							onClick={handleForgotPassword}
							className="font-medium text-brand-dark-green hover:underline hover:brightness-75"
						>
							Forgot your password?
						</button>
					</div>
				)}

				<div className="text-center text-red-700 text-base">{error ? error : ''}</div>

				<div className="text-sm text-center">
					<button
						onClick={handleToggleSignup}
						className="font-medium text-brand-dark-green hover:underline hover:brightness-75"
					>
						{isNewUserSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserloginPage;

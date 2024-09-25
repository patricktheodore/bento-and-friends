import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

type FormData = {
	name: string;
	email: string;
	phone: string;
	message: string;
};

const ContactPage = () => {
	const { state } = useAppContext();
	const { control, handleSubmit, reset, setValue } = useForm<FormData>({
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			message: '',
		},
	});

	useEffect(() => {
		if (state.user) {
			setValue('name', state.user.displayName || '');
			setValue('email', state.user.email || '');
		}
	}, [state.user, setValue]);

	const onSubmit = (data: FormData) => {
		console.log('Form submitted:', data);
		toast("We've received your message and will get back to you soon.");
		reset();
	};

	return (
		<div className="container mx-auto p-4 py-8">
			<h1 className="text-4xl font-bold mb-6">Contact Us</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<Card className="bg-brand-dark-green text-brand-cream">
					<CardHeader>
						<CardTitle className="text-lg">Our Contact Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center space-x-2">
							<MapPin size={20} />
							<span>123 Food Street, Cuisine City, FC 12345</span>
						</div>
						<div className="flex items-center space-x-2">
							<Phone size={20} />
							<span>(123) 456-7890</span>
						</div>
						<div className="flex items-center space-x-2">
							<Mail size={20} />
							<span>support@fooddelivery.com</span>
						</div>
						<div className="flex items-center space-x-2">
							<Clock size={20} />
							<span>Mon-Fri: 830AM-3PM</span>
						</div>
					</CardContent>
				</Card>

				<div>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="name">Name*</Label>
							<Controller
								name="name"
								control={control}
								rules={{ required: 'Name is required' }}
								render={({ field, fieldState: { error } }) => (
									<>
										<Input
											{...field}
											id="name"
											className='bg-white'
										/>
										{error && <p className="text-red-500 text-sm">{error.message}</p>}
									</>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email*</Label>
							<Controller
								name="email"
								control={control}
								rules={{
									required: 'Email is required',
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: 'Invalid email address',
									},
								}}
								render={({ field, fieldState: { error } }) => (
									<>
										<Input
											{...field}
											className='bg-white'
											id="email"
											type="email"
										/>
										{error && <p className="text-red-500 text-sm">{error.message}</p>}
									</>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone*</Label>
							<Controller
								name="phone"
								control={control}
								rules={{
									required: 'Phone number is required',
									pattern: {
										value: /^[0-9]{10}$/,
										message: 'Invalid phone number (10 digits required)',
									},
								}}
								render={({ field, fieldState: { error } }) => (
									<>
										<Input
											{...field}
											className='bg-white'
											id="phone"
											type="tel"
										/>
										{error && <p className="text-red-500 text-sm">{error.message}</p>}
									</>
								)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Message*</Label>
							<Controller
								name="message"
								control={control}
								rules={{ required: 'Message is required' }}
								render={({ field, fieldState: { error } }) => (
									<>
										<Textarea
											className='bg-white'
											{...field}
											id="message"
										/>
										{error && <p className="text-red-500 text-sm">{error.message}</p>}
									</>
								)}
							/>
						</div>
						<Button type="submit">Send Message</Button>
					</form>
				</div>

				<div className="col-span-full space-y-4 mt-12">
					<h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
					<Accordion
						type="single"
						collapsible
						className="w-full"
					>
						<AccordionItem value="item-1">
							<AccordionTrigger className="text-lg">Is everything cooked fresh daily?</AccordionTrigger>
							<AccordionContent>
								Yes, all of our meals are prepared fresh daily by our team of experienced chefs. We use
								only the highest quality ingredients to ensure that every dish is delicious and
								nutritious.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger className="text-lg">
								What if there's an issue with my order?
							</AccordionTrigger>
							<AccordionContent>
								If you experience any issues with your order, please contact our customer support team
								immediately. We're here to help and will work to resolve any problems as quickly as
								possible.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3">
							<AccordionTrigger className="text-lg">
								What if I need to make changes to an order I've placed?
							</AccordionTrigger>
							<AccordionContent>
								If you need to make changes to an order you've placed, please contact our customer
								support team as soon as possible. We'll do our best to accommodate your request, but
								please note that changes may not always be possible.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;

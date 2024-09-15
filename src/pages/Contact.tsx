import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const ContactPage = () => {
	const { state } = useAppContext();

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [orderReference, setOrderReference] = useState('');
	const [message, setMessage] = useState('');
	const [previousOrders, setPreviousOrders] = useState<string[]>([]);

	useEffect(() => {
		if (state.user) {
			setName(state.user.displayName || '');
			setEmail(state.user.email || '');

			// Assuming orders are stored in state.orders and have an 'id' field
			const orderIds = state.user.orderHistory?.map((order) => order.id) || [];
			setPreviousOrders(orderIds);
		}
	}, [state.user]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Here you would typically send the form data to your backend
		console.log('Form submitted:', { name, email, orderReference, message });

		// Show a success toast
		toast("We've received your message and will get back to you soon.");

		// Clear the form
		setName('');
		setEmail('');
		setOrderReference('');
		setMessage('');
	};

	return (
		<div className="container mx-auto p-4 py-8">
			<h1 className="text-4xl font-bold mb-6">Contact Us</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				
				<Card className='bg-brand-dark-green text-brand-cream'>
					<CardHeader>
						<CardTitle className='text-lg'>Our Contact Information</CardTitle>
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
						onSubmit={handleSubmit}
						className="space-y-4"
					>
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						{previousOrders.length > 0 && (
							<div className="space-y-2">
								<Label htmlFor="orderReference">Order Reference</Label>
								<Select
									value={orderReference}
									onValueChange={setOrderReference}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select an order reference" />
									</SelectTrigger>
									<SelectContent>
										{previousOrders.map((orderId) => (
											<SelectItem
												key={orderId}
												value={orderId}
											>
												Order #{orderId}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="message">Message</Label>
							<Textarea
								id="message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								required
							/>
						</div>
						<Button type="submit">Send Message</Button>
					</form>
				</div>

				<div className="col-span-full space-y-4 mt-6">
					
					<h2 className="text-3xl font-bold">Frequently Asked Questions</h2>

					<Accordion
						type="single"
						collapsible
						className="w-full"
					>
						<AccordionItem value="item-1">
							<AccordionTrigger className='text-lg'>Is everything cooked fresh daily?</AccordionTrigger>
							<AccordionContent>
								Yes, all of our meals are prepared fresh daily by our team of experienced chefs. We use
								only the highest quality ingredients to ensure that every dish is delicious and
								nutritious.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger className='text-lg'>What if there's an issue with my order?</AccordionTrigger>
							<AccordionContent>
								If you experience any issues with your order, please contact our customer support team
								immediately. We're here to help and will work to resolve any problems as quickly as
								possible.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3">
							<AccordionTrigger className='text-lg'>What if I need to make changes to an order I've placed?</AccordionTrigger>
							<AccordionContent>
								If you need to make changes to an order you've placed, please contact our customer support
								team as soon as possible. We'll do our best to accommodate your request, but please note
								that changes may not always be possible.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;
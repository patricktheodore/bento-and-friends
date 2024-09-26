import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
											className="bg-white"
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
											className="bg-white"
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
											className="bg-white"
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
											className="bg-white"
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
							<AccordionTrigger className="text-lg">
								How do I place a school lunch order for my child?
							</AccordionTrigger>
							<AccordionContent>
								Simply hop onto www.bentoandfriends.com.au, click on the ‘Get started’ icon and enter
								the required details for parent and child set up, including school, year group, room
								number, teacher and email for order confirmation. Once set up, you will be able to login
								at any given time to start ordering from our full bento menu.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-2">
							<AccordionTrigger className="text-lg">
								At what stage can I change my school lunch order?
							</AccordionTrigger>
							<AccordionContent>
								There are many stages/ prompts to review your order cart prior to confirming your lunch
								order through payment. However, once the order has been confirmed via payment and a
								order number/ email has been generated, it is considered as processed so please double
								check all orders before clicking the ‘pay now’ icon.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-3">
							<AccordionTrigger className="text-lg">
								When is the cut off time for next day delivery?
							</AccordionTrigger>
							<AccordionContent>
								Bento and Friends deliver Monday through to Fridays and will accept orders all the way
								until 11:59pm the previous day for next day scheduled delivery. However we encourage
								parents to plan ahead by ordering in advance. This enables families to take full
								advantage of our multiple purchase bundles by applying discounts and also the
								convenience of one time ordering process, saving time.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-4">
							<AccordionTrigger className="text-lg">
								What is included in every Bento lunch order?
							</AccordionTrigger>
							<AccordionContent>
								All of our Bento &amp; Friends lunch menu comprise of your chosen main choice (protein,
								carbohydrates and veggies) alongside an included yoghurt box (probiotic) and seasonal
								fruits for a fully encompassed meal. Disposable cutlery (wooden spoon &amp; rounded
								fork) with a napkin will also be provided for each delivery.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-5">
							<AccordionTrigger className="text-lg">
								What if my child has allergens/ strict dietary restrictions?
							</AccordionTrigger>
							<AccordionContent>
								As dedicated catering operators for schools and children, Bento &amp; Friends take
								allergens and strict dietary restrictions with priority and is a requirement during the
								profile account set up stage on our ordering website. All of our meals are nut and
								sesame free, low in sodium and low in sugar and prepared by an experience kitchen team.
								With a Food Safety Supervisor (FSS) always on kitchen site, as well as a qualified team
								in current food safety and school allergen awareness courses, Bento &amp; Friends ensure
								that high quality curated meals are consistently delivered to your school.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-6">
							<AccordionTrigger className="text-lg">
								What is the delivery distribution process for Bento &amp; Friends at my child’s school?
							</AccordionTrigger>
							<AccordionContent>
								Once our kitchen team freshly prepare your confirmed order closest to your school’s
								delivery time - the bento lunch meals are organized by school, student name, year group
								and will be promptly delivered to the agreed drop off point, usually the canteen space
								(decided by your P+C and/ or principal) at your school. As our meals are fully packaged
								in one convenient bento box, there is minimal sorting for any volunteer parents/ school
								staff once on site. Most schools will have designated student reps from each room to
								come collect their lunch orders from the pick up point straight back to the classroom
								for a simple hand out, removing any hassle of sorting out and distributing individual
								ordered items for school lunches.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-7">
							<AccordionTrigger className="text-lg">
								How do I Pay and what methods of payment is accepted?
							</AccordionTrigger>
							<AccordionContent>
								Currently our online ordering website accepts the following cashless payment methods:
								All major cards - Visa, Mastercard &amp; American Express, Apple Pay and Google Pay.
								Please note a minimal transaction fee will apply to finalized orders.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-8">
							<AccordionTrigger className="text-lg">
								Are my payment details and personal details safe and protected?
							</AccordionTrigger>
							<AccordionContent>
								Our online ordering website is developed and integrated with a leading online payment
								processing platform, ensuring that customer payment details are always kept secure and
								protected, with evolving privacy and data protection processes, procedures and best
								practices under all applicable privacy and data protection regimes.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-9">
							<AccordionTrigger className="text-lg">
								Can I purchase multiple lunches for different days?
							</AccordionTrigger>
							<AccordionContent>
								Yes – the Bento &amp; Friends ordering model actually encourages purchasing in advance
								as this will be a time saver convenience exercise. Parents can orders school lunch
								orders for the week or even for weeks/ different dates at a time in one sitting, whilst
								also applying our discounts for multiple orders. A definite win/ win. Please refer to
								our ‘Current Offers’ section to see all our current and upcoming promotions.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-10">
							<AccordionTrigger className="text-lg">
								If I have more than one child, can I order Bento lunches for multiple children in the
								same transaction?
							</AccordionTrigger>
							<AccordionContent>
								Yes – when setting up your profile you can add multiple children to your account. When
								ordering, click on each individual child’s name and the order will be linked.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-11">
							<AccordionTrigger className="text-lg">
								What if my child is sick on the day of lunch delivery?
							</AccordionTrigger>
							<AccordionContent>
								We understand that absences/ sickness do occur. As we prepare everything fresh to order,
								the cut off time to let us know that your child will not be attending school is 07:30am
								on the day of scheduled order. Please get in contact with Alvin on 0405 787 777 to
								discuss an alternative order date and note that the chance for rescheduled orders will
								be forfeited if after the 07:30am cutoff time for any absences.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-12">
							<AccordionTrigger className="text-lg">
								How nutritious are Bento &amp; Friends lunch meals and are they healthy for my child?
							</AccordionTrigger>
							<AccordionContent>
								All of our menu offerings at Bento &amp; Friends are guide lined under the WA Government
								Healthy Food and Drinks Criteria (HFD) and adhere to the Traffic Light System. With 90%
								of our menu under the healthy green light and 0% in the red light category, our freshly
								prepared Bento lunch meals are the perfect healthy lunch option for your child that is
								not only nutritious, but covers all the main food groups whilst delivering big taste.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-13">
							<AccordionTrigger className="text-lg">
								What if my child did not receive or have an incorrect order delivered?
							</AccordionTrigger>
							<AccordionContent>
								The Bento &amp; Friends kitchen team and distribution team take each and every other
								with highest importance and follow strict protocol of checking that all orders/ Bento
								lunches are accounted for. We match each confirmed order according to our internal run
								sheet and have the school confirm at drop off that all items are checked/ ticked off
								prior to us departing. In the rarest of occasions there are missing orders or incorrect
								lunches, we urge the school to contact us immediately on 0405 787 777 to discuss the
								incident in detail. We will also be in direct contact with parents to investigate how
								this occurred and will provide appropriate remediation if the fault is with Bento &amp;
								Friends.
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="item-14">
							<AccordionTrigger className="text-lg">
								Does Bento &amp; Friends offer catering services outside of school distribution?
							</AccordionTrigger>
							<AccordionContent>
								Yes, we can cater for private events, school events and love to get involved in P+C
								initiatives and will take all requested catering orders into consideration. Please note
								there may be minimum quantities involved and please email Alvin at
								Bentoandfriends@outlook.com.au or call 0405 787 777 to discuss how we can tailor your
								specific catering request/ upcoming event. Lastly, Bento &amp; Friends provides an
								exciting lunch meal plan that will get your kids excited! Most of our team are parents
								themselves, so we kdow the ins and outs of preparing a healthy, fresh and convenient
								lunch that our kids will engage in. Bento &amp; Friends strive for empty bento boxes at
								the end of lunchtime, full stomachs and a convenient process for busy parents and school
								administrators alike!
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>
		</div>
	);
};

export default ContactPage;

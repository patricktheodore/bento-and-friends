import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    Loader2, 
    MessageSquare, 
    User, 
    Send, 
    HelpCircle, 
    CheckCircle 
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

type FormData = {
    name: string;
    email: string;
    phone: string;
    message: string;
};

const ContactPage = () => {
    const { state } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');

    const { control, handleSubmit, reset, setValue, formState: { errors, isValid } } = useForm<FormData>({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            message: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (state.user) {
            setValue('name', state.user.displayName || '');
            setValue('email', state.user.email || '');
        }
    }, [state.user, setValue]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const functions = getFunctions();
            const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
            const result = await sendContactEmail(data);

            console.log('Email sent successfully:', result);

            toast.success("We've received your message and will get back to you soon.");
            setSubmittedName(data.name);
            setIsSubmitted(true);
            reset();
        } catch (error) {
            console.error('Error sending email:', error);
            toast.error('Failed to send your message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state component
    const SuccessMessage = () => (
        <Card>
            <CardContent className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Thank you, {submittedName}!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    We've received your message and will get back to you within 24 hours.
                </p>
                <Button 
                    onClick={() => {
                        setIsSubmitted(false);
                        reset();
                    }}
                    variant="outline"
                    size="sm"
                >
                    Send Another Message
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="w-full space-y-6 p-4 sm:p-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
                <p className="text-gray-600 mt-1">Get in touch with our team</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Contact Information */}
                <div className="xl:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Location</p>
                                        <p className="text-sm text-gray-600">Perth, WA</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Phone className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Phone</p>
                                        <p className="text-sm text-gray-600">0405 787 777</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Mail className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Email</p>
                                        <p className="text-sm text-gray-600">bentoandfriends@outlook.com.au</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Clock className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Business Hours</p>
                                        <p className="text-sm text-gray-600">Mon-Fri: 8:30AM-3:00PM</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Info Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-3">
                                <h4 className="font-medium">Quick Response</h4>
                                <div className="space-y-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        24 hour response time
                                    </Badge>
                                    <div className="text-xs text-gray-500">
                                        We aim to respond to all inquiries quickly
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="xl:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" />
                                Send us a Message
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Have a question or need assistance? We're here to help.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {isSubmitted ? (
                                <SuccessMessage />
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Contact Details Section */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <User className="h-4 w-4" />
                                                Your Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm">Name*</Label>
                                                <Controller
                                                    name="name"
                                                    control={control}
                                                    rules={{ 
                                                        required: 'Name is required', 
                                                        minLength: { value: 2, message: 'Name must be at least 2 characters' } 
                                                    }}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            id="name"
                                                            className="bg-white"
                                                            placeholder="Enter your full name"
                                                        />
                                                    )}
                                                />
                                                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm">Email*</Label>
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
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                className="bg-white"
                                                                id="email"
                                                                type="email"
                                                                placeholder="your@email.com"
                                                            />
                                                        )}
                                                    />
                                                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone" className="text-sm">Phone*</Label>
                                                    <Controller
                                                        name="phone"
                                                        control={control}
                                                        rules={{
                                                            required: 'Phone number is required',
                                                            pattern: {
                                                                value: /^[0-9]{10}$/,
                                                                message: 'Valid 10-digit number required',
                                                            },
                                                        }}
                                                        render={({ field }) => (
                                                            <Input
                                                                {...field}
                                                                className="bg-white"
                                                                id="phone"
                                                                type="tel"
                                                                placeholder="0405123456"
                                                            />
                                                        )}
                                                    />
                                                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Message Section */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <MessageSquare className="h-4 w-4" />
                                                Your Message
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="message" className="text-sm">Message*</Label>
                                                <Controller
                                                    name="message"
                                                    control={control}
                                                    rules={{ 
                                                        required: 'Message is required', 
                                                        minLength: { value: 10, message: 'Message must be at least 10 characters' } 
                                                    }}
                                                    render={({ field }) => (
                                                        <Textarea
                                                            className="bg-white min-h-[120px]"
                                                            {...field}
                                                            id="message"
                                                            placeholder="Tell us how we can help you..."
                                                        />
                                                    )}
                                                />
                                                {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Submit Section */}
                                    <div className="space-y-4">
                                        <Button 
                                            type="submit" 
                                            disabled={!isValid || isSubmitting}
                                            className="w-full"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Sending Message...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                        
                                        <p className="text-xs text-center text-gray-500">
                                            We'll respond within 24 hours during business days
                                        </p>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
                    <p className="text-gray-600">Find answers to common questions about our services</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            Common Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-left">
                                    How do I place a school lunch order for my child?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Simply hop onto www.bentoandfriends.com.au, click on the 'Get started' icon and enter
                                    the required details for parent and child set up, including school, year group, room
                                    number, teacher and email for order confirmation. Once set up, you will be able to login
                                    at any given time to start ordering from our full bento menu.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-left">
                                    At what stage can I change my school lunch order?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    There are many stages/ prompts to review your order cart prior to confirming your lunch
                                    order through payment. However, once the order has been confirmed via payment and a
                                    order number/ email has been generated, it is considered as processed so please double
                                    check all orders before clicking the 'pay now' icon.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-left">
                                    When is the cut off time for next day delivery?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Bento and Friends deliver Monday through to Fridays and will accept orders all the way
                                    until 11:59pm the previous day for next day scheduled delivery. However we encourage
                                    parents to plan ahead by ordering in advance. This enables families to take full
                                    advantage of our multiple purchase bundles by applying discounts and also the
                                    convenience of one time ordering process, saving time.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-4">
                                <AccordionTrigger className="text-left">
                                    What is included in every Bento lunch order?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    All of our Bento & Friends lunch menu comprise of your chosen main choice (protein,
                                    carbohydrates and veggies) alongside an included yoghurt box (probiotic) and seasonal
                                    fruits for a fully encompassed meal. Disposable cutlery (wooden spoon & rounded
                                    fork) with a napkin will also be provided for each delivery.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-5">
                                <AccordionTrigger className="text-left">
                                    What if my child has allergens/ strict dietary restrictions?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    As dedicated catering operators for schools and children, Bento & Friends take
                                    allergens and strict dietary restrictions with priority and is a requirement during the
                                    profile account set up stage on our ordering website. All of our meals are nut and
                                    sesame free, low in sodium and low in sugar and prepared by an experience kitchen team.
                                    With a Food Safety Supervisor (FSS) always on kitchen site, as well as a qualified team
                                    in current food safety and school allergen awareness courses, Bento & Friends ensure
                                    that high quality curated meals are consistently delivered to your school.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-6">
                                <AccordionTrigger className="text-left">
                                    What is the delivery distribution process for Bento & Friends at my child's school?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Once our kitchen team freshly prepare your confirmed order closest to your school's
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
                                <AccordionTrigger className="text-left">
                                    How do I Pay and what methods of payment is accepted?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Currently our online ordering website accepts the following cashless payment methods:
                                    All major cards - Visa, Mastercard & American Express, Apple Pay and Google Pay.
                                    Please note a minimal transaction fee will apply to finalized orders.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-8">
                                <AccordionTrigger className="text-left">
                                    Are my payment details and personal details safe and protected?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Our online ordering website is developed and integrated with a leading online payment
                                    processing platform, ensuring that customer payment details are always kept secure and
                                    protected, with evolving privacy and data protection processes, procedures and best
                                    practices under all applicable privacy and data protection regimes.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-9">
                                <AccordionTrigger className="text-left">
                                    Can I purchase multiple lunches for different days?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Yes – the Bento & Friends ordering model actually encourages purchasing in advance
                                    as this will be a time saver convenience exercise. Parents can orders school lunch
                                    orders for the week or even for weeks/ different dates at a time in one sitting, whilst
                                    also applying our discounts for multiple orders. A definite win/ win. Please refer to
                                    our 'Current Offers' section to see all our current and upcoming promotions.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-10">
                                <AccordionTrigger className="text-left">
                                    If I have more than one child, can I order Bento lunches for multiple children in the
                                    same transaction?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Yes – when setting up your profile you can add multiple children to your account. When
                                    ordering, click on each individual child's name and the order will be linked.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-11">
                                <AccordionTrigger className="text-left">
                                    What if my child is sick on the day of lunch delivery?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    We understand that absences/ sickness do occur. As we prepare everything fresh to order,
                                    the cut off time to let us know that your child will not be attending school is 07:30am
                                    on the day of scheduled order. Please get in contact with Alvin on 0405 787 777 to
                                    discuss an alternative order date and note that the chance for rescheduled orders will
                                    be forfeited if after the 07:30am cutoff time for any absences.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-12">
                                <AccordionTrigger className="text-left">
                                    How nutritious are Bento & Friends lunch meals and are they healthy for my child?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    All of our menu offerings at Bento & Friends are guide lined under the WA Government
                                    Healthy Food and Drinks Criteria (HFD) and adhere to the Traffic Light System. With 90%
                                    of our menu under the healthy green light and 0% in the red light category, our freshly
                                    prepared Bento lunch meals are the perfect healthy lunch option for your child that is
                                    not only nutritious, but covers all the main food groups whilst delivering big taste.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-13">
                                <AccordionTrigger className="text-left">
                                    What if my child did not receive or have an incorrect order delivered?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    The Bento & Friends kitchen team and distribution team take each and every other
                                    with highest importance and follow strict protocol of checking that all orders/ Bento
                                    lunches are accounted for. We match each confirmed order according to our internal run
                                    sheet and have the school confirm at drop off that all items are checked/ ticked off
                                    prior to us departing. In the rarest of occasions there are missing orders or incorrect
                                    lunches, we urge the school to contact us immediately on 0405 787 777 to discuss the
                                    incident in detail. We will also be in direct contact with parents to investigate how
                                    this occurred and will provide appropriate remediation if the fault is with Bento &
                                    Friends.
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-14">
                                <AccordionTrigger className="text-left">
                                    Does Bento & Friends offer catering services outside of school distribution?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Yes, we can cater for private events, school events and love to get involved in P+C
                                    initiatives and will take all requested catering orders into consideration. Please note
                                    there may be minimum quantities involved and please email Alvin at
                                    Bentoandfriends@outlook.com.au or call 0405 787 777 to discuss how we can tailor your
                                    specific catering request/ upcoming event. Lastly, Bento & Friends provides an
                                    exciting lunch meal plan that will get your kids excited! Most of our team are parents
                                    themselves, so we know the ins and outs of preparing a healthy, fresh and convenient
                                    lunch that our kids will engage in. Bento & Friends strive for empty bento boxes at
                                    the end of lunchtime, full stomachs and a convenient process for busy parents and school
                                    administrators alike!
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-15">
                                <AccordionTrigger className="text-left">
                                    What if I didn't receive any welcome confirmation upon sign up/ order confirmation emails?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                    Please check through and refresh all email inboxes, including your Junk/Spam folder. For all orders, they are all
                                    accessible under your Account information with order history and upcoming meal calendar.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ContactPage;
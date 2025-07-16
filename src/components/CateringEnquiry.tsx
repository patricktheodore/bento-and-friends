import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, ChefHat, Calendar, Mail, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface BaseFormData {
    name: string;
    email: string;
    phone: string;
    date: string;
    message: string;
}

type FormData = BaseFormData & {
    [key: `platter_${string}`]: string;
};

interface CateringEnquiryFormProps {
    standalone?: boolean;
}

const CateringEnquiryForm = ({ standalone = false }: CateringEnquiryFormProps) => {
    const { state } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formInitialized, setFormInitialized] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');

    const generateDefaultValues = (): FormData => {
        const defaultValues: FormData = {
            name: '',
            email: '',
            phone: '',
            date: '',
            message: '',
        };
        
        state.platters.forEach(platter => {
            defaultValues[`platter_${platter.id}`] = '0';
        });
        
        return defaultValues;
    };

    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<FormData>({
        defaultValues: generateDefaultValues(),
        mode: 'onChange',
    });

    useEffect(() => {
        if (state.platters.length > 0 && !formInitialized) {
            reset(generateDefaultValues());
            setFormInitialized(true);
        }
    }, [state.platters, reset, formInitialized]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const platterSelections = state.platters
                .map(platter => ({
                    id: platter.id,
                    name: platter.display,
                    quantity: parseInt(data[`platter_${platter.id}`] || '0'),
                    price: platter.price
                }))
                .filter(selection => selection.quantity > 0);

            const formattedData = {
                contact: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone
                },
                event: {
                    date: data.date,
                    message: data.message
                },
                platters: platterSelections,
            };

            const functions = getFunctions();
            const sendCateringEnquiry = httpsCallable(functions, 'sendCateringEnquiry');
            const result = await sendCateringEnquiry(formattedData);

            console.log('Enquiry sent successfully:', result);
            
            toast.success('Your catering enquiry has been sent successfully!');
            setSubmittedName(data.name);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error sending enquiry:', error);
            toast.error('Failed to send your enquiry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (!formInitialized) {
        if (standalone) {
            return (
                <div className="w-full space-y-6 p-4 sm:p-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Catering Enquiry</h1>
                        <p className="text-gray-600 mt-1">Request catering services for your event</p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-600" />
                        <p className="text-lg text-gray-600">Loading catering options...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Loading form...</p>
            </div>
        );
    }

    // Success state
    if (isSubmitted) {
        if (standalone) {
            return (
                <div className="w-full space-y-6 p-4 sm:p-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Catering Enquiry</h1>
                        <p className="text-gray-600 mt-1">Request catering services for your event</p>
                    </div>

                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="text-center py-12">
                            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                Thank you, {submittedName}!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                We've received your catering enquiry and will be in touch within 24 hours to discuss your event details.
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-green-800">
                                    If you need immediate assistance, please don't hesitate to call us directly.
                                </p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setIsSubmitted(false);
                                    reset(generateDefaultValues());
                                }}
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                Submit Another Enquiry
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <Card>
                <CardContent className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Thank you, {submittedName}!
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        We'll be in touch within 24 hours.
                    </p>
                    <Button 
                        onClick={() => {
                            setIsSubmitted(false);
                            reset(generateDefaultValues());
                        }}
                        variant="outline"
                        size="sm"
                    >
                        Submit Another Enquiry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const formContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Contact Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">Name*</Label>
                        <Controller
                            name="name"
                            control={control}
                            rules={{ required: 'Name is required' }}
                            render={({ field }) => (
                                <Input 
                                    {...field} 
                                    id="name" 
                                    className="bg-white" 
                                    placeholder="Enter your full name"
                                    value={field.value || ''} 
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
                                        type="email" 
                                        id="email" 
                                        className="bg-white" 
                                        placeholder="your@email.com"
                                        value={field.value || ''} 
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
                                    required: 'Phone is required',
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: 'Valid 10-digit number required',
                                    },
                                }}
                                render={({ field }) => (
                                    <Input 
                                        {...field} 
                                        type="tel" 
                                        id="phone" 
                                        className="bg-white" 
                                        placeholder="0405123456"
                                        value={field.value || ''} 
                                    />
                                )}
                            />
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Event Details Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Event Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-sm">Event Date*</Label>
                        <Controller
                            name="date"
                            control={control}
                            rules={{ required: 'Date is required' }}
                            render={({ field }) => (
                                <Input 
                                    {...field} 
                                    type="date" 
                                    id="date" 
                                    className="bg-white" 
                                    value={field.value || ''} 
                                />
                            )}
                        />
                        {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm">Event Details*</Label>
                        <Controller
                            name="message"
                            control={control}
                            rules={{ required: 'Please provide event details' }}
                            render={({ field }) => (
                                <Textarea
                                    {...field}
                                    id="message"
                                    className="bg-white min-h-[100px]"
                                    placeholder="Tell us about your event, number of guests, dietary requirements..."
                                    value={field.value || ''}
                                />
                            )}
                        />
                        {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Platter Selection Section */}
            {state.platters.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ChefHat className="h-4 w-4" />
                            Platter Selection
                        </CardTitle>
                        <p className="text-xs text-gray-600 mt-1">
                            Select quantities (optional - leave at 0 if unsure)
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {state.platters.map(platter => (
                                <div key={platter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{platter.display}</p>
                                        <p className="text-xs text-gray-600">${platter.price} each</p>
                                    </div>
                                    <div className="w-20">
                                        <Controller
                                            name={`platter_${platter.id}` as keyof FormData}
                                            control={control}
                                            defaultValue="0"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    className="bg-white text-center"
                                                    value={field.value || '0'}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                            Sending...
                        </>
                    ) : (
                        <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Enquiry
                        </>
                    )}
                </Button>
                
                <p className="text-xs text-center text-gray-500">
                    We'll respond within 24 hours
                </p>
            </div>
        </form>
    );

    if (standalone) {
        return (
            <div className="w-full space-y-6 p-4 sm:p-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Catering Enquiry</h1>
                    <p className="text-gray-600 mt-1">Request catering services for your event</p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {formContent}
                </div>
            </div>
        );
    }

    return formContent;
};

export default CateringEnquiryForm;
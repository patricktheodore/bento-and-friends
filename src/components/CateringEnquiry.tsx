import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

const CateringEnquiryForm = () => {
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
            const result = await  sendCateringEnquiry(formattedData);

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

    if (!formInitialized) {
        return <div>Loading form...</div>;
    }

    if (isSubmitted) {
        return (
            <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 font-semibold text-lg">
                    Thank you for your enquiry, {submittedName}!
                </AlertTitle>
                <AlertDescription className="text-green-700 mt-2">
                    We've received your catering request and will be in touch within 24 hours to discuss your event details.
                    If you need immediate assistance, please don't hesitate to call us.
                </AlertDescription>
                <Button 
                    onClick={() => {
                        setIsSubmitted(false);
                        reset(generateDefaultValues());
                    }}
                    variant="outline"
                    className="mt-4"
                >
                    Submit Another Enquiry
                </Button>
            </Alert>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact Information */}
            <div className="space-y-2">
                <Label htmlFor="name">Name*</Label>
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                        <Input 
                            {...field} 
                            id="name" 
                            className="bg-white" 
                            value={field.value || ''} 
                        />
                    )}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
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
                    render={({ field }) => (
                        <Input 
                            {...field} 
                            type="email" 
                            id="email" 
                            className="bg-white" 
                            value={field.value || ''} 
                        />
                    )}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone*</Label>
                <Controller
                    name="phone"
                    control={control}
                    rules={{
                        required: 'Phone is required',
                        pattern: {
                            value: /^[0-9]{10}$/,
                            message: 'Invalid phone number',
                        },
                    }}
                    render={({ field }) => (
                        <Input 
                            {...field} 
                            type="tel" 
                            id="phone" 
                            className="bg-white" 
                            value={field.value || ''} 
                        />
                    )}
                />
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="date">Preferred Date*</Label>
                <Controller
                    name="date"
                    control={control}
                    rules={{ required: 'Date is required' }}
                    render={({ field }) => (
                        <div className="relative">
                            <Input 
                                {...field} 
                                type="date" 
                                id="date" 
                                className="bg-white" 
                                value={field.value || ''} 
                            />
                        </div>
                    )}
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
            </div>

            {/* Dynamic Platter Selection */}
            <div className="space-y-4">
                <Label>Platter Selection*</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.platters.map(platter => (
                        <div key={platter.id} className="space-y-2">
                            <Label htmlFor={`platter_${platter.id}`}>{platter.display}</Label>
                            <Controller
                                name={`platter_${platter.id}` as keyof FormData}
                                control={control}
                                defaultValue="0"
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        type="number"
                                        min="0"
                                        id={`platter_${platter.id}`}
                                        className="bg-white"
                                        value={field.value || '0'}
                                    />
                                )}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Additional Information*</Label>
                <Controller
                    name="message"
                    control={control}
                    rules={{ required: 'Please provide event details and any dietary requirements' }}
                    render={({ field }) => (
                        <Textarea
                            {...field}
                            id="message"
                            className="bg-white"
                            placeholder="Please include event details and any dietary requirements"
                            value={field.value || ''}
                        />
                    )}
                />
                {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? (
                    <>
                        Sending...
                        <Loader2 className="mx-2 h-4 w-4 animate-spin" />
                    </>
                ) : (
                    'Submit Enquiry'
                )}
            </Button>
        </form>
    );
};

export default CateringEnquiryForm;
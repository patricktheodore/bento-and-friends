import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coupon } from '../models/user.model';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import { Checkbox } from './ui/checkbox';

interface CouponModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (coupon: Coupon) => void;
	coupon: Coupon | null;
	mode: 'add' | 'edit';
}

const CouponModal: React.FC<CouponModalProps> = ({ isOpen, onClose, onSubmit, coupon, mode }) => {
	const [code, setCode] = useState('');
	const [discountAmount, setDiscountAmount] = useState('');
	const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
	const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
	const [isSingleUse, setIsSingleUse] = useState<boolean>(false);
	const [isActive, setIsActive] = useState<boolean>(true);

	useEffect(() => {
		if (coupon) {
			setCode(coupon.code);
			setDiscountAmount(coupon.discountAmount.toString());
			setDiscountType(coupon.discountType);
			setExpiryDate(new Date(coupon.expiryDate));
			setIsSingleUse(coupon.isSingleUse);
		} else {
			setCode('');
			setDiscountAmount('');
			setDiscountType('percentage');
			setExpiryDate(undefined);
			setIsSingleUse(false);
		}
	}, [coupon]);

	const handleDateSelect = (date: Date | undefined) => {
		setExpiryDate(date);
	};

	const handleSubmit = () => {
		const newCoupon: Coupon = {
			id: coupon?.id || Date.now().toString(),
			code,
			discountAmount: parseFloat(discountAmount),
			discountType,
			expiryDate: expiryDate!.toISOString(),
			isSingleUse,
			isActive: true,
		};
		onSubmit(newCoupon);
	};

	const isFormValid =
		code.trim() !== '' &&
		discountAmount.trim() !== '' &&
		parseFloat(discountAmount) > 0 &&
		expiryDate !== undefined;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={onClose}
		>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{mode === 'add' ? 'Add New Coupon' : 'Edit Coupon'}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="code"
							className="text-right"
						>
							Code <span className="text-red-500">*</span>
						</Label>
						<Input
							id="code"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							className="col-span-3"
							required
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="discountAmount"
							className="text-right"
						>
							Discount <span className="text-red-500">*</span>
						</Label>
						<Input
							id="discountAmount"
							type="number"
							value={discountAmount}
							onChange={(e) => setDiscountAmount(e.target.value)}
							className="col-span-3"
							required
							min="0"
							step="0.01"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="discountType"
							className="text-right"
						>
							Type <span className="text-red-500">*</span>
						</Label>
						<Select
							value={discountType}
							onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
							required
						>
							<SelectTrigger className="col-span-3">
								<SelectValue placeholder="Select discount type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="percentage">Percentage</SelectItem>
								<SelectItem value="fixed">Fixed Amount</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="expiryDate"
							className="text-right whitespace-nowrap"
						>
							Expiry Date <span className="text-red-500">*</span>
						</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={'outline'}
									className={`col-span-3 justify-start text-left font-normal ${
										!expiryDate && 'text-muted-foreground'
									}`}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{expiryDate ? expiryDate.toDateString() : <span>Pick a date</span>}
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-0 bg-white z-50"
								align="start"
							>
								<Calendar
									mode="single"
									selected={expiryDate}
									onSelect={(date: Date | undefined) => handleDateSelect(date)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="isSingleUse"
							className="text-right"
						>
							Single Use
						</Label>
						<div className="col-span-3 flex items-center space-x-2">
							<Checkbox
								id="isSingleUse"
								checked={isSingleUse}
								onCheckedChange={(checked) => setIsSingleUse(checked as boolean)}
							/>
							<Label htmlFor="isSingleUse">Limit to one-time use</Label>
						</div>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label
							htmlFor="isSingleUse"
							className="text-right"
						>
							Is Active
						</Label>
						<div className="col-span-3 flex items-center space-x-2">
							<Checkbox
								id="isActive"
								checked={isActive}
								onCheckedChange={(checked) => setIsActive(checked as boolean)}
							/>
							<Label htmlFor="isSingleUse">Set the active status of the coupon</Label>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						className="z-40"
						type="submit"
						onClick={handleSubmit}
						disabled={!isFormValid}
					>
						{mode === 'add' ? 'Add Coupon' : 'Update Coupon'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CouponModal;

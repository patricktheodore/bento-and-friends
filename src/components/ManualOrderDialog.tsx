import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';
import { Main } from '@/models/item.model';
import { Child, User } from '@/models/user.model';
import { Meal } from '@/models/order.model';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'react-hot-toast';

interface ManualOrderDialogProps {
	isOpen: boolean;
	onClose: () => void;
	user: User;
}

interface OrderItem {
	id: string;
	mainId: string;
	childId: string;
	addOnIds: string[];
	orderDate: Date | undefined;
}

const ManualOrderDialog: React.FC<ManualOrderDialogProps> = ({ isOpen, onClose, user }) => {
	const { state } = useAppContext();
	const [orderItems, setOrderItems] = useState<OrderItem[]>([
		{
			id: uuidv4(),
			mainId: '',
			childId: '',
			addOnIds: [],
			orderDate: undefined,
		},
	]);
	const [isProcessing, setIsProcessing] = useState(false);

	const calculateItemTotal = (mainId: string, addOnIds: string[]): number => {
		const main = state.mains.find((m) => m.id === mainId);
		const addOns = state.addOns.filter((a) => addOnIds.includes(a.id));
		return (main?.price || 0) + addOns.reduce((sum, addon) => sum + addon.price, 0);
	};

	const orderTotal = orderItems.reduce((total, item) => total + calculateItemTotal(item.mainId, item.addOnIds), 0);

	const addOrderItem = () => {
		setOrderItems([
			...orderItems,
			{
				id: uuidv4(),
				mainId: '',
				childId: '',
				addOnIds: [],
				orderDate: undefined,
			},
		]);
	};

	const removeOrderItem = (id: string) => {
		setOrderItems(orderItems.filter((item) => item.id !== id));
	};

	const updateOrderItem = (id: string, updates: Partial<OrderItem>) => {
		setOrderItems(orderItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
	};

	const createMealFromOrderItem = (item: OrderItem): Meal => {
		const main = state.mains.find((m) => m.id === item.mainId) as Main;
		const addOns = state.addOns.filter((a) => item.addOnIds.includes(a.id));
		const child = user.children.find((c) => c.id === item.childId) as Child;
		const school = state.schools.find((s) => s.name === child.school)!;

		return {
			id: item.id,
			main,
			addOns,
			child,
			school: {
				id: school.id,
				name: school.name,
				address: school.address,
				isActive: school.isActive,
				deliveryDays: school.deliveryDays,
			},
			orderDate: item.orderDate!.toISOString(),
			total: calculateItemTotal(item.mainId, item.addOnIds),
		};
	};

	const handleSubmitOrder = async () => {
        setIsProcessing(true);
        const functions = getFunctions();
        const saveAdminOrder = httpsCallable(functions, 'saveAdminOrder');
      
        try {
          const meals = orderItems.map(createMealFromOrderItem);
          const order = {
            userId: user.id,
            userEmail: user.email,
            meals,
            total: orderTotal
          };
      
          const result = await saveAdminOrder({ order });
          
          if (result.data) {
            toast.success('Order created successfully');
            setIsProcessing(false);
            onClose();
          }
        } catch (error) {
          setIsProcessing(false);
          console.error('Error creating order:', error);
          toast.error('Failed to create order');
        }
    };

	const isFormValid = () => {
		return orderItems.every((item) => item.mainId && item.childId && item.orderDate) && orderItems.length > 0;
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={onClose}
		>
			<DialogContent className="flex flex-col gap-0 p-0 w-full max-w-3xl h-[90vh]">
				{/* Fixed Header */}
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle>Create Manual Order for {user.displayName}</DialogTitle>
				</DialogHeader>

				{/* Scrollable Content */}
				<div className="flex-1 min-h-0">
					{' '}
					{/* min-h-0 is crucial for nested flex scroll */}
					<ScrollArea className="h-full">
						<div className="px-6 py-4 space-y-4">
							{orderItems.map((item, index) => (
								<Card
									key={item.id}
									className="p-4"
								>
									<div className="flex justify-between items-start mb-4">
										<h4 className="font-semibold">Order Item {index + 1}</h4>
										{orderItems.length > 1 && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeOrderItem(item.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										)}
									</div>

									<div className="space-y-4">
										<div>
											<Label>Main Dish</Label>
											<Select
												value={item.mainId}
												onValueChange={(value) => updateOrderItem(item.id, { mainId: value })}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select main dish" />
												</SelectTrigger>
												<SelectContent>
													{state.mains.map((main) => (
														<SelectItem
															key={main.id}
															value={main.id}
														>
															{main.display} - ${main.price.toFixed(2)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label>Child</Label>
											<Select
												value={item.childId}
												onValueChange={(value) => updateOrderItem(item.id, { childId: value })}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select child" />
												</SelectTrigger>
												<SelectContent>
													{user.children.map((child) => (
														<SelectItem
															key={child.id}
															value={child.id}
														>
															{child.name} ({child.school})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label>Add-ons</Label>
											<div className="space-y-2 mt-2">
												{state.addOns.map((addon) => (
													<div
														key={addon.id}
														className="flex items-center space-x-2"
													>
														<Checkbox
															id={`${item.id}-${addon.id}`}
															checked={item.addOnIds.includes(addon.id)}
															onCheckedChange={(checked) => {
																const newAddOns = checked
																	? [...item.addOnIds, addon.id]
																	: item.addOnIds.filter((id) => id !== addon.id);
																updateOrderItem(item.id, { addOnIds: newAddOns });
															}}
														/>
														<Label htmlFor={`${item.id}-${addon.id}`}>
															{addon.display} - ${addon.price.toFixed(2)}
														</Label>
													</div>
												))}
											</div>
										</div>

										<div className="space-y-2">
											<Label>Delivery Date</Label>
											<div className="border rounded-md p-3">
												<Calendar
													mode="single"
													selected={item.orderDate}
													onSelect={(date) => updateOrderItem(item.id, { orderDate: date })}
													className="w-full"
												/>
											</div>
										</div>
									</div>
								</Card>
							))}

							<Button
								onClick={addOrderItem}
								variant="outline"
								className="w-full"
							>
								<Plus className="h-4 w-4 mr-2" /> Add Another Item
							</Button>
						</div>
					</ScrollArea>
				</div>

				{/* Fixed Footer */}
				<div className="mt-auto border-t">
					<DialogFooter className="p-6">
						<div className="w-full flex justify-between items-center">
							<div className="text-lg font-bold">Order Value: ${orderTotal.toFixed(2)}</div>
							<div className="space-x-2">
								<Button
									variant="outline"
									onClick={onClose}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSubmitOrder}
									disabled={!isFormValid() || isProcessing}
								>
									{isProcessing ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processing...
										</>
									) : (
										'Place Order'
									)}
								</Button>
							</div>
						</div>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ManualOrderDialog;

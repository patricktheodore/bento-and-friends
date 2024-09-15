import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Trash2, Edit2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Meal } from '@/models/order.model';

const Cart: React.FC = () => {
	const { state, dispatch } = useAppContext();
	const { cart, isCartOpen, user } = state;
	const [editingMeal, setEditingMeal] = useState<string | null>(null);
	const [tempChildId, setTempChildId] = useState<string>('');
	const [tempOrderDate, setTempOrderDate] = useState<Date | undefined>(undefined);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const closeCart = () => dispatch({ type: 'TOGGLE_CART' });

	const removeMeal = (mealId: string) => {
		dispatch({ type: 'REMOVE_FROM_CART', payload: mealId });
	};

	const startEditing = (meal: Meal) => {
		setEditingMeal(meal.id);
		setTempChildId(meal.child.id);
		setTempOrderDate(new Date(meal.orderDate));
		setIsDialogOpen(true);
	};

	const updateMeal = () => {
		if (editingMeal && (tempChildId || tempOrderDate)) {
			dispatch({
				type: 'UPDATE_MEAL',
				payload: {
					mealId: editingMeal,
					updates: {
						childId: tempChildId,
						orderDate: tempOrderDate?.toISOString(),
					},
				},
			});
		}
		setEditingMeal(null);
		setIsDialogOpen(false);
	};

	const cancelEdit = () => {
		setEditingMeal(null);
		setIsDialogOpen(false);
	};

	const isWeekday = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	return (
		<Sheet
			open={isCartOpen}
			onOpenChange={closeCart}
		>
			<SheetContent
				side="right"
				className="w-full md:w-[400px]"
			>
				<SheetHeader>
					<SheetTitle>Your Cart</SheetTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={closeCart}
						className="absolute right-4 top-4"
					>
						<X className="h-4 w-4" />
					</Button>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-10rem)] mt-4">
					{cart && cart.meals.length > 0 ? (
						cart.meals.map((meal) => (
							<div
								key={meal.id}
								className="py-4 border-b"
							>
								<h3 className="font-semibold">{meal.main.display}</h3>
								<p className="text-sm text-gray-500">
									{meal.addOns.map((addon) => addon.display).join(', ')}
								</p>
								<p className="text-sm">
									{meal.child.name} - {new Date(meal.orderDate).toLocaleDateString()}
								</p>
								<p className="text-sm font-medium">${meal.total.toFixed(2)}</p>
								<div className="flex justify-end space-x-2 mt-2">
									<Dialog
										open={isDialogOpen}
										onOpenChange={setIsDialogOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => startEditing(meal)}
											>
												<Edit2 className="h-4 w-4 mr-1" /> Edit
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[425px]">
											<DialogHeader>
												<DialogTitle>Edit Order</DialogTitle>
											</DialogHeader>
											<div className="space-y-4 mt-4">
												<div>
													<label className="text-sm font-medium">Child</label>
													<Select
														value={tempChildId}
														onValueChange={setTempChildId}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select a child" />
														</SelectTrigger>
														<SelectContent>
															{user?.children.map((child) => (
																<SelectItem
																	key={child.id}
																	value={child.id}
																>
																	{child.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div>
													<label className="text-sm font-medium">Date</label>
													<Calendar
														mode="single"
														selected={tempOrderDate}
														onSelect={setTempOrderDate}
														disabled={isWeekday}
														className="rounded-md border"
													/>
												</div>
											</div>
											<DialogFooter>
												<Button
													variant="outline"
													onClick={cancelEdit}
												>
													Cancel
												</Button>
												<Button onClick={updateMeal}>OK</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => removeMeal(meal.id)}
									>
										<Trash2 className="h-4 w-4 mr-1" /> Remove
									</Button>
								</div>
							</div>
						))
					) : (
						<p className="text-center py-4">Your cart is empty</p>
					)}
				</ScrollArea>
				{cart && cart.meals.length > 0 && (
					<div className="mt-4">
						<p className="font-semibold text-lg">Total: ${cart.total.toFixed(2)}</p>
						<Button className="w-full mt-2">Proceed to Checkout</Button>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default Cart;

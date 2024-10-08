import React, { useEffect, useState } from 'react';
import { Child, User } from '../models/user.model';
import { PlusIcon } from '@heroicons/react/16/solid';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";

interface ChildrenManagementProps {
    user: User;
    onAddChild: (child: Omit<Child, 'id'>) => void;
    onRemoveChild: (childId: string) => void;
    onEditChild: (childId: string, child: Omit<Child, 'id'>) => void;
}

const allergenOptions = ['Dairy', 'Gluten', 'Soy', 'Eggs', 'Other'];

const ChildrenManagement: React.FC<ChildrenManagementProps> = ({ user, onAddChild, onRemoveChild, onEditChild }) => {
    const { state } = useAppContext();
    const [newChild, setNewChild] = useState<Omit<Child, 'id'>>(new Child());
    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [isChildModalOpen, setIsChildModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [otherAllergen, setOtherAllergen] = useState('');

    useEffect(() => {
        if (editingChild) {
            const allergens = editingChild.allergens ? editingChild.allergens.split(', ') : [];
            const standardAllergens = allergens.filter(a => allergenOptions.includes(a));
            const otherAllergens = allergens.filter(a => !allergenOptions.includes(a));
            
            setSelectedAllergens(standardAllergens);
            if (otherAllergens.length > 0) {
                setSelectedAllergens(prev => [...prev, 'Other']);
                setOtherAllergen(otherAllergens.join(', '));
            } else {
                setOtherAllergen('');
            }
        } else {
            setSelectedAllergens([]);
            setOtherAllergen('');
        }
    }, [editingChild]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (editingChild) {
            setEditingChild({ ...editingChild, [name]: value });
        } else {
            setNewChild((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleAllergenChange = (value: string) => {
        setSelectedAllergens(prev => {
            if (prev.includes(value)) {
                return prev.filter(a => a !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    const getAllergenString = () => {
        const allergens = [...selectedAllergens.filter(a => a !== 'Other')];
        if (selectedAllergens.includes('Other') && otherAllergen) {
            allergens.push(otherAllergen);
        }
        return allergens.join(', ');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const allergens = getAllergenString();
            
            if (editingChild) {
                const updatedChild = {
                    ...editingChild,
                    allergens
                };
                await onEditChild(editingChild.id, updatedChild);
                setEditingChild(null);
                toast.success('Child updated successfully');
            } else {
                const newChildWithAllergens = {
                    ...newChild,
                    allergens
                };
                await onAddChild(newChildWithAllergens);
                setNewChild(new Child());
                toast.success('Child added successfully');
            }
            setIsChildModalOpen(false);
        } catch (error) {
            toast.error('An error occurred while managing the child');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (child: Child) => {
        setEditingChild(child);
        setSelectedAllergens(child.allergens ? child.allergens.split(', ') : []);
        setOtherAllergen('');
        setIsChildModalOpen(true);
    };

    const handleRemoveClick = async () => {
        if (editingChild) {
            setIsLoading(true);
            try {
                await onRemoveChild(editingChild.id);
                setEditingChild(null);
                setIsChildModalOpen(false);
                toast.success('Child removed successfully');
            } catch (error) {
                toast.error('An error occurred while removing the child');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Children</h2>
                <Button
                    onClick={() => {
                        setEditingChild(null);
                        setNewChild(new Child());
                        setSelectedAllergens([]);
                        setOtherAllergen('');
                        setIsChildModalOpen(true);
                    }}
                    className="bg-brand-dark-green text-brand-cream"
                >
                    <PlusIcon className="mr-2 h-4 w-4 text-sm" />
                    Add New Child
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Allergens</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {user.children && user.children.map((child) => (
                            <TableRow
                                key={child.id}
                                className="cursor-pointer"
                                onClick={() => handleEditClick(child)}
                            >
                                <TableCell className="font-medium">{child.name}</TableCell>
                                <TableCell>{child.school}</TableCell>
                                <TableCell>{child.year}</TableCell>
                                <TableCell>{child.className}</TableCell>
                                <TableCell>{child.allergens || 'None'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={isChildModalOpen}
                onOpenChange={(open) => {
                    if (!open && !isLoading) setIsChildModalOpen(false);
                }}
            >
                <DialogContent className={`sm:max-w-[425px] ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}>
                    <DialogHeader>
                        <DialogTitle>{editingChild ? 'Edit Child' : 'Add New Child'}</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="name">Child's Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={editingChild ? editingChild.name : newChild.name}
                                onChange={handleInputChange}
                                placeholder="Enter child's name"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="school">School</Label>
                            <Select
                                onValueChange={(value) => {
                                    if (editingChild) {
                                        setEditingChild({ ...editingChild, school: value });
                                    } else {
                                        setNewChild((prev) => ({ ...prev, school: value }));
                                    }
                                }}
                                value={editingChild ? editingChild.school : newChild.school}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select School" />
                                </SelectTrigger>
                                <SelectContent>
                                    {state.schools.map((school) => (
                                        <SelectItem key={school.id} value={school.name}>
                                            {school.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="year">Year</Label>
                                <Input
                                    id="year"
                                    name="year"
                                    value={editingChild ? editingChild.year : newChild.year}
                                    onChange={handleInputChange}
                                    placeholder="Enter year"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="className">Class</Label>
                                <Input
                                    id="className"
                                    name="className"
                                    value={editingChild ? editingChild.className : newChild.className}
                                    onChange={handleInputChange}
                                    placeholder="Enter class"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="allergens">Allergens / Dietaries</Label>
                            <Select onValueChange={handleAllergenChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Allergens" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allergenOptions.map((allergen) => (
                                        <SelectItem key={allergen} value={allergen}>
                                            {allergen}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedAllergens.map((allergen) => (
                                    <Badge
                                        key={allergen}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => handleAllergenChange(allergen)}
                                    >
                                        {allergen} ✕
                                    </Badge>
                                ))}
                            </div>
                            {selectedAllergens.includes('Other') && (
                                <Input
                                    placeholder="Enter other allergen"
                                    value={otherAllergen}
                                    onChange={(e) => setOtherAllergen(e.target.value)}
                                    className="mt-2"
                                />
                            )}
                        </div>
                        <DialogFooter>
                            {editingChild && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleRemoveClick}
                                    disabled={isLoading}
                                >
                                    Remove Child
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsChildModalOpen(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingChild ? 'Updating...' : 'Adding...'}
                                    </>
                                ) : (
                                    <>{editingChild ? 'Update Child' : 'Add Child'}</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChildrenManagement;
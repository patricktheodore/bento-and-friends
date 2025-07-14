import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAppContext } from "@/context/AppContext"
import { Link } from "react-router-dom"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../firebase"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "./ui/table"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export function UpdateDetailsDialog() {
    const [open, setOpen] = useState(false)
    const { state } = useAppContext()

    const schools = state.schools || []

    useEffect(() => {
        if (state.user && !state.user.hasReviewedTermDetails) {
            setOpen(true)
        }
    }, [state.user])

    const handleClose = async () => {
        if (state.user) {
            // Update the user document in Firestore
            const userRef = doc(db, "users-test2", state.user.id)
            await updateDoc(userRef, {
                hasReviewedTermDetails: true
            })
        }
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Welcome Back!</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        As we prepare for a new school year, please take a moment to ensure we have your details correct. We need correct year and class to enable us to provide the best experience.
                    </DialogDescription>
                </DialogHeader>
                
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Name</TableHead>
                                <TableHead>School</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Class</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {state.user?.children?.map((child) => (
                                <TableRow key={child.id}>
                                    <TableCell className="font-medium">{child.name}</TableCell>
                                    <TableCell>
                                        {child.schoolId ? schools.find(school => school.id === child.schoolId)?.name : '-'}
                                    </TableCell>
                                    <TableCell>{child.isTeacher ? '-' : child.year}</TableCell>
                                    <TableCell>{child.isTeacher ? '-' : child.className}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {state.user?.children?.map((child) => (
                        <Card key={child.id} className="border">
                            <CardContent className="p-4">
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                                        <div className="font-medium text-base mb-2 sm:mb-0">
                                            {child.name}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-medium">School:</span>
                                            <span className="text-right flex-1 ml-2">
                                                {child.schoolId ? schools.find(school => school.id === child.schoolId)?.name : '-'}
                                            </span>
                                        </div>
                                        
                                        {!child.isTeacher && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground font-medium">Year:</span>
                                                    <span className="text-right">{child.year}</span>
                                                </div>
                                                
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground font-medium">Class:</span>
                                                    <span className="text-right">{child.className}</span>
                                                </div>
                                            </>
                                        )}
                                        
                                        {child.isTeacher && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground font-medium">Role:</span>
                                                <span className="text-right">Teacher</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                    <Button
                        className="bg-brand-dark-green text-brand-cream w-full sm:w-auto"
                        onClick={handleClose}
                    >
                        <Link
                            to="/account"
                            className="block w-full"
                        >
                            Update details
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
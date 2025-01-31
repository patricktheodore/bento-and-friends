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

export function UpdateDetailsDialog() {
    const [open, setOpen] = useState(false)
    const { state } = useAppContext()

    useEffect(() => {
        // Check if user exists and hasn't reviewed details for current term
        if (state.user && !state.user.hasReviewedTermDetails) {
            setOpen(true)
        }
    }, [state.user])

    const handleClose = async () => {
        if (state.user) {
            // Update the user document in Firestore
            const userRef = doc(db, "users", state.user.id)
            await updateDoc(userRef, {
                hasReviewedTermDetails: true
            })
        }
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome Back!</DialogTitle>
                    <DialogDescription>
                        As we prepare for a new school year, please take a moment to ensure we have your details correct. We need correct year and class to enable us to provide the best experience.
                    </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border">
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
                                <TableRow
                                    key={child.id}
                                >
                                    <TableCell className="font-medium">{child.name}</TableCell>
                                    <TableCell>{child.school}</TableCell>
                                    <TableCell>{child.isTeacher ? '-' : child.year}</TableCell>
                                    <TableCell>{child.isTeacher ? '-' : child.className}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                <Button
					className="bg-brand-dark-green text-brand-cream"
				>
                    <Link
                        to="/account"
                        onClick={handleClose}
                    >
                        Update details
                    </Link>
				</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
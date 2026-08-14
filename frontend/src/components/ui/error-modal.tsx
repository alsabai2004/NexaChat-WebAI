import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NexaChat WebAI — Connection ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage: string;
}

export default function NexaChat WebAI — Connection ErrorModal({ isOpen, onClose, errorMessage }: NexaChat WebAI — Connection ErrorModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTrigger />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>NexaChat WebAI — Connection Error</DialogTitle>
                    <DialogDescription>{errorMessage}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

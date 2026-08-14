interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    errorMessage: string;
}

export default function ErrorModal({
    isOpen,
    onClose,
    errorMessage,
}: ErrorModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
                <h2 className="mb-3 text-lg font-semibold">
                    Something went wrong
                </h2>

                <p className="mb-5 whitespace-pre-wrap text-sm text-muted-foreground">
                    {errorMessage || 'An unexpected error occurred.'}
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded border px-4 py-2 text-sm"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

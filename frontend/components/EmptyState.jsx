import { File, Upload } from 'lucide-react';

export default function EmptyState({ message, onUploadClick }) {
    return (
        <div className="text-center py-16 px-4 border-2 border-dashed border-muted rounded-lg">
            <File className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No items found</h3>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            {onUploadClick && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <Upload className="-ml-1 mr-2 h-5 w-5" />
                        Upload Video
                    </button>
                </div>
            )}
        </div>
    );
}

export function Loader() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-t-transparent border-current rounded-full animate-spin" />
                </div>
                <p className="text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
}


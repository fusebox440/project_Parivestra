import { Button } from '@/components/ui/button';

export default function EmptyState({ icon, title, subtitle, action }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-transparent p-12 text-center">
            <div className="text-zinc-600">{icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
            {action && action.text && action.onClick && (
                <Button
                    onClick={action.onClick}
                    className="mt-6 bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-500"
                >
                    {action.text}
                </Button>
            )}
        </div>
    );
}

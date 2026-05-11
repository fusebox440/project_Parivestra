"use client";
import { useState, useEffect } from 'react';

const colorMap = {
    purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    green: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
    blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
};

export default function StatCard({ title, value, subtitle, icon, color = 'purple' }) {
    const [displayValue, setDisplayValue] = useState(0);
    const theme = colorMap[color] || colorMap.purple;

    useEffect(() => {
        const endValue = typeof value === 'number' ? value : 0;
        let startTime = null;
        const duration = 1500; // ms

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = Math.floor(progress * endValue);
            setDisplayValue(current);
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <div className={`relative overflow-hidden rounded-xl border bg-zinc-900 p-5 shadow-sm transition-colors hover:bg-zinc-800/50 ${theme.border} border-l-4`}>
            <div className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full ${theme.bg} ${theme.text}`}>
                {icon}
            </div>
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <div className="mt-2">
                <h3 className="text-4xl font-bold text-white">
                    {displayValue.toLocaleString()}
                </h3>
                {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
            </div>
        </div>
    );
}


import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModuleCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    colorClass: string; // e.g., "text-blue-500", "bg-blue-500" logic handled inside
    gradientClass: string;
}

export function ModuleCard({ title, description, href, icon, colorClass, gradientClass }: ModuleCardProps) {
    return (
        <Link href={href} className="group block h-full">
            <div className={cn(
                "relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-white/20 dark:bg-slate-900/40",
            )}>
                {/* Abstract Gradient Background */}
                <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-20",
                    gradientClass
                )} />

                <div className="relative p-6 flex flex-col h-full z-10">
                    <div className={cn(
                        "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-inner backdrop-blur-md transition-transform group-hover:scale-110",
                        colorClass
                    )}>
                        {icon}
                    </div>

                    <h3 className="mb-2 text-xl font-bold tracking-tight text-white group-hover:text-white/90">
                        {title}
                    </h3>

                    <p className="mb-6 text-sm leading-relaxed text-slate-400 group-hover:text-slate-300">
                        {description}
                    </p>

                    <div className="mt-auto flex items-center text-sm font-medium text-white/70 group-hover:text-white">
                        Acessar Módulo
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                </div>
            </div>
        </Link>
    );
}

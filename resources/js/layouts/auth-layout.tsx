// src/layouts/auth-layout.tsx (Halimbawa)

import { PropsWithChildren } from 'react';
// Import 'cn' utility kung ginagamit mo, o alisin kung hindi.
// import { cn } from '@/lib/utils'; 

interface AuthLayoutProps {
    title: string;
    description: string;
    backgroundClass?: string; // ⭐ Dito idine-define ang prop
}

// 1. Tanggapin ang prop
export default function AuthLayout({
    title,
    description,
    backgroundClass, 
    children,
}: PropsWithChildren<AuthLayoutProps>) {
    
    // 2. I-apply ang prop sa pinakalabas na div (Gamit ang Template Literal para safe)
    return (
        // Gumamit ng template literal para isama ang prop sa klase
        <div className={`min-h-screen flex items-center justify-center p-4 ${backgroundClass || ''}`}>
            
            {/* Ang porma ay nasa gitna, may puting background */}
            <div className="mx-auto grid w-full max-w-sm gap-6 p-6 bg-white shadow-xl rounded-lg z-10">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-balance text-muted-foreground">
                        {description}
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
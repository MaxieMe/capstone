// resources/js/Pages/Adoption/RecycleBin.tsx

import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';

type Role = 'user' | 'admin' | 'superadmin';

type TrashUser = {
    id: number;
    name: string;
};

type TrashPet = {
    id: number;
    pet_name: string;
    user?: TrashUser | null;
    gender?: string | null;
    age?: number | null;
    age_unit?: 'months' | 'years' | null;
    category?: 'cat' | 'dog' | string | null;
    breed?: string | null;
    color?: string | null;
    location?: string | null;
    description?: string | null;
    status?: string | null;
    created_at?: string | null;
    deleted_at?: string | null;
    image_url?: string | null;
    age_text?: string | null;
    life_stage?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type AdoptionRecycleBinProps = {
    adoption: {
        data: TrashPet[];
        links: PaginationLink[];
    };
};

const PLACEHOLDER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

export default function AdoptionRecycleBin({ adoption }: AdoptionRecycleBinProps) {
    const page = usePage().props as any;
    const auth = page?.auth ?? {};
    const viewer = auth?.user ?? null;

    const isAdmin: boolean =
        !!viewer && ['admin', 'superadmin'].includes(viewer.role as Role);

    const pets: TrashPet[] = Array.isArray(adoption?.data) ? adoption.data : [];

    const paginationLinks: PaginationLink[] = adoption?.links ?? [];
    const prevLink = paginationLinks.find((l) =>
        l.label.toLowerCase().includes('previous'),
    );
    const nextLink = paginationLinks.find((l) =>
        l.label.toLowerCase().includes('next'),
    );

    const handleRestore = (petId: number) => {
        router.post(
            route('adoption.restore', petId),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleForceDelete = (petId: number) => {
        if (
            !confirm(
                'This will permanently delete this adoption post. This action cannot be undone. Continue?',
            )
        ) {
            return;
        }

        router.delete(route('adoption.forceDelete', petId), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Adoption', href: route('adoption.index') },
                { title: 'Recycle Bin', href: route('adoption.trash') },
            ]}
        >
            <Head title="Adoption Recycle Bin" />

            <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
                {/* Page header */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Recycle Bin
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            These are your soft-deleted items. Restore them or
                            permanently delete if you’re sure you don’t need them.
                        </p>
                    </div>

                    <Link href={route('adoption.index')}>
                        <Button variant="outline">Back to Adoption</Button>
                    </Link>
                </div>

                {/* SECTION TABS / LABELS */}
                <div className="mb-6 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                        🐾 Adoption Posts
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        📷 Manage QR Code
                        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                            (no deleted QR items)
                        </span>
                    </span>
                </div>

                {/* ADOPTION POSTS BIN */}
                <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Adoption Posts
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Deleted adoption posts stay here until permanently
                                removed.
                            </p>
                        </div>
                    </div>

                    {pets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 p-10 text-center dark:border-gray-700">
                            <img
                                src={PLACEHOLDER}
                                alt="Recycle bin empty"
                                className="mb-4 h-24 w-24 rounded-full bg-gray-100 object-contain p-5 dark:bg-gray-800"
                            />
                            <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Recycle Bin is empty
                            </h3>
                            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                                Delete an adoption post to see it here. You can
                                restore or permanently delete posts from this section.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pets.map((pet) => (
                                <div
                                    key={pet.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 transition hover:border-violet-300 hover:bg-violet-50/60 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-violet-500/60 dark:hover:bg-violet-900/10 sm:flex-row sm:items-center"
                                >
                                    <div className="flex items-center gap-4 sm:w-1/2">
                                        <img
                                            src={pet.image_url || PLACEHOLDER}
                                            alt={pet.pet_name}
                                            className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                                            onError={(e) => {
                                                if (e.currentTarget.src !== PLACEHOLDER) {
                                                    e.currentTarget.src = PLACEHOLDER;
                                                }
                                            }}
                                        />
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                {pet.pet_name}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {pet.category
                                                    ? pet.category === 'dog'
                                                        ? 'Dog'
                                                        : pet.category === 'cat'
                                                          ? 'Cat'
                                                          : pet.category
                                                    : 'Unknown type'}
                                                {pet.gender && (
                                                    <>
                                                        {' '}
                                                        •{' '}
                                                        {pet.gender === 'male'
                                                            ? 'Male'
                                                            : pet.gender === 'female'
                                                              ? 'Female'
                                                              : pet.gender}
                                                    </>
                                                )}
                                                {pet.age_text && ` • ${pet.age_text}`}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Posted by{' '}
                                                <span className="font-medium">
                                                    {pet.user?.name ?? 'Unknown user'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center">
                                        <div className="space-y-1">
                                            {pet.location && (
                                                <p>
                                                    <span className="font-semibold">
                                                        Location:
                                                    </span>{' '}
                                                    {pet.location}
                                                </p>
                                            )}
                                            {pet.deleted_at && (
                                                <p>
                                                    <span className="font-semibold">
                                                        Deleted at:
                                                    </span>{' '}
                                                    {new Date(
                                                        pet.deleted_at,
                                                    ).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRestore(pet.id)}
                                                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                                            >
                                                Restore
                                            </button>

                                            {(viewer?.id === pet.user?.id || isAdmin) && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleForceDelete(pet.id)
                                                    }
                                                    className="rounded-xl border border-rose-500 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                                >
                                                    Delete permanently
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination for adoption posts */}
                    {Array.isArray(paginationLinks) &&
                        paginationLinks.length > 0 && (
                            <div className="mt-6 flex items-center justify-between gap-3">
                                {/* Mobile prev/next */}
                                <div className="flex w-full justify-between gap-3 sm:hidden">
                                    <button
                                        disabled={!prevLink?.url}
                                        onClick={() =>
                                            prevLink?.url &&
                                            router.visit(prevLink.url)
                                        }
                                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        disabled={!nextLink?.url}
                                        onClick={() =>
                                            nextLink?.url &&
                                            router.visit(nextLink.url)
                                        }
                                        className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                    >
                                        Next →
                                    </button>
                                </div>

                                {/* Desktop page numbers */}
                                <div className="hidden w-full justify-center gap-2 sm:flex">
                                    {paginationLinks.map((link, index) => (
                                        <Button
                                            key={index}
                                            size="sm"
                                            variant={
                                                link.active ? 'default' : 'outline'
                                            }
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url && router.visit(link.url)
                                            }
                                            className="min-w-[2.25rem]"
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                </section>

                {/* MANAGE QR CODE BIN (placeholder section) */}
                <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
                    <h2 className="mb-1 text-base font-semibold text-gray-800 dark:text-gray-100">
                        Manage QR Code
                    </h2>
                    <p className="mb-1">
                        Currently, there are no QR codes stored in the Recycle Bin.
                    </p>
                    <p className="text-xs">
                        You can manage your Sponsor QR from your profile page. In the
                        future, deleted QR codes can also appear here.
                    </p>
                </section>
            </div>
        </AppLayout>
    );
}

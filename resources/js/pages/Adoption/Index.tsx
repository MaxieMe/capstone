// resources/js/Pages/Adoption/Index.tsx
import { Button } from '@/components/ui/button';
import { CAT_BREEDS, DOG_BREEDS } from '@/components1/breed';
import { useConfirmDialog } from '@/components1/confirm-dialog'; // 🔥 added
import { DisableScroll } from '@/components1/disable-scroll';
import { PlusButton } from '@/components1/plus-button';
import { XButton } from '@/components1/x-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Adoption', href: '/adoption' },
];

const PLACEHOLDER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

type Role = 'user' | 'admin' | 'superadmin';

type ProfileUser = {
    id?: number;
    name?: string;
};

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

type Pet = {
    id: number;
    pet_name: string;
    user?: ProfileUser | null;
    gender?: string;
    age?: number;
    age_unit?: 'months' | 'years';
    category?: 'cat' | 'dog' | string;
    breed?: string | null;
    color?: string;
    location?: string;
    description?: string;
    image_url?: string;
    status?:
        | 'waiting_for_approval'
        | 'available'
        | 'pending'
        | 'adopted'
        | string;
    created_at?: string;
    life_stage?: string | null;
    age_text?: string | null;

    is_approved?: boolean;
};

type GuestUser = {
    id: number;
    name: string;
    cover_url?: string | null;
    available_posts_count?: number;
    total_posts_count?: number;
    featured_pet?: { image_url?: string | null } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type PageProps = {
    adoption: any;
    guestUsers?: { data: GuestUser[]; links: PaginationLink[] } | null;
    filters?: { q?: string; category?: string; gender?: string };
};

export default function Index({ adoption, guestUsers, filters }: PageProps) {
    const page = usePage().props as any;
    const auth = page?.auth ?? {};
    const user = auth?.user ?? null;
    const isAuthenticated = !!user;
    const canPost =
        isAuthenticated &&
        (['user', 'admin', 'superadmin'] as Role[]).includes(
            user?.role as Role,
        );

    const currentUserId = user?.id as number | undefined;

    // confirm dialog hook (same as sponsor/manage)
    const { confirm } = useConfirmDialog(); // 🔥

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);

    const [activeCategory, setActiveCategory] = useState<'All' | 'cat' | 'dog'>(
        (filters?.category as any) || 'All',
    );
    const [activeGender, setActiveGender] = useState<'All' | 'Male' | 'Female'>(
        (filters?.gender
            ? filters.gender.toLowerCase() === 'male'
                ? 'Male'
                : 'Female'
            : 'All') as any,
    );

    // DELETE modal state (type DELETE) 🔥
    const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    // guest search (for guest user directory)
    const guestSearchForm = useForm({ q: filters?.q ?? '' });

    // pets list (used for authenticated view)
    const list: Pet[] = Array.isArray(adoption?.data) ? adoption.data : [];

    const filteredPets = useMemo(() => {
        return list
            .filter((pet) => {
                // Auth: kung ano binigay ng backend (available + pending)
                // Guest: available lang (pero backend na mismo nag fi-filter, extra guard lang)
                const availableOnly = isAuthenticated
                    ? true
                    : (pet.status || '').toLowerCase() === 'available';

                const categoryMatch =
                    activeCategory === 'All' ||
                    (pet.category &&
                        pet.category.toLowerCase() ===
                            activeCategory.toLowerCase());
                const genderMatch =
                    activeGender === 'All' ||
                    (pet.gender &&
                        pet.gender.toLowerCase() ===
                            activeGender.toLowerCase());
                return availableOnly && categoryMatch && genderMatch;
            })
            .sort(
                (a, b) =>
                    new Date(b.created_at || '').getTime() -
                    new Date(a.created_at || '').getTime(),
            );
    }, [list, isAuthenticated, activeCategory, activeGender]);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        transform,
    } = useForm({
        pet_name: '',
        gender: '',
        age: '',
        age_unit: 'months' as 'months' | 'years',
        category: '' as 'cat' | 'dog' | '',
        breed: '',
        custom_breed: '',
        color: '',
        location: '',
        description: '',
        image: null as File | null,
    });

    // full breed list para sa edit logic (for create/edit sa modal)
    const ALL_BREEDS = [...DOG_BREEDS, ...CAT_BREEDS];

    const breedOptions = useMemo(() => {
        if (data.category === 'dog') return DOG_BREEDS;
        if (data.category === 'cat') return CAT_BREEDS;
        return [];
    }, [data.category]);

    const isOwner = (pet: Pet) =>
        !!currentUserId && pet.user?.id === currentUserId;

    const openCreateModal = () => {
        setEditingPet(null);
        reset();
        clearErrors();
        setShowModal(true);
    };

    const openEditModal = (pet: Pet) => {
        setEditingPet(pet);
        clearErrors();

        const existingBreed = pet.breed || '';
        const isInList =
            existingBreed &&
            ALL_BREEDS.includes(existingBreed as (typeof ALL_BREEDS)[number]);

        setData('pet_name', pet.pet_name || '');
        setData('gender', pet.gender || '');
        setData('age', pet.age != null ? String(pet.age) : '');
        setData('age_unit', (pet.age_unit as 'months' | 'years') || 'months');
        setData('category', (pet.category as 'cat' | 'dog' | '') || '');

        setData(
            'breed',
            isInList ? existingBreed : existingBreed ? 'Other / Not Sure' : '',
        );
        setData('custom_breed', !isInList ? existingBreed : '');

        setData('color', pet.color || '');
        setData('location', pet.location || '');
        setData('description', pet.description || '');
        setData('image', null);

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPet(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const finalBreed =
            data.breed === 'Other / Not Sure'
                ? data.custom_breed || 'Other / Not Sure'
                : data.breed;

        if (editingPet) {
            transform((formData) => ({
                ...formData,
                breed: finalBreed,
                _method: 'PUT',
            }));

            post(route('adoption.update', editingPet.id), {
                forceFormData: true,
                onSuccess: () => {
                    handleCloseModal();
                },
            });
        } else {
            transform((formData) => ({
                ...formData,
                breed: finalBreed,
            }));

            post(route('adoption.store'), {
                forceFormData: true,
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    // 🔥 New: confirm dialog for Cancel Pending
    const handleCancelPending = async (pet: Pet) => {
        const ok = await confirm({
            title: 'Cancel Adoption Request',
            message: `Cancel this pending adoption request for ${pet.pet_name}?`,
            confirmText: 'Yes, cancel',
            cancelText: 'No',
            variant: 'warning',
        });

        if (!ok) return;

        router.post(
            route('adoption.cancel', pet.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // 🔥 New: confirm dialog for Confirm/Adopt
    const handleConfirmPending = async (pet: Pet) => {
        const ok = await confirm({
            title: 'Mark as Adopted',
            message: `Mark ${pet.pet_name} as adopted?`,
            confirmText: 'Yes, mark adopted',
            cancelText: 'No',
            variant: 'success',
        });

        if (!ok) return;

        router.post(
            route('adoption.markAdopted', pet.id),
            {},
            { preserveScroll: true },
        );
    };

    // 🔥 Delete modal helpers (type DELETE)
    const openDeleteDialog = (pet: Pet) => {
        setDeleteTarget(pet);
        setDeleteConfirmText('');
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
        setDeleteConfirmText('');
        setDeleteProcessing(false);
    };

    const submitDelete = () => {
        if (!deleteTarget) return;

        setDeleteProcessing(true);

        router.delete(route('adoption.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => setDeleteProcessing(false),
            onSuccess: () => {
                closeDeleteDialog();
            },
        });
    };

    const getName = (u?: ProfileUser | null) =>
        (u?.name && u.name.trim()) || '';

    const visitProfile = (pet: Pet) => {
        const name = getName(pet.user);
        if (name) router.visit(route('profile.show', { name }));
    };

    const prevLink = adoption?.links?.[0];
    const nextLink = adoption?.links?.[adoption?.links?.length - 1];

    // guest directory search submit
    const submitGuestSearch = (e: React.FormEvent) => {
        e.preventDefault();
        guestSearchForm.get(route('adoption.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /* ===================== GUEST VIEW ===================== */
    if (!isAuthenticated) {
        const users: GuestUser[] = Array.isArray(guestUsers?.data)
            ? guestUsers!.data
            : [];

        return (
            <AppLayout
                breadcrumbs={[
                    {
                        title: 'Adoption (Guests)',
                        href: route('adoption.index'),
                    },
                ]}
            >
                <Head title="Browse Owners — Available Pets" />

                {/* Hero */}
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 py-10 sm:py-14 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                    <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                            <span>Browse Users with Available Pets</span>
                        </div>
                        <h1 className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-black text-transparent sm:text-4xl lg:text-5xl">
                            Welcome to PetCare
                        </h1>

                        {/* Search users */}
                        <form
                            onSubmit={submitGuestSearch}
                            className="mx-auto mt-6 max-w-xl"
                        >
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={guestSearchForm.data.q}
                                    onChange={(e) =>
                                        guestSearchForm.setData(
                                            'q',
                                            e.target.value,
                                        )
                                    }
                                    className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                    placeholder="Search name"
                                />
                                <button
                                    type="submit"
                                    disabled={guestSearchForm.processing}
                                    className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    {users.length ? (
                        <>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {users.map((u) => {
                                    const name =
                                        (u.name && u.name.trim()) || '';
                                    return (
                                        <div
                                            key={u.id}
                                            className="group user-card relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800"
                                        >
                                            <div className="relative h-40">
                                                <img
                                                    src={
                                                        u.featured_pet
                                                            ?.image_url ||
                                                        PLACEHOLDER
                                                    }
                                                    alt={u.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    onError={(e) => {
                                                        if (
                                                            e.currentTarget
                                                                .src !==
                                                            PLACEHOLDER
                                                        )
                                                            e.currentTarget.src =
                                                                PLACEHOLDER;
                                                    }}
                                                />
                                                <div className="absolute -bottom-6 left-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 font-bold text-white shadow-lg">
                                                    {u.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ?? 'U'}
                                                </div>
                                            </div>

                                            <div className="p-5 pt-8">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="dark:text:white text-lg font-bold text-gray-900">
                                                            {u.name}
                                                        </h3>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold">
                                                                {u.available_posts_count ??
                                                                    0}
                                                            </span>{' '}
                                                            available
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <Link
                                                        href={route(
                                                            'profile.show',
                                                            { name },
                                                        )}
                                                        className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-center font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-lg"
                                                    >
                                                        Visit Profile
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Users pagination (desktop) */}
                            {Array.isArray(guestUsers?.links) &&
                                guestUsers!.links.length > 0 && (
                                    <div className="mt-8 hidden justify-center gap-2 sm:flex">
                                        {guestUsers!.links.map((link, i) => (
                                            <Button
                                                key={i}
                                                size="sm"
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                disabled={!link.url}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url)
                                                }
                                                className="min-w-[2.5rem]"
                                            >
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            </Button>
                                        ))}
                                    </div>
                                )}
                        </>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600">
                                <span className="text-5xl">🔍</span>
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                                No users found
                            </h3>
                            <p className="mb-6 text-gray-600 dark:text-gray-400">
                                Try a different keyword.
                            </p>
                            <Link
                                href={route('adoption.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
                            >
                                Browse Pets
                            </Link>
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    /* ===================== AUTHENTICATED VIEW ===================== */
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pet Adoption" />

            {/* Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 py-12 sm:py-16 lg:py-20 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                    <h1 className="mb-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-black text-transparent sm:text-5xl lg:text-6xl">
                        Welcome to PetCare
                    </h1>
                </div>
            </div>

            {/* Floating Add Button */}
            {canPost && (
                <button
                    onClick={openCreateModal}
                    className="group fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-8"
                    aria-label="Add adoption post"
                >
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-75 blur-lg transition-opacity group-hover:opacity-100"></div>
                        <div className="relative transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white shadow-2xl transition-all group-hover:scale-110 hover:from-violet-700 hover:to-purple-700">
                            <PlusButton />
                        </div>
                    </div>
                </button>
            )}

            <DisableScroll showModal={showModal} />

            {/* Modal (Create/Edit) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pt-32 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                                        <span className="text-3xl">🐾</span>
                                        {editingPet
                                            ? 'Edit Pet'
                                            : 'Add Pet for Adoption'}
                                    </h2>
                                    <p className="mt-1 text-sm text-violet-100">
                                        {editingPet
                                            ? 'Update the details of your adoption post'
                                            : 'Fill in the details below'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="rounded-full p-2 text-white transition-colors hover:bg-white/20"
                                    aria-label="Close"
                                >
                                    <XButton />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            encType="multipart/form-data"
                            className="space-y-5 p-6"
                        >
                            {/* Pet Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Pet Name{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="pet_name"
                                    value={data.pet_name}
                                    onChange={(e) =>
                                        setData('pet_name', e.target.value)
                                    }
                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                    placeholder="e.g., Fluffy, Max, Bella"
                                    required
                                />
                                {errors.pet_name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.pet_name}
                                    </p>
                                )}
                            </div>

                            {/* Pet Type & Breed */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Pet Type{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={data.category}
                                        onChange={(e) => {
                                            const val = e.target.value as
                                                | 'cat'
                                                | 'dog'
                                                | '';
                                            setData('category', val);
                                            setData('breed', '');
                                            setData('custom_breed', '');
                                        }}
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                        required
                                    >
                                        <option value="">
                                            Select Pet Type
                                        </option>
                                        <option value="cat">🐱 Cat</option>
                                        <option value="dog">🐶 Dog</option>
                                    </select>
                                    {errors.category && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.category}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Breed{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="breed"
                                        value={data.breed}
                                        onChange={(e) =>
                                            setData('breed', e.target.value)
                                        }
                                        disabled={!data.category}
                                        className={`w-full rounded-xl border-2 px-4 py-3 ${
                                            !data.category
                                                ? 'cursor-not-allowed border-gray-200 opacity-70 dark:border-gray-700'
                                                : 'border-gray-200 dark:border-gray-600'
                                        } bg-white transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:bg-gray-700 dark:focus:ring-violet-800`}
                                        required
                                    >
                                        {!data.category ? (
                                            <option value="">
                                                Select pet type first
                                            </option>
                                        ) : (
                                            <>
                                                <option value="">
                                                    {`Select ${
                                                        data.category === 'dog'
                                                            ? 'Dog'
                                                            : 'Cat'
                                                    } Breed`}
                                                </option>
                                                {breedOptions.map(
                                                    (b: string) => (
                                                        <option
                                                            key={b}
                                                            value={b}
                                                        >
                                                            {b}
                                                        </option>
                                                    ),
                                                )}
                                            </>
                                        )}
                                    </select>
                                    {errors.breed && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.breed}
                                        </p>
                                    )}

                                    {data.breed === 'Other / Not Sure' && (
                                        <div className="mt-2">
                                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                                Custom Breed{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.custom_breed}
                                                onChange={(e) =>
                                                    setData(
                                                        'custom_breed',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                                placeholder="Type the breed (e.g. Aspin mix)"

                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Gender{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-4">
                                    {['male', 'female'].map((g) => (
                                        <label key={g} className="flex-1">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={data.gender === g}
                                                onChange={(e) =>
                                                    setData(
                                                        'gender',
                                                        e.target.value,
                                                    )
                                                }
                                                className="peer hidden"
                                            />
                                            <div className="cursor-pointer rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-center font-medium capitalize transition-all peer-checked:border-violet-500 peer-checked:bg-violet-50 peer-checked:text-violet-700 dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-violet-900/30 dark:peer-checked:text-violet-300">
                                                {g === 'male'
                                                    ? '♂️ Male'
                                                    : '♀️ Female'}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.gender && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.gender}
                                    </p>
                                )}
                            </div>

                            {/* Age */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Age <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        name="age"
                                        min={1}
                                        value={data.age}
                                        onChange={(e) =>
                                            setData('age', e.target.value)
                                        }
                                        className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                        placeholder="Enter age"
                                        required
                                    />
                                    <select
                                        name="age_unit"
                                        value={data.age_unit}
                                        onChange={(e) =>
                                            setData(
                                                'age_unit',
                                                e.target.value as
                                                    | 'months'
                                                    | 'years',
                                            )
                                        }
                                        className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                    >
                                        <option value="months">Months</option>
                                        <option value="years">Years</option>
                                    </select>
                                </div>
                                {errors.age && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.age}
                                    </p>
                                )}
                            </div>

                            {/* Color & Location */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Color{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="color"
                                        value={data.color}
                                        onChange={(e) =>
                                            setData('color', e.target.value)
                                        }
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                        placeholder="e.g., Brown, White"
                                        required
                                    />
                                    {errors.color && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.color}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Location{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={data.location}
                                        onChange={(e) =>
                                            setData('location', e.target.value)
                                        }
                                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                        placeholder="e.g., Manila"
                                        required
                                    />
                                    {errors.location && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Description{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                    placeholder="Tell us about this pet's personality, habits, and why they'd make a great companion..."
                                    required
                                />
                                {errors.description && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Pet Photo{' '}
                                    {editingPet
                                        ? '(optional if no change)'
                                        : ''}{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (
                                            e.target.files &&
                                            e.target.files.length > 0
                                        ) {
                                            setData('image', e.target.files[0]);
                                        }
                                    }}
                                    required={!editingPet}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-violet-50 file:px-6 file:py-3 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300"
                                />
                                {errors.image && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? editingPet
                                            ? 'Updating...'
                                            : 'Posting...'
                                        : editingPet
                                          ? 'Update Post'
                                          : 'Post for Adoption'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters (category + gender) */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="rounded-2xl bg-white p-4 shadow-xl sm:p-6 dark:bg-gray-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                            </svg>
                            <span className="font-semibold">Filter Pets:</span>
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row">
                            {/* Category */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    {
                                        label: 'All Pets',
                                        value: 'All',
                                        emoji: '🐾',
                                    },
                                    {
                                        label: 'Cats',
                                        value: 'cat',
                                        emoji: '🐱',
                                    },
                                    {
                                        label: 'Dogs',
                                        value: 'dog',
                                        emoji: '🐶',
                                    },
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() =>
                                            setActiveCategory(f.value as any)
                                        }
                                        className={`rounded-full px-4 py-2 font-semibold transition-all ${
                                            activeCategory === f.value
                                                ? 'scale-105 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <span className="mr-1">{f.emoji}</span>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Gender */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'All', value: 'All' },
                                    { label: 'Male', value: 'Male' },
                                    { label: 'Female', value: 'Female' },
                                ].map((g) => (
                                    <button
                                        key={g.value}
                                        onClick={() =>
                                            setActiveGender(g.value as any)
                                        }
                                        className={`rounded-full px-4 py-2 font-semibold transition-all ${
                                            activeGender === g.value
                                                ? 'scale-105 bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pets Grid */}
            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                {filteredPets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPets.map((pet) => (
                            <div
                                key={pet.id}
                                className="group relative transform overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-800"
                            >
                                {/* Status */}
                                <div className="absolute top-3 right-3 z-10">
                                    {pet.status === 'adopted' && (
                                        <span className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                                            ✓ ADOPTED
                                        </span>
                                    )}
                                    {pet.status === 'pending' && (
                                        <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                                            ⏳ PENDING
                                        </span>
                                    )}
                                    {pet.status === 'waiting_for_approval' && (
                                        <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                                            ⏳ WAITING FOR APPROVAL
                                        </span>
                                    )}
                                    {(pet.status === 'available' ||
                                        !pet.status) && (
                                        <span className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                                            ✨ AVAILABLE
                                        </span>
                                    )}
                                </div>

                                {/* Image */}
                                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-violet-100 to-purple-200 sm:h-64 dark:from-gray-700 dark:to-gray-600">
                                    <img
                                        src={pet.image_url || PLACEHOLDER}
                                        alt={pet.pet_name}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onError={(e) => {
                                            if (
                                                e.currentTarget.src !==
                                                PLACEHOLDER
                                            )
                                                e.currentTarget.src =
                                                    PLACEHOLDER;
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="mb-3 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-sm font-bold text-white shadow-md">
                                            {pet.user?.name
                                                ? pet.user.name
                                                      .charAt(0)
                                                      .toUpperCase()
                                                : 'U'}
                                        </div>
                                        {pet.user?.name ? (
                                            <Link
                                                href={route('profile.show', {
                                                    name:
                                                        pet.user.name ??
                                                        pet.user.name!,
                                                })}
                                                className="truncate text-sm font-semibold text-gray-700 transition-colors hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400"
                                            >
                                                {pet.user.name
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    pet.user.name
                                                        .slice(1)
                                                        .toLowerCase()}
                                            </Link>
                                        ) : (
                                            <span className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Unknown
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="mb-2 truncate text-xl font-extrabold text-gray-900 dark:text-white">
                                        {pet.pet_name}
                                    </h3>

                                    {/* First row: About Me */}
                                    <div className="flex gap-2">
                                        <Link
                                            href={route(
                                                'adoption.show',
                                                pet.id,
                                            )}
                                            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-center font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-lg"
                                        >
                                            About me
                                        </Link>
                                    </div>

                                    {/* Second row: Owner actions */}
                                    {isOwner(pet) && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {pet.status === 'pending' ? (
                                                <>
                                                    {/* Pending → Cancel + Confirm */}
                                                    <button
                                                        onClick={() =>
                                                            handleCancelPending(
                                                                pet,
                                                            )
                                                        }
                                                        className="min-w-[90px] flex-1 rounded-xl border-2 border-amber-500 py-2 text-center text-sm font-semibold text-amber-600 transition-all hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleConfirmPending(
                                                                pet,
                                                            )
                                                        }
                                                        className="min-w-[90px] flex-1 rounded-xl border-2 border-emerald-500 py-2 text-center text-sm font-semibold text-emerald-600 transition-all hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                                                    >
                                                        Confirm
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Adopted or other → Delete only (with modal) */}
                                                    <button
                                                        onClick={() =>
                                                            openDeleteDialog(
                                                                pet,
                                                            )
                                                        }
                                                        className="min-w-[90px] flex-1 rounded-xl border-2 border-rose-500 py-2 text-center text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center">
                        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600">
                            <span className="text-5xl">🔍</span>
                        </div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                            No Pets Found
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Try adjusting your filters.
                        </p>
                        <button
                            onClick={() => {
                                setActiveCategory('All');
                                setActiveGender('All');
                                router.visit(route('adoption.index'));
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Pets Pagination */}
            {Array.isArray(adoption?.links) && adoption.links.length > 0 && (
                <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                    {/* Mobile */}
                    <div className="flex justify-between gap-3 sm:hidden">
                        <button
                            disabled={!prevLink?.url}
                            onClick={() =>
                                prevLink?.url && router.visit(prevLink.url)
                            }
                            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            ← Previous
                        </button>
                        <button
                            disabled={!nextLink?.url}
                            onClick={() =>
                                nextLink?.url && router.visit(nextLink.url)
                            }
                            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-md transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Next →
                        </button>
                    </div>

                    {/* Desktop */}
                    <div className="hidden justify-center gap-2 sm:flex">
                        {adoption.links.map((link: any, i: number) => (
                            <Button
                                key={i}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                className="min-w-[2.5rem]"
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

            {/* 🔥 Delete Pet Dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                        <div className="border-b border-gray-200 px-5 pt-4 pb-3 dark:border-gray-800">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                Delete Adoption Post
                            </h2>
                        </div>

                        <div className="space-y-3 px-5 py-4">
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                                This will permanently delete the adoption post
                                of{' '}
                                <span className="font-semibold">
                                    {deleteTarget.pet_name || 'this pet'}
                                </span>
                                . This action cannot be undone.
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                To confirm, please type{' '}
                                <span className="font-mono font-semibold">
                                    DELETE
                                </span>{' '}
                                in all caps.
                            </p>

                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) =>
                                    setDeleteConfirmText(e.target.value)
                                }
                                placeholder="Type DELETE to confirm"
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                            />

                            <div className="flex justify-end gap-2 border-t border-gray-200 px-0 pt-2 pb-4 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={closeDeleteDialog}
                                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitDelete}
                                    disabled={
                                        deleteProcessing ||
                                        deleteConfirmText.trim() !== 'DELETE'
                                    }
                                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {deleteProcessing
                                        ? 'Deleting...'
                                        : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

import { CAT_BREEDS, DOG_BREEDS } from '@/components1/breed';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components1/confirm-dialog';
import { DisableScroll } from '@/components1/disable-scroll';
import { XButton } from '@/components1/x-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import { route } from 'ziggy-js';

type Role = 'user' | 'admin' | 'superadmin';

type ProfileUser = {
    id: number;
    name: string;
};

type Sponsor = {
    id: number;
    status: 'waiting_for_approval' | 'approved' | 'rejected';
    reject_reason?: string | null;
    qr_url?: string | null;
};

type Pet = {
    id: number;
    pet_name: string;
    user?: ProfileUser | null;
    gender?: string | null;
    age?: number | null;
    age_unit?: 'months' | 'years' | null;
    category?: 'cat' | 'dog' | string | null;
    breed?: string | null;
    color?: string | null;
    location?: string | null;
    description?: string | null;
    image_url?: string | null;
    status?:
        | 'available'
        | 'pending'
        | 'adopted'
        | 'waiting_for_approval'
        | 'rejected'
        | string
        | null;
    created_at?: string | null;
    life_stage?: string | null;
    age_text?: string | null;
    reject_reason?: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedPets = {
    data: Pet[];
    links: PaginationLink[];
};

type FiltersProps = {
    status?: string | null;
    category?: string | null;
};

type PageProps = {
    profile: ProfileUser;
    pets: PaginatedPets;
    sponsor?: Sponsor | null;
    auth?: { user?: any };
    filters?: FiltersProps;
};

const PLACEHOLDER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

export default function ProfileShow({
    profile,
    pets,
    sponsor,
    filters,
}: PageProps) {
    const page = usePage().props as any;
    const auth = page?.auth ?? {};
    const viewer = auth?.user ?? null;

    const isAuthenticated = !!viewer;
    const isOwner = isAuthenticated && viewer.id === profile.id;
    const isAdmin =
        isAuthenticated &&
        ['admin', 'superadmin'].includes(viewer.role as Role);

    const name = (profile.name && profile.name.trim()) || '';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Profile', href: route('profile.index') },
    ];

    // 🔎 Active filters derived from props (query-driven)
    const rawStatus = filters?.status ?? null;
    const rawCategory = filters?.category ?? null;

    const activeCategory: 'All' | 'cat' | 'dog' =
        rawCategory === 'cat' || rawCategory === 'dog' ? rawCategory : 'All';

    const allowedStatuses = [
        'waiting_for_approval',
        'available',
        'pending',
        'adopted',
        'rejected',
    ] as const;

    type StatusFilter = 'All' | (typeof allowedStatuses)[number];

    const activeStatus: StatusFilter = allowedStatuses.includes(
        rawStatus as any,
    )
        ? (rawStatus as StatusFilter)
        : 'All';

    // 🔁 Apply filters by navigating with query string (backend will filter)
    const applyFilters = (
        categoryValue: 'All' | 'cat' | 'dog',
        statusValue: StatusFilter,
    ) => {
        const query: Record<string, any> = {};

        if (categoryValue !== 'All') {
            query.category = categoryValue;
        }
        if (statusValue !== 'All') {
            query.status = statusValue;
        }

        router.get(route('profile.show', { name: profile.name }), query, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    // Pagination helpers (Previous / Next)
    const paginationLinks = pets?.links ?? [];
    const prevLink = paginationLinks.find((l) =>
        l.label.toLowerCase().includes('previous'),
    );
    const nextLink = paginationLinks.find((l) =>
        l.label.toLowerCase().includes('next'),
    );

    const shownPets: Pet[] = Array.isArray(pets?.data) ? pets.data : [];

    /* =================== EDIT PET MODAL STATE =================== */
    const [showModal, setShowModal] = useState(false);
    const [editingPet, setEditingPet] = useState<Pet | null>(null);

    const ALL_BREEDS = [...DOG_BREEDS, ...CAT_BREEDS];

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

    const breedOptions = React.useMemo(() => {
        if (data.category === 'dog') return DOG_BREEDS;
        if (data.category === 'cat') return CAT_BREEDS;
        return [];
    }, [data.category]);

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
        if (!editingPet) return;

        const finalBreed =
            data.breed === 'Other / Not Sure'
                ? data.custom_breed || 'Other / Not Sure'
                : data.breed;

        transform((formData) => ({
            ...formData,
            breed: finalBreed,
            _method: 'PUT',
        }));

        post(route('adoption.update', editingPet.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                handleCloseModal();
            },
        });
    };

    /* =================== SPONSOR QR MODAL =================== */
    const [showSponsorModal, setShowSponsorModal] = useState(false);
    const [showSponsorViewModal, setShowSponsorViewModal] = useState(false);

    const {
        data: sponsorForm,
        setData: setSponsorData,
        post: sponsorPost,
        processing: sponsorProcessing,
        errors: sponsorErrors,
        reset: sponsorReset,
        clearErrors: sponsorClearErrors,
    } = useForm({
        qr: null as File | null,
    });

    const openSponsorModal = () => {
        sponsorClearErrors();
        sponsorReset();
        setShowSponsorModal(true);
    };

    const closeSponsorModal = () => {
        setShowSponsorModal(false);
        sponsorReset();
        sponsorClearErrors();
    };

    const handleSponsorSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        sponsorPost(route('sponsor.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                closeSponsorModal();
            },
        });
    };

    const hasAnyQr = !!sponsor && !!sponsor.qr_url;
    const hasPublicQr =
        !!sponsor && sponsor.status === 'approved' && !!sponsor.qr_url;

    /* =================== ACTIONS (with confirm + delete modal) =================== */

    const { confirm } = useConfirmDialog();

    const [deleteTarget, setDeleteTarget] = useState<Pet | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteProcessing, setDeleteProcessing] = useState(false);

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
            {
                preserveScroll: true,
            },
        );
    };

    const canShowEdit = (pet: Pet) => {
        if (!isOwner) return false;
        return pet.status === 'rejected';
    };

    const sponsorStatusBadge = () => {
        if (!sponsor) return null;
        if (sponsor.status === 'approved') {
            return (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    ✅ Sponsor QR Approved
                </span>
            );
        }
        if (sponsor.status === 'waiting_for_approval') {
            return (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    ⏳ Sponsor QR is waiting for approval
                </span>
            );
        }
        if (sponsor.status === 'rejected') {
            return (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    ⚠️ Sponsor QR rejected
                </span>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${profile.name}'s Profile`} />

            {/* Disable scroll kapag may kahit anong modal */}
            <DisableScroll
                showModal={showModal || showSponsorModal || showSponsorViewModal}
            />

            {/* Header */}
            <div className="relative overflow-hidden py-10 sm:py-14">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur sm:flex-row sm:items-start sm:p-8 dark:bg-gray-800/80">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-3xl font-extrabold text-white shadow-lg sm:h-24 sm:w-24 sm:text-4xl">
                            {profile.name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                                {profile.name}
                            </h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-300">
                                @{name}
                            </p>

                            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                                    {Array.isArray(pets?.data)
                                        ? pets.data.length
                                        : 0}{' '}
                                    posts
                                </span>

                                {/* Sponsor status badge – OWNER ONLY */}
                                {isOwner && sponsorStatusBadge()}
                            </div>
                        </div>

                        {/* Sponsor buttons */}
                        <div className="flex flex-col items-end gap-2">
                            {isOwner ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={openSponsorModal}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:from-violet-700 hover:to-purple-700"
                                    >
                                        {sponsor
                                            ? 'Update Sponsor QR'
                                            : 'Upload Sponsor QR'}
                                    </button>

                                    {hasAnyQr && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSponsorViewModal(true)
                                            }
                                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                                        >
                                            View QR Code
                                        </button>
                                    )}
                                </>
                            ) : (
                                hasPublicQr && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowSponsorViewModal(true)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:from-violet-700 hover:to-purple-700"
                                    >
                                        Sponsor Me
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Pet Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pt-32 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800">
                        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                                        <span className="text-3xl">🐾</span>
                                        Edit Pet
                                    </h2>
                                    <p className="mt-1 text-sm text-violet-100">
                                        Update the details of your adoption post
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
                                    Pet Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="pet_name"
                                    value={data.pet_name}
                                    onChange={(e) =>
                                        setData('pet_name', e.target.value)
                                    }
                                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 transition-all outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-violet-800"
                                    required
                                />
                                {errors.pet_name && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.pet_name}
                                    </p>
                                )}
                            </div>

                            {/* Category & Breed */}
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
                                        <option value="">Select Pet Type</option>
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
                                                {breedOptions.map((b: string) => (
                                                    <option key={b} value={b}>
                                                        {b}
                                                    </option>
                                                ))}
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
                                    Gender <span className="text-red-500">*</span>
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
                                    Pet Photo (optional if no change)
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
                                    {processing ? 'Updating...' : 'Update Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sponsor QR Upload / Update Modal */}
            {showSponsorModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pt-32 backdrop-blur-sm">
                    <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-gray-800">
                        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">
                                    {sponsor
                                        ? 'Update Sponsor QR'
                                        : 'Upload Sponsor QR'}
                                </h2>
                                <button
                                    onClick={closeSponsorModal}
                                    className="rounded-full p-1.5 text-white transition-colors hover:bg-white/20"
                                    aria-label="Close"
                                >
                                    <XButton />
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={handleSponsorSubmit}
                            encType="multipart/form-data"
                            className="space-y-4 p-5"
                        >
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Upload a QR code image that people can scan to
                                send support (e.g., GCash, PayPal, etc.). Your
                                QR will be reviewed by an admin before it
                                becomes visible on your profile.
                            </p>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    QR Image{' '}
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
                                            setSponsorData(
                                                'qr',
                                                e.target.files[0],
                                            );
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-violet-50 file:px-6 file:py-3 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300"
                                    required
                                />
                                {sponsorErrors.qr && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {sponsorErrors.qr}
                                    </p>
                                )}
                            </div>

                            {sponsor &&
                                sponsor.status === 'rejected' &&
                                sponsor.reject_reason && (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-600 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                        <strong>Previous rejection reason:</strong>{' '}
                                        {sponsor.reject_reason}
                                    </div>
                                )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeSponsorModal}
                                    className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sponsorProcessing}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {sponsorProcessing
                                        ? sponsor
                                            ? 'Updating...'
                                            : 'Uploading...'
                                        : sponsor
                                          ? 'Update QR'
                                          : 'Upload QR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FULL-SCREEN QR VIEW MODAL */}
            {showSponsorViewModal &&
                sponsor?.qr_url &&
                (isOwner || sponsor.status === 'approved') && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowSponsorViewModal(false)}
                    >
                        <div
                            className="relative flex max-h-[90vh] max-w-[95vw] flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowSponsorViewModal(false)}
                                className="absolute -top-10 right-0 text-white hover:text-gray-200"
                                aria-label="Close"
                            >
                                <XButton />
                            </button>

                            <h2 className="mb-4 text-center text-lg font-semibold text-white sm:text-xl">
                                Sponsor {profile.name}
                            </h2>

                            <a
                                href={sponsor.qr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                title="Open QR code in a new tab"
                            >
                                <img
                                    src={sponsor.qr_url}
                                    alt="Sponsor QR code"
                                    className="max-h-[80vh] max-w-[90vw] rounded-2xl bg-white object-contain shadow-2xl"
                                />
                            </a>

                            <p className="mt-4 max-w-md text-center text-xs text-gray-200 sm:text-sm">
                                Tap or click the QR code to open it in a new
                                tab, or scan it directly using your camera or
                                payment app.
                            </p>

                            {isOwner && sponsor.status !== 'approved' && (
                                <p className="mt-2 max-w-md text-center text-[11px] text-amber-200 sm:text-xs">
                                    This QR is still not approved yet, so only
                                    you can see it for now.
                                </p>
                            )}
                        </div>
                    </div>
                )}

            {/* Filters */}
            <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
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
                            <span className="font-semibold">Filter Posts:</span>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            {/* Category buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'All', value: 'All' as const },
                                    { label: 'Cats', value: 'cat' as const },
                                    { label: 'Dogs', value: 'dog' as const },
                                ].map((c) => (
                                    <button
                                        key={c.value}
                                        onClick={() =>
                                            applyFilters(
                                                c.value,
                                                activeStatus,
                                            )
                                        }
                                        className={`rounded-full px-4 py-2 font-semibold transition-all ${
                                            activeCategory === c.value
                                                ? 'scale-105 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>

                            {/* Status buttons */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'All', value: 'All' as StatusFilter },
                                    {
                                        label: 'Waiting for Approval',
                                        value: 'waiting_for_approval' as StatusFilter,
                                    },
                                    {
                                        label: 'Available',
                                        value: 'available' as StatusFilter,
                                    },
                                    {
                                        label: 'Pending',
                                        value: 'pending' as StatusFilter,
                                    },
                                    {
                                        label: 'Adopted',
                                        value: 'adopted' as StatusFilter,
                                    },
                                    {
                                        label: 'Rejected',
                                        value: 'rejected' as StatusFilter,
                                    },
                                ].map((s) => (
                                    <button
                                        key={s.value}
                                        onClick={() =>
                                            applyFilters(
                                                activeCategory,
                                                s.value,
                                            )
                                        }
                                        className={`rounded-full px-4 py-2 font-semibold transition-all ${
                                            activeStatus === s.value
                                                ? 'scale-105 bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pets Grid */}
            <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
                {shownPets.length ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {shownPets.map((pet) => (
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

                                {/* Rejected notice – owner only */}
                                {isOwner && pet.status === 'rejected' && (
                                    <div className="absolute top-12 right-3 left-3 z-10 rounded-xl border border-red-300 bg-red-50 px-3 py-2 dark:border-red-700 dark:bg-red-900/20">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                                            <span>⚠️ Post Rejected</span>
                                        </div>
                                        <p className="mt-1 text-xs text-red-700/90 dark:text-red-200">
                                            {pet.reject_reason &&
                                            pet.reject_reason.trim() !== ''
                                                ? pet.reject_reason
                                                : 'Your post was rejected by an administrator. Please review your information and try again.'}
                                        </p>
                                    </div>
                                )}

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
                                            {profile.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <Link
                                            href={route('profile.show', {
                                                name,
                                            })}
                                            className="truncate text-sm font-semibold text-gray-700 transition-colors hover:text-violet-600 dark:text-gray-300 dark:hover:text-violet-400"
                                        >
                                            {profile.name}
                                        </Link>
                                    </div>

                                    <h3 className="mb-2 truncate text-xl font-extrabold text-gray-900 dark:text-white">
                                        {pet.pet_name}
                                    </h3>

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

                                    {isOwner && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {pet.status === 'pending' ? (
                                                <>
                                                    <button
                                                        type="button"
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
                                                        type="button"
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
                                                    {canShowEdit(pet) && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    pet,
                                                                )
                                                            }
                                                            className="min-w-[90px] flex-1 rounded-xl border-2 border-blue-500 py-2 text-center text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
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
                            <span className="text-5xl">😺</span>
                        </div>
                        <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                            No post yet
                        </h3>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            {isOwner
                                ? 'Start by posting a pet for adoption.'
                                : 'This user has no public posts.'}
                        </p>
                        <Link
                            href={route('adoption.index')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700"
                        >
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
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Back to Adoption
                        </Link>
                    </div>
                )}
            </div>

            {/* Posts Pagination */}
            {Array.isArray(pets?.links) && pets.links.length > 0 && (
                <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                    {/* Mobile: Previous / Next */}
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

                    {/* Desktop: numbered buttons */}
                    <div className="hidden justify-center gap-2 sm:flex">
                        {pets.links.map((link, i) => (
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

            {/* Delete Pet Dialog */}
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

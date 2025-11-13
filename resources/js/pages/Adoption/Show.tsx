import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type ProfileUser = {
    id?: number;
    name?: string;
    email?: string | null;
};

type SponsorInfo = {
    id: number;
    status: 'waiting_for_approval' | 'approved' | 'rejected';
    reject_reason?: string | null;
    qr_url?: string | null;
};

type Pet = {
    id: number;
    pet_name: string;
    user?: ProfileUser | null;
    gender?: 'male' | 'female' | string;
    age?: number | null;
    age_unit?: 'months' | 'years' | null;
    category?: 'cat' | 'dog' | string | null;
    breed?: string | null;
    color?: string | null;
    location?: string | null;
    description?: string | null;
    image_url?: string | null;
    status?: 'submitted' | 'available' | 'pending' | 'adopted' | string | null;
    created_at?: string | null;
    life_stage?: string | null; // optional from backend
    age_text?: string | null; // optional from backend
    sponsor?: SponsorInfo | null;
};

const PLACEHOLDER =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="64" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20" font-family="system-ui">No Photo Available</text></svg>';

function ageText(age?: number | null, unit?: string | null) {
    if (age == null) return 'N/A';
    const u = unit || 'years';
    const label =
        u === 'months'
            ? age === 1
                ? 'month'
                : 'months'
            : age === 1
              ? 'year'
              : 'years';
    return `${age} ${label}`;
}

function computeLifeStage(
    category?: string | null,
    age?: number | null,
    unit?: string | null,
) {
    if (!category || age == null) return null;
    const months = (unit === 'months' ? age : (age || 0) * 12) as number;
    const type = (category || '').toLowerCase();
    if (type === 'dog') {
        if (months < 6) return 'Puppy';
        if (months < 9) return 'Junior';
        if (months < 78) return 'Adult';
        if (months < 117) return 'Mature';
        if (months < 156) return 'Senior';
        return 'Geriatric';
    }
    if (type === 'cat') {
        if (months < 6) return 'Kitten';
        if (months < 24) return 'Junior';
        if (months < 72) return 'Prime';
        if (months < 120) return 'Mature';
        if (months < 168) return 'Senior';
        return 'Geriatric';
    }
    return null;
}

const getName = (u?: ProfileUser | null) => (u?.name && u.name.trim()) || '';

export default function Show({ pet }: { pet: Pet }) {
    // ====== Auth / Ownership ======
    const { props } = usePage();
    const currentUserId = (props as any)?.auth?.user?.id as number | undefined;
    const isOwner = !!currentUserId && pet.user?.id === currentUserId;
    const sponsor = pet.sponsor ?? null;
    const [showSponsorViewModal, setShowSponsorViewModal] = useState(false);

    // ====== State for Adoption Inquiry modal (IMPROVED FORM) ======
    const [isInquiryOpen, setInquiryOpen] = useState(false);
    const {
        data: inquiryData,
        setData: setInquiryData,
        post: postInquiry,
        processing: inquiryProcessing,
        reset: resetInquiry,
        errors: inquiryErrors,
    } = useForm({
        name: '',
        email: '',
        phone: '',
        visit_at: '', // datetime-local (Date of Visitation and Time)
        location: '', // Meet up or location
        message: '', // optional notes
    });

    // ====== State for Sponsorship modal ======
    const [isSponsorshipOpen, setSponsorshipOpen] = useState(false);
    const {
        data: sponsorshipData,
        setData: setSponsorshipData,
        post: postSponsorship,
        processing: sponsorshipProcessing,
        reset: resetSponsorship,
        errors: sponsorshipErrors,
    } = useForm({
        name_s: '',
        email_s: '',
        phone_s: '',
        message_s: '',
    });

    // Handlers
    const handleInquirySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postInquiry(route('adoption.inquire', pet.id), {
            preserveScroll: true,
            onSuccess: () => {
                resetInquiry();
                setInquiryOpen(false);
            },
        });
    };

    const handleSponsorshipSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postSponsorship(route('adoption.sponsor', pet.id), {
            onSuccess: () => {
                resetSponsorship();
                setSponsorshipOpen(false);
            },
        });
    };

    // Derived data
    const safeImage = pet.image_url || PLACEHOLDER;
    const lifeStage =
        pet.life_stage ||
        computeLifeStage(pet.category, pet.age ?? null, pet.age_unit ?? null) ||
        'Unknown';
    const postedBy = pet.user?.name
        ? pet.user.name.charAt(0).toUpperCase() +
          pet.user.name.slice(1).toLowerCase()
        : 'Unknown';

    const profileHref = useMemo(() => {
        const name = getName(pet.user);
        return name ? route('profile.show', name) : undefined;
    }, [pet.user]);

    const statusBadge = (s?: string | null) =>
        s === 'available'
            ? 'bg-emerald-500'
            : s === 'pending'
              ? 'bg-amber-500'
              : s === 'adopted'
                ? 'bg-gray-500'
                : 'bg-slate-400';

    // Dynamic icon based on category
    const categoryIcon =
        (pet.category || '').toLowerCase() === 'cat' ? '🐱' : '🐶';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Adoption', href: route('adoption.index') },
                { title: pet.pet_name, href: '' },
            ]}
        >
            <Head title={`${pet.pet_name} - Available for Adoption`} />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
                {/* Status badge */}
                <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
                    {pet.status === 'adopted' && (
                        <span className="inline-flex animate-pulse items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-xs font-bold text-white shadow-2xl sm:px-6 sm:py-3 sm:text-sm">
                            <svg
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            ADOPTED
                        </span>
                    )}
                    {pet.status === 'pending' && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-2xl sm:px-6 sm:py-3 sm:text-sm">
                            <svg
                                className="h-4 w-4 animate-spin sm:h-5 sm:w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            PENDING
                        </span>
                    )}
                    {(!pet.status || pet.status === 'available') && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-2xl sm:px-6 sm:py-3 sm:text-sm">
                            <svg
                                className="h-4 w-4 sm:h-5 sm:w-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            AVAILABLE
                        </span>
                    )}
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex min-h-screen items-center justify-center p-4 py-16 sm:p-6 sm:py-20 lg:p-8">
                    <div className="w-full max-w-7xl">
                        {/* Back Button */}
                        <Link
                            href={route('adoption.index')}
                            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-gray-700 shadow-lg transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-xl sm:mb-8 sm:px-6 sm:py-3 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            <span className="hidden sm:inline">
                                Back to Adoption
                            </span>
                            <span className="sm:hidden">Back</span>
                        </Link>

                        {/* Card Container */}
                        <div className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2 lg:gap-8 dark:bg-gray-800">
                            {/* Image Section */}
                            <div className="relative flex min-h-[400px] items-center justify-center bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 p-6 sm:p-8 lg:min-h-[600px] lg:p-10 dark:from-gray-700 dark:via-purple-900/30 dark:to-gray-700">
                                <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-pink-300 opacity-30 blur-2xl dark:bg-pink-600"></div>
                                <div className="absolute right-10 bottom-10 h-40 w-40 rounded-full bg-purple-300 opacity-30 blur-2xl dark:bg-purple-600"></div>
                                <div className="relative z-10 flex h-full w-full items-center justify-center">
                                    <img
                                        src={safeImage}
                                        alt={pet.pet_name}
                                        onError={(e) => {
                                            if (
                                                e.currentTarget.src !==
                                                PLACEHOLDER
                                            )
                                                e.currentTarget.src =
                                                    PLACEHOLDER;
                                        }}
                                        className="h-auto max-h-[500px] w-auto max-w-full transform rounded-2xl object-contain shadow-2xl transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                                {/* Owner Info */}
                                <div className="mb-6 flex items-center gap-3 sm:mb-8">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-xl font-bold text-white shadow-xl sm:h-14 sm:w-14 sm:text-2xl">
                                        {pet.user?.name
                                            ? pet.user.name
                                                  .charAt(0)
                                                  .toUpperCase()
                                            : 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                                            Posted by
                                        </p>
                                        {profileHref ? (
                                            <Link
                                                href={profileHref}
                                                className="text-lg font-bold text-violet-600 transition-colors hover:text-violet-700 sm:text-xl dark:text-violet-400 dark:hover:text-violet-300"
                                            >
                                                {postedBy}
                                            </Link>
                                        ) : (
                                            <span className="text-lg font-bold text-gray-700 sm:text-xl dark:text-gray-300">
                                                {postedBy}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Pet Name */}
                                <h1 className="mb-6 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-4xl leading-tight font-black text-transparent sm:mb-8 sm:text-5xl lg:text-6xl">
                                    {pet.pet_name}
                                </h1>

                                {/* Details */}
                                <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
                                    {/* Gender */}
                                    <div className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 p-3 transition-all hover:shadow-lg sm:gap-4 sm:p-4 dark:from-gray-700 dark:to-purple-900/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-purple-700">
                                            <span className="text-xl sm:text-2xl">
                                                {pet.gender === 'male'
                                                    ? '♂️'
                                                    : '♀️'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-purple-600 sm:text-sm dark:text-purple-400">
                                                Gender
                                            </p>
                                            <p className="text-base font-bold text-gray-900 capitalize sm:text-lg dark:text-white">
                                                {pet.gender}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Age & Stage */}
                                    <div className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 p-3 transition-all hover:shadow-lg sm:gap-4 sm:p-4 dark:from-gray-700 dark:to-pink-900/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-pink-700">
                                            <span className="text-xl sm:text-2xl">
                                                🎂
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-pink-600 sm:text-sm dark:text-pink-400">
                                                Age & Life Stage
                                            </p>
                                            <p className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                                                {pet.age_text ||
                                                    ageText(
                                                        pet.age ?? null,
                                                        pet.age_unit ?? null,
                                                    )}{' '}
                                                • {lifeStage}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Breed */}
                                    <div className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 p-3 transition-all hover:shadow-lg sm:gap-4 sm:p-4 dark:from-gray-700 dark:to-indigo-900/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-indigo-700">
                                            <span className="text-xl sm:text-2xl">
                                                {categoryIcon}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-indigo-600 sm:text-sm dark:text-indigo-400">
                                                Breed
                                            </p>
                                            <p className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                                                {pet.breed || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Color */}
                                    <div className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 p-3 transition-all hover:shadow-lg sm:gap-4 sm:p-4 dark:from-gray-700 dark:to-orange-900/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-orange-700">
                                            <span className="text-xl sm:text-2xl">
                                                🎨
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-orange-600 sm:text-sm dark:text-orange-400">
                                                Color
                                            </p>
                                            <p className="text-base font-bold text-gray-900 capitalize sm:text-lg dark:text-white">
                                                {pet.color || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-3 transition-all hover:shadow-lg sm:gap-4 sm:p-4 dark:from-gray-700 dark:to-blue-900/30">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-blue-700">
                                            <span className="text-xl sm:text-2xl">
                                                📍
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-blue-600 sm:text-sm dark:text-blue-400">
                                                Location
                                            </p>
                                            <p className="text-base font-bold text-gray-900 sm:text-lg dark:text-white">
                                                {pet.location || '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="group rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 transition-all hover:shadow-lg sm:p-5 dark:from-gray-700 dark:to-green-900/30">
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-200 transition-transform group-hover:scale-110 sm:h-12 sm:w-12 dark:bg-green-700">
      <span className="text-xl sm:text-2xl">
        📝
      </span>
    </div>

    <div className="min-w-0 flex-1">
      <p className="mb-2 text-xs font-semibold text-green-600 sm:text-sm dark:text-green-400">
        Description
      </p>

      {/* Scrollable container for long text */}
      <div className="max-h-40 overflow-y-auto pr-1">
        <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300 whitespace-pre-wrap break-words">
          {pet.description || 'No description provided.'}
        </p>
      </div>
    </div>
  </div>
</div>

                                </div>

                                {/* Call to Action Buttons (hidden if owner) */}
                                {!isOwner && (
                                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                                        {/* ADOPT ME → only when AVAILABLE */}
                                        {pet.status === 'available' && (
                                            <button
                                                onClick={() =>
                                                    setInquiryOpen(true)
                                                }
                                                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-500 px-6 py-3 text-center font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-blue-600 hover:shadow-2xl sm:px-8 sm:py-4"
                                            >
                                                Adopt me
                                            </button>
                                        )}

                                        {/* SPONSOR ME → only if may public QR (approved) */}
                                        {sponsor &&
                                            sponsor.status === 'approved' &&
                                            sponsor.qr_url && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowSponsorViewModal(
                                                            true,
                                                        )
                                                    }
                                                    className="flex-1 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-center font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-pink-600 hover:to-rose-600 hover:shadow-2xl sm:px-8 sm:py-4"
                                                >
                                                    Sponsor me
                                                </button>
                                            )}
                                    </div>
                                )}

                                {/* Info Box for Adoption Ready — ONLY when NOT owner */}
                                {!isOwner && pet.status === 'available' && (
                                    <div className="mt-6 rounded-2xl border-2 border-violet-200 bg-violet-50 p-4 sm:mt-8 dark:border-violet-800 dark:bg-violet-900/20">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-violet-200 dark:bg-violet-800">
                                                <svg
                                                    className="h-4 w-4 text-violet-600 dark:text-violet-300"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-xs text-violet-700 sm:text-sm dark:text-violet-300">
                                                <strong>Ready to adopt?</strong>{' '}
                                                Contact the owner to learn more
                                                about {pet.pet_name} and start the
                                                adoption process.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== Modal: Adoption Inquiry (IMPROVED) ===== */}
                {isInquiryOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold">
                                    Adoption Inquiry
                                </h2>
                                <button
                                    onClick={() => setInquiryOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <form
                                onSubmit={handleInquirySubmit}
                                className="space-y-3"
                            >
                                {/* Your Name */}
                                <div>
                                    <label className="text-sm">Your Name</label>
                                    <input
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        placeholder="Juan Dela Cruz"
                                        value={inquiryData.name}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {inquiryErrors.name && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.name}
                                        </div>
                                    )}
                                </div>

                                {/* Your Email */}
                                <div>
                                    <label className="text-sm">
                                        Your Email
                                    </label>
                                    <input
                                        type="email"
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        placeholder="you@example.com"
                                        value={inquiryData.email}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {inquiryErrors.email && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.email}
                                        </div>
                                    )}
                                </div>

                                {/* Contact */}
                                <div>
                                    <label className="text-sm">Contact</label>
                                    <input
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        placeholder="09xx-xxx-xxxx"
                                        value={inquiryData.phone}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'phone',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {inquiryErrors.phone && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Date of Visitation & Time */}
                                <div>
                                    <label className="text-sm">
                                        Date of Visitation and Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        value={inquiryData.visit_at}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'visit_at',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {inquiryErrors.visit_at && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.visit_at}
                                        </div>
                                    )}
                                </div>

                                {/* Meet up or location */}
                                <div>
                                    <label className="text-sm">
                                        Your Location
                                    </label>
                                    <input
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        placeholder="Ex: Tanay, San Isidro"
                                        value={inquiryData.location}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'location',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {inquiryErrors.location && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.location}
                                        </div>
                                    )}
                                </div>

                                {/* Extra notes */}
                                <div>
                                    <label className="text-sm">Message</label>
                                    <textarea
                                        className="mt-1 w-full rounded-lg border px-3 py-2"
                                        rows={4}
                                        placeholder={`Any questions or requirements about meeting ${pet.pet_name}?`}
                                        value={inquiryData.message}
                                        onChange={(e) =>
                                            setInquiryData(
                                                'message',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    {inquiryErrors.message && (
                                        <div className="mt-1 text-xs text-rose-600">
                                            {inquiryErrors.message}
                                        </div>
                                    )}
                                </div>

                                {/* Submit */}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setInquiryOpen(false)}
                                        className="rounded-lg border px-3 py-2"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={inquiryProcessing}
                                        className="rounded-lg bg-violet-600 px-4 py-2 text-white"
                                    >
                                        {inquiryProcessing
                                            ? 'Sending…'
                                            : 'Send Inquiry'}
                                    </button>
                                </div>

                                <p className="mt-2 text-[11px] text-gray-500">
                                    Tip: Bring a valid ID during visitation and
                                    arrive 10 minutes early. Thank you!
                                </p>
                            </form>
                        </div>
                    </div>
                )}

                {/* FULL-SCREEN QR VIEW MODAL – same style as Profile/Show */}
                {showSponsorViewModal && sponsor?.qr_url && (
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
                                ✕
                            </button>

                            <h2 className="mb-4 text-center text-lg font-semibold text-white sm:text-xl">
                                Sponsor {pet.user?.name || 'this owner'}
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
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

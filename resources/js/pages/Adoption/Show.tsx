import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { route } from 'ziggy-js';

type ProfileUser = {
  id?: number;
  name?: string;
  email?: string | null;
};

type Pet = {
  id: number;
  pname: string;
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
  life_stage?: string | null;   // optional from backend
  age_text?: string | null;     // optional from backend
};

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="64" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20" font-family="system-ui">No Photo Available</text></svg>';

function ageText(age?: number | null, unit?: string | null) {
  if (age == null) return 'N/A';
  const u = unit || 'years';
  const label =
    u === 'months' ? (age === 1 ? 'month' : 'months') : age === 1 ? 'year' : 'years';
  return `${age} ${label}`;
}

function computeLifeStage(category?: string | null, age?: number | null, unit?: string | null) {
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
    visit_at: '',          // datetime-local (Date of Visitation and Time)
    meetup_location: '',   // Meet up or location
    message: '',           // optional notes
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
    ? pet.user.name.charAt(0).toUpperCase() + pet.user.name.slice(1).toLowerCase()
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
    (pet.category || '').toLowerCase() === 'cat'
      ? '🐱'
      : '🐶';

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Adoption', href: route('adoption.index') },
        { title: pet.pname, href: '' },
      ]}
    >
      <Head title={`${pet.pname} - Available for Adoption`} />

      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 relative overflow-hidden">
        {/* Status badge */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          {pet.status === 'adopted' && (
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl text-xs sm:text-sm animate-pulse">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
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
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl text-xs sm:text-sm">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              PENDING
            </span>
          )}
          {(!pet.status || pet.status === 'available') && (
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl text-xs sm:text-sm">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AVAILABLE
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 py-16 sm:py-20">
          <div className="w-full max-w-7xl">
            {/* Back Button */}
            <Link
              href={route('adoption.index')}
              className="inline-flex items-center gap-2 mb-6 sm:mb-8 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Adoption</span>
              <span className="sm:hidden">Back</span>
            </Link>

            {/* Card Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Image Section */}
              <div className="relative bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 dark:from-gray-700 dark:via-purple-900/30 dark:to-gray-700 p-6 sm:p-8 lg:p-10 flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
                <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300 dark:bg-pink-600 rounded-full opacity-30 blur-2xl"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300 dark:bg-purple-600 rounded-full opacity-30 blur-2xl"></div>
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <img
                    src={safeImage}
                    alt={pet.pname}
                    onError={(e) => {
                      if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                    }}
                    className="max-w-full max-h-[500px] w-auto h-auto rounded-2xl shadow-2xl object-contain transform hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
                {/* Owner Info */}
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 rounded-full text-white font-bold text-xl sm:text-2xl shadow-xl">
                    {pet.user?.name ? pet.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Posted by</p>
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-lg sm:text-xl transition-colors"
                      >
                        {postedBy}
                      </Link>
                    ) : (
                      <span className="font-bold text-gray-700 dark:text-gray-300 text-lg sm:text-xl">{postedBy}</span>
                    )}
                  </div>
                </div>

                {/* Pet Name */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 sm:mb-8 leading-tight">
                  {pet.pname}
                </h1>

                {/* Details */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {/* Gender */}
                  <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-700 dark:to-purple-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-purple-200 dark:bg-purple-700 rounded-xl group-hover:scale-110 transition-transform">
                      <span className="text-xl sm:text-2xl">{pet.gender === 'male' ? '♂️' : '♀️'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-semibold">Gender</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {pet.gender}
                      </p>
                    </div>
                  </div>

                  {/* Age & Stage */}
                  <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-700 dark:to-pink-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-pink-200 dark:bg-pink-700 rounded-xl group-hover:scale-110 transition-transform">
                      <span className="text-xl sm:text-2xl">🎂</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 font-semibold">Age & Life Stage</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {pet.age_text || ageText(pet.age ?? null, pet.age_unit ?? null)} • {lifeStage}
                      </p>
                    </div>
                  </div>

                  {/* Breed */}
                  <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-indigo-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-indigo-200 dark:bg-indigo-700 rounded-xl group-hover:scale-110 transition-transform">
                      <span className="text-xl sm:text-2xl">{categoryIcon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-semibold">Breed</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{pet.breed || '—'}</p>
                    </div>
                  </div>

                  {/* Color */}
                  <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-orange-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-orange-200 dark:bg-orange-700 rounded-xl group-hover:scale-110 transition-transform">
                      <span className="text-xl sm:text-2xl">🎨</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-semibold">Color</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white capitalize">{pet.color || '—'}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-blue-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-200 dark:bg-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                      <span className="text-xl sm:text-2xl">📍</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold">Location</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{pet.location || '—'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="group p-4 sm:p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-green-900/30 rounded-2xl transition-all hover:shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-green-200 dark:bg-green-700 rounded-xl group-hover:scale-110 transition-transform flex-shrink-0">
                        <span className="text-xl sm:text-2xl">📝</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-semibold mb-2">Description</p>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                          {pet.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action Buttons (hidden if owner) */}
{!isOwner && (
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
    {/* ADOPT ME → only when AVAILABLE */}
    {pet.status === 'available' && (
      <button
        onClick={() => setInquiryOpen(true)}
        className="flex-1 text-center bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
      >
        Adopt me
      </button>
    )}

    {/* SPONSOR ME → always shown for non-owners */}
    <button
      onClick={() => setSponsorshipOpen(true)}
      className="flex-1 text-center bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
    >
      Sponsor me
    </button>
  </div>
)}

                {/* Info Box for Adoption Ready — ONLY when NOT owner */}
                {!isOwner && pet.status === 'available' && (
                  <div className="mt-6 sm:mt-8 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border-2 border-violet-200 dark:border-violet-800">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center bg-violet-200 dark:bg-violet-800 rounded-lg flex-shrink-0">
                        <svg className="w-4 h-4 text-violet-600 dark:text-violet-300" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-xs sm:text-sm text-violet-700 dark:text-violet-300">
                        <strong>Ready to adopt?</strong> Contact the owner to learn more about {pet.pname} and start the
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Adoption Inquiry</h2>
                <button onClick={() => setInquiryOpen(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              <form onSubmit={handleInquirySubmit} className="space-y-3">
                {/* Your Name */}
                <div>
                  <label className="text-sm">Your Name</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="Juan Dela Cruz"
                    value={inquiryData.name}
                    onChange={(e) => setInquiryData('name', e.target.value)}
                    required
                  />
                  {inquiryErrors.name && (
                    <div className="text-xs text-rose-600 mt-1">{inquiryErrors.name}</div>
                  )}
                </div>

                {/* Your Email */}
                <div>
                  <label className="text-sm">Your Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="you@example.com"
                    value={inquiryData.email}
                    onChange={(e) => setInquiryData('email', e.target.value)}
                    required
                  />
                  {inquiryErrors.email && (
                    <div className="text-xs text-rose-600 mt-1">{inquiryErrors.email}</div>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <label className="text-sm">Contact</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="09xx-xxx-xxxx"
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData('phone', e.target.value)}
                  />
                  {inquiryErrors.phone && (
                    <div className="text-xs text-rose-600 mt-1">{inquiryErrors.phone}</div>
                  )}
                </div>

                {/* Date of Visitation & Time */}
                <div>
                  <label className="text-sm">Date of Visitation and Time</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={inquiryData.visit_at}
                    onChange={(e) => setInquiryData('visit_at', e.target.value)}
                    required
                  />
                  {inquiryErrors.visit_at && (
                    <div className="text-xs text-rose-600 mt-1">{inquiryErrors.visit_at}</div>
                  )}
                </div>

                {/* Meet up or location */}
                <div>
                  <label className="text-sm">Meet up or Location</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="Ex: SM Valenzuela, main entrance"
                    value={inquiryData.meetup_location}
                    onChange={(e) => setInquiryData('meetup_location', e.target.value)}
                    required
                  />
                  {inquiryErrors.meetup_location && (
                    <div className="text-xs text-rose-600 mt-1">
                      {inquiryErrors.meetup_location}
                    </div>
                  )}
                </div>

                {/* Extra notes */}
                <div>
                  <label className="text-sm">Message (optional)</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    rows={4}
                    placeholder={`Any questions or requirements about meeting ${pet.pname}?`}
                    value={inquiryData.message}
                    onChange={(e) => setInquiryData('message', e.target.value)}
                  />
                  {inquiryErrors.message && (
                    <div className="text-xs text-rose-600 mt-1">{inquiryErrors.message}</div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInquiryOpen(false)}
                    className="px-3 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={inquiryProcessing}
                    className="px-4 py-2 rounded-lg bg-violet-600 text-white"
                  >
                    {inquiryProcessing ? 'Sending…' : 'Send Inquiry'}
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                  Tip: Bring a valid ID during visitation and arrive 10 minutes early. Thank you!
                </p>
              </form>
            </div>
          </div>
        )}

        {/* ===== Modal: Sponsorship Inquiry ===== */}
        {isSponsorshipOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Sponsorship Inquiry</h2>
                <button
                  onClick={() => setSponsorshipOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSponsorshipSubmit} className="space-y-3">
                <div>
                  <label className="text-sm">Your Name</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={sponsorshipData.name_s}
                    onChange={(e) => setSponsorshipData('name_s', e.target.value)}
                    required
                  />
                  {sponsorshipErrors.name_s && (
                    <div className="text-xs text-rose-600 mt-1">
                      {sponsorshipErrors.name_s}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm">Your Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={sponsorshipData.email_s}
                    onChange={(e) => setSponsorshipData('email_s', e.target.value)}
                    required
                  />
                  {sponsorshipErrors.email_s && (
                    <div className="text-xs text-rose-600 mt-1">
                      {sponsorshipErrors.email_s}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm">Phone (optional)</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={sponsorshipData.phone_s}
                    onChange={(e) => setSponsorshipData('phone_s', e.target.value)}
                  />
                  {sponsorshipErrors.phone_s && (
                    <div className="text-xs text-rose-600 mt-1">
                      {sponsorshipErrors.phone_s}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm">Message (optional)</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    rows={4}
                    value={sponsorshipData.message_s}
                    onChange={(e) => setSponsorshipData('message_s', e.target.value)}
                  />
                  {sponsorshipErrors.message_s && (
                    <div className="text-xs text-rose-600 mt-1">
                      {sponsorshipErrors.message_s}
                    </div>
                  )}
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSponsorshipOpen(false)}
                    className="px-3 py-2 rounded-lg border"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={sponsorshipProcessing}
                    className="px-4 py-2 rounded-lg bg-violet-600 text-white"
                  >
                    {sponsorshipProcessing ? 'Sending…' : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// resources/js/pages/Profile/Show.tsx
import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import adoption from '@/routes/adoption';

type ProfileUser = {
  id: number;
  name: string;
};

type Pet = {
  id: number;
  pname: string;
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
  status?: 'available' | 'pending' | 'adopted' | string | null;
  created_at?: string | null;
  life_stage?: string | null;
  age_text?: string | null;
};

type PageProps = {
  profile: ProfileUser;
  pets: Pet[];
  auth?: { user?: any };
};

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

function computeLifeStage(category?: string | null, age?: number | null, unit?: string | null) {
  if (!category || age == null) return null;
  const months = unit === 'months' ? age : (age || 0) * 12;
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

function ageText(age?: number | null, unit?: string | null) {
  if (age == null) return 'N/A';
  const u = unit === 'months' ? 'month' : 'year';
  return `${age} ${age === 1 ? u : `${u}s`}`;
}

export default function ProfileShow({ profile, pets }: PageProps) {
  const page = usePage().props as any;
  const isOwner = page?.auth?.user?.id === profile.id;

  const name =
    (profile.name && profile.name.trim()) ||
    '';

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profiles', href: route('profile.index') },
  ];

  // Client-side filters
  const [activeCategory, setActiveCategory] = useState<'All' | 'cat' | 'dog'>('All');
  const [activeStatus, setActiveStatus] = useState<'All' | 'available' | 'pending' | 'adopted'>('All');

  const filteredPets = useMemo(() => {
    return (Array.isArray(pets) ? pets : [])
      .filter(p =>
        (activeCategory === 'All' || (p.category && p.category.toLowerCase() === activeCategory)) &&
        (activeStatus === 'All' || (p.status && p.status.toLowerCase() === activeStatus))
      )
      .sort((a, b) => (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
  }, [pets, activeCategory, activeStatus]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${profile.name}'s Profile`} />

      {/* Header */}
      <div className="relative overflow-hidden py-10 sm:py-14">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-lg">
              {profile.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {profile.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">@{name}</p>

              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                <span className="px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold">
                  {pets?.length ?? 0} posts
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={route('adoption.index')}
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                ← Back to Adoption
              </Link>
              {/* Optional contact (placeholder) */}
              <a
                href="{route(adoption.inquire)}"
            onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Sponsor
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-semibold">Filter Posts:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All', value: 'All' },
                  { label: 'Cats', value: 'cat' },
                  { label: 'Dogs', value: 'dog' },
                ].map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setActiveCategory(c.value as any)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      activeCategory === c.value
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All', value: 'All' },
                  { label: 'Available', value: 'available' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Adopted', value: 'adopted' },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setActiveStatus(s.value as any)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      activeStatus === s.value
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        {filteredPets.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPets.map((pet) => (
              <div
                key={pet.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
              >
                {/* Status */}
                <div className="absolute top-3 right-3 z-10">
                  {pet.status === 'adopted' && (
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ✓ ADOPTED
                    </span>
                  )}
                  {pet.status === 'pending' && (
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ⏳ PENDING
                    </span>
                  )}
                  {(pet.status === 'available' || !pet.status) && (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ✨ AVAILABLE
                    </span>
                  )}
                </div>

                {/* Image */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600">
                  <img
                    src={pet.image_url || PLACEHOLDER}
                    alt={pet.pname}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-violet-400 to-purple-600 rounded-full text-white text-sm font-bold shadow-md">
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                    <Link
                      href={route('profile.show', { name })}
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate"
                    >
                      {profile.name}
                    </Link>
                  </div>

                  {/* Age + Stage */}
                  {/* <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="text-base">🎂</span>
                    <span>{pet.age_text ?? ageText(pet.age ?? undefined, pet.age_unit ?? undefined)}</span>
                    {(() => {
                      const stage = pet.life_stage ?? computeLifeStage(pet.category, pet.age ?? undefined, pet.age_unit ?? undefined);
                      return stage ? (
                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold">
                          {stage}
                        </span>
                      ) : null;
                    })()}
                  </div> */}

                  {/* Small details */}
                  {/* <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-semibold">Breed:</span> {pet.breed || '—'}
                    <span className="mx-2">•</span>
                    <span className="font-semibold capitalize">{pet.category}</span>
                  </div> */}

                  <div className="flex gap-2">
                    <Link
                      href={route('adoption.show', pet.id)}
                      className="flex-1 text-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      About me
                    </Link>
                    <Link
                      href={route('adoption.index')}
                      className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Browse more"
                    >
                      🐾
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6">
              <span className="text-5xl">😺</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isOwner ? 'Start by posting a pet for adoption.' : 'This user has no public posts.'}
            </p>
            <Link
              href={route('adoption.index')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Back to Adoption
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

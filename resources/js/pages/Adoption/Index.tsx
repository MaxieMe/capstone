import { DisableScroll } from '@/components1/disable-scroll';
import { PlusButton } from '@/components1/plus-button';
import { XButton } from '@/components1/x-button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link, usePage, router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { CAT_BREEDS, DOG_BREEDS } from '@/components1/breed';
import { route } from 'ziggy-js';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Adoption', href: '/adoption' }];

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

type Role = 'user' | 'admin' | 'superadmin';

type ProfileUser = {
  id?: number;
  name?: string;
};

type Pet = {
  id: number;
  pname: string;
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
  status?: 'available' | 'pending' | 'adopted' | string;
  created_at?: string;
  life_stage?: string | null;
  age_text?: string | null;
};

type GuestUser = {
  id: number;
  name: string;
  cover_url?: string | null;
  available_posts_count?: number;
  total_posts_count?: number;
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
  const canPost = isAuthenticated && (['user', 'admin', 'superadmin'] as Role[]).includes(user?.role as Role);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'All' | 'cat' | 'dog'>(
    (filters?.category as any) || 'All'
  );
  const [activeGender, setActiveGender] = useState<'All' | 'Male' | 'Female'>(
    (filters?.gender ? (filters.gender.toLowerCase() === 'male' ? 'Male' : 'Female') : 'All') as any
  );
  const [search, setSearch] = useState(filters?.q ?? '');

  // guest search
  const guestSearchForm = useForm({ q: filters?.q ?? '' });

  // pets list
  const list: Pet[] = Array.isArray(adoption?.data) ? adoption.data : [];
  const filteredPets = useMemo(() => {
    return list
      .filter((pet) => {
        const availableOnly = isAuthenticated ? true : ((pet.status || '').toLowerCase() === 'available');
        const categoryMatch =
          activeCategory === 'All' ||
          (pet.category && pet.category.toLowerCase() === activeCategory.toLowerCase());
        const genderMatch =
          activeGender === 'All' ||
          (pet.gender && pet.gender.toLowerCase() === activeGender.toLowerCase());
        return availableOnly && categoryMatch && genderMatch;
      })
      .sort((a, b) => (new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
  }, [list, isAuthenticated, activeCategory, activeGender]);

  // post pet form
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    pname: '',
    gender: '',
    age: '',
    age_unit: 'months' as 'months' | 'years',
    category: '' as 'cat' | 'dog' | '',
    breed: '',
    color: '',
    location: '',
    description: '',
    image: null as File | null,
  });

  const breedOptions = useMemo(() => {
    if (data.category === 'dog') return DOG_BREEDS;
    if (data.category === 'cat') return CAT_BREEDS;
    return [];
  }, [data.category]);

  useEffect(() => {
    setData('breed', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.category]);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    setShowModal(false);
    reset();
    clearErrors();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('adoption.store'), {
      forceFormData: true,
      onSuccess: () => handleCloseModal(),
    });
  };

  // helpers
  const computeLifeStage = (category?: string, age?: number, unit?: string) => {
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
    } else if (type === 'cat') {
      if (months < 6) return 'Kitten';
      if (months < 24) return 'Junior';
      if (months < 72) return 'Prime';
      if (months < 120) return 'Mature';
      if (months < 168) return 'Senior';
      return 'Geriatric';
    }
    return null;
  };

  const ageText = (age?: number, unit?: string) => {
    if (age == null) return 'N/A';
    const u = unit || 'years';
    const label = u === 'months' ? (age === 1 ? 'month' : 'months') : (age === 1 ? 'year' : 'years');
    return `${age} ${label}`;
  };

  const getName = (u?: ProfileUser | null) =>
    (u?.name && u.name.trim()) || '';

  const visitProfile = (pet: Pet) => {
    const name = getName(pet.user);
    if (name) router.visit(route('profile.show', { name }));
  };

  const prevLink = adoption?.links?.[0];
  const nextLink = adoption?.links?.[adoption?.links?.length - 1];

  // search submit (server-side)
  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit(
      route('adoption.index', {
        q: search || undefined,
        category: activeCategory !== 'All' ? activeCategory : undefined,
        gender: activeGender !== 'All' ? activeGender.toLowerCase() : undefined,
      }),
      { preserveScroll: true, preserveState: true }
    );
  };

  // guest directory search
  const submitGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    guestSearchForm.get(route('adoption.index'), { preserveState: true, preserveScroll: true });
  };

  // ===================== GUEST VIEW =====================
  if (!isAuthenticated) {
    const users: GuestUser[] = Array.isArray(guestUsers?.data) ? guestUsers!.data : [];

    return (
      <AppLayout breadcrumbs={[{ title: 'Adoption (Guests)', href: route('adoption.index') }]}>
        <Head title="Browse Owners — Available Pets" />

        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 py-10 sm:py-14">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
              <span className="text-xl">👥</span>
              <span>Browse Users with Available Pets</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
             Welcome to PetCare
            </h1>

            {/* Search users */}
            <form onSubmit={submitGuestSearch} className="mt-6 max-w-xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestSearchForm.data.q}
                  onChange={(e) => guestSearchForm.setData('q', e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
                  placeholder="Search name"
                />
                <button
                  type="submit"
                  disabled={guestSearchForm.processing}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-md"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Users Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {users.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map((u) => {
                  const name = (u.name && u.name.trim()) || '';
                  return (
                    <div
                      key={u.id}
                      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      <div className="relative h-40">
                        <img
                          src={u.cover_url || PLACEHOLDER}
                          alt={u.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                          }}
                        />
                        <div className="absolute -bottom-6 left-5 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-lg">
                          {u.name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                      </div>

                      <div className="p-5 pt-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{u.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">{u.available_posts_count ?? 0}</span> available
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">{u.total_posts_count ?? 0}</span> total
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link
                            href={route('profile.show', { name })}
                            className="flex-1 text-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            Visit Profile
                          </Link>
                          <Link
                            href={route('adoption.index')}
                            className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            title="Browse Pets"
                          >
                            🐾
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Users pagination (desktop) */}
              {Array.isArray(guestUsers?.links) && guestUsers!.links.length > 0 && (
                <div className="mt-8 hidden sm:flex justify-center gap-2">
                  {guestUsers!.links.map((link, i) => (
                    <button
                      key={i}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                        link.active
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Try a different keyword.</p>
              <Link
                href={route('adoption.index')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
              >
                Browse Pets
              </Link>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ===================== AUTHENTICATED VIEW =====================
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Pet Adoption" />

      {/* Hero + Search */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzg4ODgiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <span className="text-xl">🐾</span>
            <span>Find Your Perfect Companion</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Adopt a Furry Friend
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Give a loving home to pets in need. Browse our available cats and dogs ready for adoption.
          </p>

          {/* Server-side search */}
          <form onSubmit={doSearch} className="max-w-xl mx-auto flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pets by name..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:border-violet-500"
            />
            <button className="px-5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold">
              Search
            </button>
          </form>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-xl">
              <div className="text-3xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {filteredPets.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pets Visible</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-xl">
              <div className="text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                {filteredPets.filter((p) => p.status === 'adopted').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Happy Adoptions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      {canPost && (
        <button
          onClick={handleOpenModal}
          className="fixed z-50 right-4 sm:right-6 lg:right-8 bottom-4 sm:bottom-6 lg:bottom-8 group"
          aria-label="Add adoption post"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl transition-all transform group-hover:scale-110">
              <PlusButton />
            </div>
          </div>
        </button>
      )}

      <DisableScroll showModal={showModal} />

 {/* Enhanced Modal - Bottom */}
{showModal && (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm pt-32">
    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl">
      {/* Modal Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-3xl">🐾</span>
              Add Pet for Adoption
            </h2>
            <p className="text-violet-100 text-sm mt-1">Fill in the details below</p>
          </div>
          <button
            onClick={handleCloseModal}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <XButton />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-6 space-y-5">
        {/* Pet Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Pet Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pname"
            value={data.pname}
            onChange={(e) => setData('pname', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
            placeholder="e.g., Fluffy, Max, Bella"
            required
          />
          {errors.pname && <p className="text-red-500 text-xs mt-1">{errors.pname}</p>}
        </div>

        {/* Pet Type & Breed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Pet Type <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={data.category}
              onChange={(e) => {
                const val = e.target.value as 'cat' | 'dog' | '';
                setData('category', val);
                setData('breed', '');
              }}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
              required
            >
              <option value="">Select Pet Type</option>
              <option value="cat">🐱 Cat</option>
              <option value="dog">🐶 Dog</option>
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Breed <span className="text-red-500">*</span>
            </label>
            <select
              name="breed"
              value={data.breed}
              onChange={(e) => setData('breed', e.target.value)}
              disabled={!data.category}
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                !data.category
                  ? 'border-gray-200 dark:border-gray-700 opacity-70 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-600'
              } bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none`}
              required
            >
              {!data.category ? (
                <option value="">Select pet type first</option>
              ) : (
                <>
                  <option value="">
                    {`Select ${data.category === 'dog' ? 'Dog' : 'Cat'} Breed`}
                  </option>
                  {(data.category === 'dog' ? DOG_BREEDS : CAT_BREEDS).map((b: string) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.breed && <p className="text-red-500 text-xs mt-1">{errors.breed}</p>}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
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
                  onChange={(e) => setData('gender', e.target.value)}
                  className="peer hidden"
                />
                <div className="cursor-pointer rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-center font-medium capitalize transition-all peer-checked:border-violet-500 peer-checked:bg-violet-50 dark:peer-checked:bg-violet-900/30 peer-checked:text-violet-700 dark:peer-checked:text-violet-300">
                  {g === 'male' ? '♂️ Male' : '♀️ Female'}
                </div>
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Age <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              name="age"
              min={1}
              value={data.age}
              onChange={(e) => setData('age', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
              placeholder="Enter age"
              required
            />
            <select
              name="age_unit"
              value={data.age_unit}
              onChange={(e) => setData('age_unit', e.target.value as 'months' | 'years')}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
            >
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
          {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
        </div>

        {/* Color & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="text"
              name="color"
              value={data.color}
              onChange={(e) => setData('color', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
              placeholder="e.g., Brown, White"
            />
            {errors.color && <p className="text-red-500 text-xs mt-1">{errors.color}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Location</label>
            <input
              type="text"
              name="location"
              value={data.location}
              onChange={(e) => setData('location', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
              placeholder="e.g., Manila"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            name="description"
            rows={4}
            value={data.description}
            onChange={(e) => setData('description', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none resize-none"
            placeholder="Tell us about this pet's personality, habits, and why they'd make a great companion..."
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Pet Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setData('image', e.target.files[0]);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300 file:cursor-pointer"
          />
          {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleCloseModal}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {processing ? 'Posting...' : 'Post for Adoption'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-semibold">Filter Pets:</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'All Pets', value: 'All', emoji: '🐾' },
                  { label: 'Cats', value: 'cat', emoji: '🐱' },
                  { label: 'Dogs', value: 'dog', emoji: '🐶' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveCategory(f.value as any)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      activeCategory === f.value
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                    onClick={() => setActiveGender(g.value as any)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all ${
                      activeGender === g.value
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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

      {/* Pet Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      {pet.user?.name ? pet.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {pet.user?.name ? (
                      <Link
                        href={route('profile.show', { name: pet.user.name ?? pet.user.name! })}
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate"
                      >
                        {pet.user.name.charAt(0).toUpperCase() + pet.user.name.slice(1).toLowerCase()}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">Unknown</span>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 truncate">
                    {pet.pname}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="text-base">🎂</span>
                    <span>{pet.age_text ?? ageText(pet.age, pet.age_unit)}</span>
                    {(() => {
                      const stage = pet.life_stage ?? computeLifeStage(pet.category, pet.age, pet.age_unit);
                      return stage ? (
                        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-semibold">
                          {stage}
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-semibold">Breed:</span> {pet.breed || '—'}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={route('adoption.show', pet.id)}
                      className="flex-1 text-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      About me
                    </Link>

                    {!isAuthenticated && (pet.user?.name || pet.user?.name) && (
                      <button
                        onClick={() => visitProfile(pet)}
                        className="px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Visit Profile"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Pets Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your filters or search keyword.</p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setActiveGender('All');
                setSearch('');
                router.visit(route('adoption.index'));
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Pets Pagination */}
      {Array.isArray(adoption?.links) && adoption.links.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Mobile */}
          <div className="flex sm:hidden justify-between gap-3">
            <button
              disabled={!prevLink?.url}
              onClick={() => prevLink?.url && router.visit(prevLink.url)}
              className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md"
            >
              ← Previous
            </button>
            <button
              disabled={!nextLink?.url}
              onClick={() => nextLink?.url && router.visit(nextLink.url)}
              className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-md"
            >
              Next →
            </button>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex justify-center gap-2">
            {adoption.links.map((link: any, i: number) => (
              <button
                key={i}
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  link.active
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

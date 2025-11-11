// resources/js/Pages/Profile/Show.tsx
import React, { useMemo, useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { CAT_BREEDS, DOG_BREEDS } from '@/components1/breed';
import { DisableScroll } from '@/components1/disable-scroll';
import { XButton } from '@/components1/x-button';

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

type PageProps = {
  profile: ProfileUser;
  pets: Pet[];
  sponsor?: Sponsor | null;
  auth?: { user?: any };
};

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="24" font-family="system-ui">🐾</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="16" font-family="system-ui">No Photo Available</text></svg>';

export default function ProfileShow({ profile, pets, sponsor }: PageProps) {
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
    { title: 'Profiles', href: route('profile.index') },
  ];

  // Filters
  const [activeCategory, setActiveCategory] =
    useState<'All' | 'cat' | 'dog'>('All');

  const [activeStatus, setActiveStatus] = useState<
    'All' | 'waiting_for_approval' | 'available' | 'pending' | 'adopted'
  >('All');

  const filteredPets = useMemo(() => {
    return (Array.isArray(pets) ? pets : [])
      .filter(
        (p) =>
          (activeCategory === 'All' ||
            (p.category && p.category.toLowerCase() === activeCategory)) &&
          (activeStatus === 'All' ||
            (p.status && p.status.toLowerCase() === activeStatus))
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || '').getTime() -
          new Date(a.created_at || '').getTime()
      );
  }, [pets, activeCategory, activeStatus]);

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
    pname: '',
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

  const breedOptions = useMemo(() => {
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

    setData('pname', pet.pname || '');
    setData('gender', pet.gender || '');
    setData('age', pet.age != null ? String(pet.age) : '');
    setData('age_unit', (pet.age_unit as 'months' | 'years') || 'months');
    setData('category', (pet.category as 'cat' | 'dog' | '') || '');
    setData(
      'breed',
      isInList ? existingBreed : existingBreed ? 'Other / Not Sure' : ''
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
        ? (data.custom_breed || 'Other / Not Sure')
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

  // ✅ Owner dapat makita QR kahit anong status (basta may qr_url)
  const hasAnyQr = !!sponsor && !!sponsor.qr_url;

  // ✅ Public / non-owner: makakakita lang pag approved
  const hasPublicQr =
    !!sponsor && sponsor.status === 'approved' && !!sponsor.qr_url;

  /* =================== ACTIONS =================== */

  const handleDelete = (petId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    router.delete(route('adoption.destroy', petId), {
      preserveScroll: true,
    });
  };

  const handleCancelPending = (petId: number) => {
    if (!confirm('Cancel this pending adoption?')) return;

    router.post(
      route('adoption.cancel', petId),
      {},
      {
        preserveScroll: true,
      }
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
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
          ✅ Sponsor QR Approved
        </span>
      );
    }
    if (sponsor.status === 'waiting_for_approval') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
          ⏳ Sponsor QR is waiting for approval
        </span>
      );
    }
    if (sponsor.status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
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
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {sponsor ? 'Update Sponsor QR' : 'Upload Sponsor QR'}
                  </button>

                  {hasAnyQr && (
                    <button
                      type="button"
                      onClick={() => setShowSponsorViewModal(true)}
                      className="inline-flex items-center gap-2 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      View QR Code
                    </button>
                  )}
                </>
              ) : (
                hasPublicQr && (
                  <button
                    type="button"
                    onClick={() => setShowSponsorViewModal(true)}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm pt-32">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-3xl">🐾</span>
                    Edit Pet
                  </h2>
                  <p className="text-violet-100 text-sm mt-1">
                    Update the details of your adoption post
                  </p>
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

            <form
              onSubmit={handleSubmit}
              encType="multipart/form-data"
              className="p-6 space-y-5"
            >
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
                  required
                />
                {errors.pname && (
                  <p className="text-red-500 text-xs mt-1">{errors.pname}</p>
                )}
              </div>

              {/* Category & Breed */}
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
                      setData('custom_breed', '');
                    }}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
                    required
                  >
                    <option value="">Select Pet Type</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="dog">🐶 Dog</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.category}
                    </p>
                  )}
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
                          {`Select ${
                            data.category === 'dog' ? 'Dog' : 'Cat'
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
                    <p className="text-red-500 text-xs mt-1">
                      {errors.breed}
                    </p>
                  )}

                  {data.breed === 'Other / Not Sure' && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                        Custom Breed <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={data.custom_breed}
                        onChange={(e) =>
                          setData('custom_breed', e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none text-sm"
                        placeholder="Type the breed (e.g. Aspin mix)"
                      />
                    </div>
                  )}
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
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
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
                    required
                  />
                  <select
                    name="age_unit"
                    value={data.age_unit}
                    onChange={(e) =>
                      setData('age_unit', e.target.value as 'months' | 'years')
                    }
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                )}
              </div>

              {/* Color & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={data.color}
                    onChange={(e) => setData('color', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
                    required
                  />
                  {errors.color && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.color}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={data.location}
                    onChange={(e) => setData('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none"
                    required
                  />
                  {errors.location && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-800 transition-all outline-none resize-none"
                  required
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Pet Photo (optional if no change)
                </label>
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
                {errors.image && (
                  <p className="text-red-500 text-xs mt-1">{errors.image}</p>
                )}
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
                  {processing ? 'Updating...' : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor QR Upload / Update Modal */}
      {showSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm pt-32">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {sponsor ? 'Update Sponsor QR' : 'Upload Sponsor QR'}
                </h2>
                <button
                  onClick={closeSponsorModal}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  aria-label="Close"
                >
                  <XButton />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSponsorSubmit}
              encType="multipart/form-data"
              className="p-5 space-y-4"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload a QR code image that people can scan to send support
                (e.g., GCash, PayPal, etc.). Your QR will be reviewed by an
                admin before it becomes visible on your profile.
              </p>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  QR Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSponsorData('qr', e.target.files[0]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300 file:cursor-pointer"
                  required
                />
                {sponsorErrors.qr && (
                  <p className="text-red-500 text-xs mt-1">
                    {sponsorErrors.qr}
                  </p>
                )}
              </div>

              {sponsor &&
                sponsor.status === 'rejected' &&
                sponsor.reject_reason && (
                  <div className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl p-2">
                    <strong>Previous rejection reason:</strong>{' '}
                    {sponsor.reject_reason}
                  </div>
                )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSponsorModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sponsorProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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

      {/* FULL-SCREEN QR VIEW MODAL (owner: kahit waiting/rejected, others: only approved) */}
      {showSponsorViewModal &&
        sponsor?.qr_url &&
        (isOwner || sponsor.status === 'approved') && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSponsorViewModal(false)}
          >
            <div
              className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSponsorViewModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-200"
                aria-label="Close"
              >
                <XButton />
              </button>

              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 text-center">
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
                  className="max-w-[90vw] max-h-[80vh] object-contain bg-white rounded-2xl shadow-2xl"
                />
              </a>

              <p className="mt-4 text-xs sm:text-sm text-gray-200 text-center max-w-md">
                Tap or click the QR code to open it in a new tab, or scan it
                directly using your camera or payment app.
              </p>

              {isOwner && sponsor.status !== 'approved' && (
                <p className="mt-2 text-[11px] sm:text-xs text-amber-200 text-center max-w-md">
                  This QR is still not approved yet, so only you can see it for
                  now.
                </p>
              )}
            </div>
          </div>
        )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <svg
                className="w-5 h-5"
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
                  {
                    label: 'Waiting for Approval',
                    value: 'waiting_for_approval',
                  },
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
                  {pet.status === 'waiting_for_approval' && (
                    <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ⏳ WAITING FOR APPROVAL
                    </span>
                  )}
                  {(pet.status === 'available' || !pet.status) && (
                    <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      ✨ AVAILABLE
                    </span>
                  )}
                </div>

                {/* Rejected notice – profile page lang, owner lang makakakita */}
                {isOwner && pet.status === 'rejected' && (
                  <div className="absolute left-3 right-3 top-12 z-10 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                      <span>⚠️ Post Rejected</span>
                    </div>
                    <p className="mt-1 text-xs text-red-700/90 dark:text-red-200">
                      {pet.reject_reason && pet.reject_reason.trim() !== ''
                        ? pet.reject_reason
                        : 'Your post was rejected by an administrator. Please review your information and try again.'}
                    </p>
                  </div>
                )}

                {/* Image */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600">
                  <img
                    src={pet.image_url || PLACEHOLDER}
                    alt={pet.pname}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      if (e.currentTarget.src !== PLACEHOLDER)
                        e.currentTarget.src = PLACEHOLDER;
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

                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2 truncate">
                    {pet.pname}
                  </h3>

                  <div className="flex gap-2">
                    <Link
                      href={route('adoption.show', pet.id)}
                      className="flex-1 text-center bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      About me
                    </Link>
                  </div>

                  {isOwner && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pet.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleCancelPending(pet.id)}
                          className="flex-1 min-w-[90px] text-center border-2 border-amber-500 text-amber-600 dark:text-amber-300 rounded-xl py-2 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all"
                        >
                          Cancel
                        </button>
                      ) : (
                        <>
                          {canShowEdit(pet) && (
                            <button
                              type="button"
                              onClick={() => openEditModal(pet)}
                              className="flex-1 min-w-[90px] text-center border-2 border-blue-500 text-blue-600 dark:text-blue-300 rounded-xl py-2 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                            >
                              Edit
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(pet.id)}
                            className="flex-1 min-w-[90px] text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {pet.status === 'rejected' &&
                    (isOwner || isAdmin) &&
                    pet.reject_reason && (
                      <div className="mt-3 text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl p-3">
                        <strong>Reason for rejection:</strong>{' '}
                        {pet.reject_reason}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6">
              <span className="text-5xl">😺</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isOwner
                ? 'Start by posting a pet for adoption.'
                : 'This user has no public posts.'}
            </p>
            <Link
              href={route('adoption.index')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg"
            >
              <svg
                className="w-5 h-5"
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
    </AppLayout>
  );
}

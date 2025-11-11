// resources/js/Pages/Sponsor/Index.tsx
import React, { useMemo, useState } from 'react';
import { Head, router, Link, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { route } from 'ziggy-js';
import type { BreadcrumbItem } from '@/types';

type Role = 'user' | 'admin' | 'superadmin';

type SponsorUser = {
  id: number;
  name: string;
};

type Sponsor = {
  id: number;
  status: 'waiting_for_approval' | 'approved' | 'rejected';
  reject_reason?: string | null;
  qr_url?: string | null;
  created_at?: string | null;
  user?: SponsorUser | null;
};

type PageProps = {
  sponsors: Sponsor[];
  filters?: {
    status?: string | null;
  };
  auth?: {
    user?: {
      id: number;
      name: string;
      role?: Role | string;
    } | null;
  };
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Sponsor Requests', href: route('sponsor.index') },
];

export default function SponsorIndex({ sponsors, filters }: PageProps) {
  const page = usePage().props as any;
  const flash = page?.flash ?? {};
  const auth = page?.auth ?? {};
  const viewer = auth?.user ?? null;

  const role: Role =
    viewer?.role && ['user', 'admin', 'superadmin'].includes(viewer.role)
      ? (viewer.role as Role)
      : 'user';

  const isAdmin = role === 'admin';
  const isSuperadmin = role === 'superadmin';

  const [activeStatus, setActiveStatus] = useState<
    'All' | 'waiting_for_approval' | 'approved' | 'rejected'
  >((filters?.status as any) || 'All');

  const filteredSponsors = useMemo(() => {
    return (Array.isArray(sponsors) ? sponsors : []).filter((s) =>
      activeStatus === 'All' ? true : s.status === activeStatus
    );
  }, [sponsors, activeStatus]);

  const applyStatusFilter = (status: typeof activeStatus) => {
    setActiveStatus(status);
    const query: Record<string, string> = {};
    if (status !== 'All') query.status = status;
    router.get(route('sponsor.index'), query, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  /* =============== APPROVE / REJECT / DELETE =============== */

  const approveSponsor = (s: Sponsor) => {
    if (!confirm(`Approve sponsor QR of ${s.user?.name || 'this user'}?`)) {
      return;
    }

    router.post(
      route('sponsor.approve', s.id),
      {},
      {
        preserveScroll: true,
      }
    );
  };

  const rejectSponsor = (s: Sponsor) => {
    const reason = prompt(
      `Reject sponsor QR of ${s.user?.name || 'this user'}.\nOptional reason:`,
      s.reject_reason || ''
    );

    router.post(
      route('sponsor.reject', s.id),
      { reason: reason || '' },
      {
        preserveScroll: true,
      }
    );
  };

  const deleteSponsor = (s: Sponsor) => {
    if (
      !confirm(
        `Delete sponsor QR of ${s.user?.name || 'this user'}? This cannot be undone.`
      )
    ) {
      return;
    }

    router.delete(route('sponsor.destroy', s.id), {
      preserveScroll: true,
    });
  };

  /* =============== SUPERADMIN EDIT QR MODAL =============== */

  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const {
    data: editForm,
    setData: setEditData,
    post: postEdit,
    processing: editProcessing,
    errors: editErrors,
    reset: resetEdit,
    clearErrors: clearEditErrors,
    transform: transformEdit,
  } = useForm({
    qr: null as File | null,
  });

  const openEditModal = (s: Sponsor) => {
    if (!isSuperadmin) return;
    clearEditErrors();
    resetEdit();
    setEditingSponsor(s);
  };

  const closeEditModal = () => {
    setEditingSponsor(null);
    resetEdit();
    clearEditErrors();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSponsor) return;

    // 🔥 Gawing PUT via _method override
    transformEdit((data) => ({
      ...data,
      _method: 'PUT',
    }));

    postEdit(route('sponsor.update', editingSponsor.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        closeEditModal();
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sponsor QR Approvals" />

      {/* Flash */}
      {flash.success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow">
            {flash.success}
          </div>
        </div>
      )}
      {flash.error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-rose-500 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow">
            {flash.error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sponsor QR Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Review, approve, or reject sponsor QR codes uploaded by users.
              {isSuperadmin &&
                ' As superadmin, you can also edit or delete existing QR codes.'}
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { label: 'All', value: 'All' },
            { label: 'Waiting for Approval', value: 'waiting_for_approval' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => applyStatusFilter(f.value as any)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeStatus === f.value
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filteredSponsors.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSponsors.map((s) => {
              const canApproveReject =
                s.status === 'waiting_for_approval' && (isAdmin || isSuperadmin);
              const canEdit = isSuperadmin && s.status === 'approved';
              const canDelete = isSuperadmin; // superadmin pwedeng mag-delete kahit anong status

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 flex flex-col gap-3"
                >
                  {/* Header row: user + status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                        {s.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {s.user?.name || 'Unknown user'}
                        </p>
                        {s.created_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Requested:{' '}
                            {new Date(s.created_at).toLocaleString('en-PH', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {s.status === 'waiting_for_approval' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                          ⏳ Waiting
                        </span>
                      )}
                      {s.status === 'approved' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          ✅ Approved
                        </span>
                      )}
                      {s.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                          ⚠️ Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR preview */}
                  <div className="flex justify-center">
                    {s.qr_url ? (
                      <img
                        src={s.qr_url}
                        alt="Sponsor QR"
                        className="w-40 h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-400">
                        No QR image
                      </div>
                    )}
                  </div>

                  {/* Reject reason */}
                  {s.status === 'rejected' && s.reject_reason && (
                    <div className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl p-2">
                      <strong>Reason:</strong> {s.reject_reason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Link
                      href={
                        s.user ? route('profile.show', { name: s.user.name }) : '#'
                      }
                      className="flex-1 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      View Profile
                    </Link>

                    {/* WAITING → approve/reject lang */}
                    {canApproveReject && (
                      <>
                        <button
                          type="button"
                          onClick={() => rejectSponsor(s)}
                          className="flex-1 text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => approveSponsor(s)}
                          className="flex-1 text-center border-2 border-emerald-500 text-emerald-600 dark:text-emerald-300 rounded-xl py-2 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          Approve
                        </button>
                      </>
                    )}

                    {/* APPROVED → superadmin lang (edit + delete) */}
                    {s.status === 'approved' && !canApproveReject && (
                      <>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="flex-1 text-center border-2 border-blue-500 text-blue-600 dark:text-blue-300 rounded-xl py-2 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            Edit QR
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteSponsor(s)}
                            className="flex-1 text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}

                    {/* REJECTED → optional delete lang for superadmin */}
                    {s.status === 'rejected' && !canApproveReject && (
                      <>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteSponsor(s)}
                            className="flex-1 text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )}

                    {!canApproveReject &&
                      s.status !== 'approved' &&
                      s.status !== 'rejected' && (
                        <span className="w-full text-center text-[11px] text-gray-400 dark:text-gray-500 italic mt-1">
                          No actions available
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-200 dark:from-gray-700 dark:to-gray-600 rounded-full mb-6">
              <span className="text-5xl">💳</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No sponsor requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Users haven&apos;t submitted any sponsor QR codes yet.
            </p>
          </div>
        )}
      </div>

      {/* Edit QR Modal – superadmin only */}
      {editingSponsor && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit Sponsor QR
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updating QR for{' '}
                  <span className="font-semibold">
                    {editingSponsor.user?.name || 'Unknown user'}
                  </span>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-xl leading-none px-2"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              encType="multipart/form-data"
              className="p-5 space-y-4"
            >
              {editingSponsor.qr_url && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Current QR:
                  </p>
                  <div className="flex justify-center">
                    <img
                      src={editingSponsor.qr_url}
                      alt="Current Sponsor QR"
                      className="w-40 h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  New QR Image <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setEditData('qr', e.target.files[0]);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/30 dark:file:text-violet-300 file:cursor-pointer"
                  required
                />
                {editErrors.qr && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.qr}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {editProcessing ? 'Saving...' : 'Save QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

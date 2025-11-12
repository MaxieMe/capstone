// resources/js/Pages/Sponsor/Index.tsx
import React, { useMemo, useState } from "react";
import { Head, router, Link, useForm } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { route } from "ziggy-js";
import type { BreadcrumbItem } from "@/types";
import { useConfirmDialog } from "@/components1/confirm-dialog";
import { Button } from "@/components/ui/button";

type Role = "user" | "admin" | "superadmin";

type SponsorUser = {
  id: number;
  name: string;
};

type SponsorStatus = "waiting_for_approval" | "approved" | "rejected";

type Sponsor = {
  id: number;
  status: SponsorStatus;
  reject_reason?: string | null;
  qr_url?: string | null;
  created_at?: string | null;
  user?: SponsorUser | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type PaginatedSponsors = {
  data: Sponsor[];
  links: PaginationLink[];
};

type PageProps = {
  sponsors?: Sponsor[] | PaginatedSponsors;
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
  { title: "Sponsor Requests", href: route("sponsor.index") },
];

const statusLabel: Record<SponsorStatus, string> = {
  waiting_for_approval: "Waiting for Approval",
  approved: "Approved",
  rejected: "Rejected",
};

const statusColor: Record<SponsorStatus, string> = {
  waiting_for_approval:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function SponsorIndex({ sponsors, filters, auth }: PageProps) {
  const viewer = auth?.user ?? null;

  const role: Role =
    viewer?.role && ["user", "admin", "superadmin"].includes(viewer.role)
      ? (viewer.role as Role)
      : "user";

  const isAdmin = role === "admin";
  const isSuperadmin = role === "superadmin";

  const { confirm } = useConfirmDialog();

  // Normalize sponsors + pagination
  const sponsorList: Sponsor[] = Array.isArray(sponsors)
    ? sponsors
    : sponsors?.data ?? [];

  const paginationLinks: PaginationLink[] = Array.isArray(sponsors)
    ? []
    : sponsors?.links ?? [];

  const [activeStatus, setActiveStatus] = useState<
    "All" | "waiting_for_approval" | "approved" | "rejected"
  >((filters?.status as any) || "All");

  const filteredSponsors = useMemo(() => {
    return sponsorList.filter((s) =>
      activeStatus === "All" ? true : s.status === activeStatus
    );
  }, [sponsorList, activeStatus]);

  const applyStatusFilter = (status: typeof activeStatus) => {
    setActiveStatus(status);
    const query: Record<string, string> = {};
    if (status !== "All") query.status = status;
    router.get(route("sponsor.index"), query, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  /* =============== APPROVE / REJECT / DELETE =============== */

  const approveSponsor = async (s: Sponsor) => {
    const ok = await confirm({
      title: "Approve Sponsor QR",
      message: `Approve sponsor QR of ${s.user?.name || "this user"}?`,
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "success",
    });

    if (!ok) return;

    router.post(
      route("sponsor.approve", s.id),
      {},
      {
        preserveScroll: true,
      }
    );
  };

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<Sponsor | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectProcessing, setRejectProcessing] = useState(false);

  const openRejectDialog = (s: Sponsor) => {
    setRejectTarget(s);
    setRejectReason(s.reject_reason || "");
  };

  const closeRejectDialog = () => {
    setRejectTarget(null);
    setRejectReason("");
    setRejectProcessing(false);
  };

  const submitReject = () => {
    if (!rejectTarget) return;
    setRejectProcessing(true);

    router.post(
      route("sponsor.reject", rejectTarget.id),
      { reason: rejectReason || "" },
      {
        preserveScroll: true,
        onFinish: () => setRejectProcessing(false),
        onSuccess: () => {
          closeRejectDialog();
        },
      }
    );
  };

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const openDeleteDialog = (s: Sponsor) => {
    setDeleteTarget(s);
    setDeleteConfirmText("");
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteConfirmText("");
    setDeleteProcessing(false);
  };

  const submitDelete = () => {
    if (!deleteTarget) return;
    setDeleteProcessing(true);

    router.delete(route("sponsor.destroy", deleteTarget.id), {
      preserveScroll: true,
      onFinish: () => setDeleteProcessing(false),
      onSuccess: () => {
        closeDeleteDialog();
      },
    });
  };

  /* =============== SUPERADMIN EDIT QR MODAL =============== */

  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const {
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

    transformEdit((data) => ({
      ...data,
      _method: "PUT",
    }));

    postEdit(route("sponsor.update", editingSponsor.id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        closeEditModal();
      },
    });
  };

  /* =============== RENDER =============== */

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sponsor QR Approvals" />

      {/* Global FlashToast na sa layout */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sponsor QR Requests
            </h1>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Total Requests:{" "}
            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {sponsorList.length}
            </span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { label: "All", value: "All" as const },
            {
              label: "Waiting",
              value: "waiting_for_approval" as const,
            },
            { label: "Approved", value: "approved" as const },
            { label: "Rejected", value: "rejected" as const },
          ].map((f) => {
            const active = activeStatus === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => applyStatusFilter(f.value)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                  active
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* GRID CARDS */}
        {filteredSponsors.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredSponsors.map((s) => {
                const canApproveReject =
                  s.status === "waiting_for_approval" &&
                  (isAdmin || isSuperadmin);
                const canEdit = isSuperadmin && s.status === "approved";
                const canDelete = isSuperadmin;

                return (
                  <div
                    key={s.id}
                    className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-card/95 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-violet-500/60 transition-all flex flex-col overflow-hidden"
                  >
                    {/* Header strip */}
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-pink-600/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                          {s.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-50 truncate">
                            {s.user?.name || "Unknown user"}
                          </p>
                          {s.created_at && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {new Date(s.created_at).toLocaleString("en-PH", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${statusColor[s.status]}`}
                      >
                        {statusLabel[s.status]}
                      </span>
                    </div>

                    {/* QR Content box */}
                    <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-3">
                      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-3 py-3 flex flex-col items-center gap-2">
                        {s.qr_url ? (
                          <>
                            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-lg overflow-hidden bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                              <img
                                src={s.qr_url}
                                alt="Sponsor QR"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center max-w-xs">
                              This QR will be displayed publicly on the sponsor
                              section once approved. Make sure it scans properly.
                            </p>
                          </>
                        ) : (
                          <div className="w-full py-8 flex flex-col items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-2">
                              <span className="text-2xl">💳</span>
                            </div>
                            <p className="text-center max-w-xs">
                              No QR image uploaded yet. Ask the user to upload one
                              on their sponsor page.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Meta chips / ID */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <span className="font-semibold mr-1">ID:</span> #{s.id}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          Status: {statusLabel[s.status]}
                        </span>
                      </div>

                      {/* Reject reason box */}
                      {s.reject_reason && (
                        <div className="mt-1 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/30 px-3 py-2 text-[11px] text-rose-700 dark:text-rose-200">
                          <p className="font-semibold mb-0.5">Rejection reason</p>
                          <p className="leading-snug max-h-24 overflow-y-auto">
                            {s.reject_reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 pt-2 pb-3 border-t border-gray-200 dark:border-gray-700 bg-card/95 flex flex-wrap gap-2 mt-auto">
                      <Link
                        href={
                          s.user
                            ? route("profile.show", { name: s.user.name })
                            : "#"
                        }
                        className="flex-1 text-center border-2 border-gray-300 dark:border-gray-600 rounded-xl py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        View Profile
                      </Link>

                      {canApproveReject && (
                        <>
                          <button
                            type="button"
                            onClick={() => openRejectDialog(s)}
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

                      {!canApproveReject && s.status === "approved" && (
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
                              onClick={() => openDeleteDialog(s)}
                              className="flex-1 text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}

                      {!canApproveReject &&
                        s.status === "rejected" &&
                        canDelete && (
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(s)}
                            className="flex-1 text-center border-2 border-rose-500 text-rose-600 dark:text-rose-300 rounded-xl py-2 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          >
                            Delete
                          </button>
                        )}

                      {!canApproveReject &&
                        s.status !== "approved" &&
                        s.status !== "rejected" &&
                        !canDelete && (
                          <span className="w-full text-center text-[11px] text-gray-400 dark:text-gray-500 italic mt-1">
                            No actions available
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination for sponsors */}
            {paginationLinks.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {paginationLinks.map((link, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={link.active ? "default" : "outline"}
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                    className={
                      "min-w-[2.5rem] " +
                      (link.active
                        ? "bg-black text-white hover:bg-black"
                        : "text-black dark:text-white")
                    }
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No sponsor requests found for this filter.
          </div>
        )}
      </div>

      {/* EDIT QR MODAL */}
      {editingSponsor && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Edit Sponsor QR
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updating QR for{" "}
                  <span className="font-semibold">
                    {editingSponsor.user?.name || "Unknown user"}
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
                      setEditData("qr", e.target.files[0]);
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
                  {editProcessing ? "Saving..." : "Save QR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Sponsor Dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Reject Sponsor QR
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Provide an optional reason for rejecting{" "}
                <span className="font-semibold">
                  {rejectTarget.user?.name || "this user"}
                </span>
                .
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  className="w-full min-h-[110px] rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. QR is not clear or not scannable..."
                />
              </div>

              <div className="px-0 pb-4 pt-2 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeRejectDialog}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitReject}
                  disabled={rejectProcessing}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectProcessing ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sponsor Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Delete Sponsor QR
              </h2>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                This will permanently delete the sponsor QR of{" "}
                <span className="font-semibold">
                  {deleteTarget.user?.name || "this user"}
                </span>
                . This action cannot be undone.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                To confirm, please type{" "}
                <span className="font-mono font-semibold">DELETE</span> in all
                caps.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />

              <div className="px-0 pb-4 pt-2 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitDelete}
                  disabled={
                    deleteProcessing || deleteConfirmText.trim() !== "DELETE"
                  }
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteProcessing ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

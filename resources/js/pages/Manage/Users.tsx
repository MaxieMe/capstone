// resources/js/Pages/Manage/Users.tsx
import React, { useMemo, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type BreadcrumbItem } from "@/types";
import {
  Users as UsersIcon,
  Mail,
  Shield,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Edit,
  Check,
  X,
  Trash2,
  XCircle,
} from "lucide-react";
import { route } from "ziggy-js";
import { useConfirmDialog } from "@/components1/confirm-dialog";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Manage Users", href: "/Users" }];

type Role = "user" | "admin" | "superadmin";
type UserStatus = "pending" | "approved" | "rejected";
type StatusFilter = "all" | UserStatus;

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  barangay_permit: string | null;
  is_approved: boolean | number;
  is_rejected?: boolean | number | null;
}

interface Paginated<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
}

export default function Users() {
  const { auth, users } = usePage<{ auth: { user: User }; users: Paginated<User> }>()
    .props;

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, setData, processing, errors, reset } = useForm<{
    name: string;
    email: string;
    role: Role;
    barangay_permit: File | null;
  }>({
    name: "",
    email: "",
    role: "user",
    barangay_permit: null,
  });

  const { confirm } = useConfirmDialog();

  // For reject dialog
  const [rejectUserTarget, setRejectUserTarget] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectProcessing, setRejectProcessing] = useState(false);

  // For delete dialog
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  /* ===================== Permissions ===================== */
  const canEditAnything = auth.user.role === "superadmin";

  /* ===================== Status Helpers ===================== */

  const getUserStatus = (user: User): UserStatus => {
    const approved = !!user.is_approved;
    const rejected = !!user.is_rejected;

    if (approved) return "approved";
    if (rejected) return "rejected";
    return "pending";
  };

  /* ===================== Filters ===================== */

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredAndSortedUsers = useMemo(() => {
    const statusOrder: Record<UserStatus, number> = {
      pending: 1,
      approved: 2,
      rejected: 3,
    };

    const filtered =
      statusFilter === "all"
        ? users.data
        : users.data.filter((u) => getUserStatus(u) === statusFilter);

    const sorted = [...filtered].sort((a, b) => {
      const sa = statusOrder[getUserStatus(a)];
      const sb = statusOrder[getUserStatus(b)];

      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [users.data, statusFilter]);

  /* ===================== Approve / Reject / Delete ===================== */

  const handleApprove = async (user: User) => {
    const ok = await confirm({
      title: "Approve User",
      message: `Approve "${user.name}" as ${user.role}?`,
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "success",
    });

    if (!ok) return;

    router.post(route("admin.users.approve", user.id), {}, { preserveScroll: true });
  };

  const openRejectDialog = (user: User) => {
    setRejectUserTarget(user);
    setRejectReason("");
  };

  const closeRejectDialog = () => {
    setRejectUserTarget(null);
    setRejectReason("");
    setRejectProcessing(false);
  };

  const submitReject = () => {
    if (!rejectUserTarget) return;
    setRejectProcessing(true);

    router.post(
      route("admin.users.reject", rejectUserTarget.id),
      { reject_reason: rejectReason },
      {
        preserveScroll: true,
        onFinish: () => setRejectProcessing(false),
        onSuccess: () => {
          closeRejectDialog();
        },
      }
    );
  };

  const openDeleteDialog = (user: User) => {
    setDeleteUserTarget(user);
    setDeleteConfirmText("");
  };

  const closeDeleteDialog = () => {
    setDeleteUserTarget(null);
    setDeleteConfirmText("");
    setDeleteProcessing(false);
  };

  const submitDelete = () => {
    if (!deleteUserTarget) return;
    setDeleteProcessing(true);

    router.delete(route("admin.users.destroy", deleteUserTarget.id), {
      preserveScroll: true,
      onFinish: () => setDeleteProcessing(false),
      onSuccess: () => {
        closeDeleteDialog();
        router.reload({ only: ["users"] });
      },
    });
  };

  /* ===================== Edit Modal ===================== */

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset();
    setData("name", user.name);
    setData("email", user.email);
    setData("role", user.role);
    setData("barangay_permit", null);
  };

  const closeEdit = () => {
    setEditingUser(null);
    reset();
  };

  const handleSave = () => {
    if (!editingUser) return;

    router.post(
      route("admin.users.update", editingUser.id),
      {
        _method: "PUT",
        name: data.name,
        email: data.email,
        role: data.role,
        barangay_permit: data.barangay_permit,
      },
      {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          closeEdit();
          router.reload({ only: ["users"] });
        },
        onError: (errs) => {
          console.error("Update failed:", errs);
        },
      }
    );
  };

  /* ===================== Badges ===================== */

  const RoleBadge = ({ role }: { role: User["role"] }) => {
    const styles =
      role === "superadmin"
        ? "bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-400/20"
        : role === "admin"
        ? "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-400/20"
        : "bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-400/20";

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
      >
        <Shield className="w-3 h-3 mr-1" />
        {role}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: UserStatus }) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-400/20">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-400/20">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

  /* ===================== Render ===================== */

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Users" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
              <UsersIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              User Management
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total Users:</span>
            <span className="font-semibold text-lg">
              {filteredAndSortedUsers.length}
            </span>
          </div>
        </div>

        {/* FILTER BAR: Status */}
        {users.data.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground mt-1 mr-1">Status:</span>
            {[
              { label: "All", value: "all" as StatusFilter },
              { label: "Pending", value: "pending" as StatusFilter },
              { label: "Approved", value: "approved" as StatusFilter },
              { label: "Rejected", value: "rejected" as StatusFilter },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === f.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Empty State OR Table */}
        {users.data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card text-card-foreground p-8 sm:p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No users yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              New users will appear here once they register. You'll be able to approve
              and manage them.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop/Tablet Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/50 text-muted-foreground border-b border-border">
                    <th className="p-4 font-semibold whitespace-nowrap">ID</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Name</th>
                    <th className="p-4 font-semibold whitespace-nowrap">Email</th>
                    <th className="p-4 font-semibold text-center">Role</th>
                    <th className="p-4 font-semibold">Barangay Permit</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAndSortedUsers.map((user) => {
                    const status = getUserStatus(user);
                    const isApproved = status === "approved";

                    const canApproveReject =
                      ["admin", "superadmin"].includes(auth.user.role) &&
                      status === "pending" &&
                      user.id !== auth.user.id;

                    const canEdit = canEditAnything && isApproved;
                    const canDelete =
                      canEditAnything &&
                      isApproved &&
                      user.id !== auth.user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border transition-colors ${
                          status === "pending"
                            ? "bg-amber-50/60 dark:bg-amber-950/20"
                            : status === "rejected"
                            ? "bg-rose-50/60 dark:bg-rose-950/20"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <td className="p-4 align-middle">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            #{user.id}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="max-w-[200px] lg:max-w-[250px] truncate font-medium">
                            {user.name}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[280px] truncate text-muted-foreground">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {user.email}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="p-4 align-middle">
                          {user.barangay_permit ? (
                            <a
                              href={`/storage/${user.barangay_permit}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block group"
                            >
                              <img
                                src={`/storage/${user.barangay_permit}`}
                                alt="Barangay Permit"
                                className="h-20 w-20 rounded-lg border-2 border-border object-cover transition-transform group-hover:scale-105 group-hover:border-primary"
                              />
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic text-xs">
                              <ImageIcon className="w-4 h-4" />
                              No image
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-middle text-center">
                          <StatusBadge status={status} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {canApproveReject && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => handleApprove(user)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(user)}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(user)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}

                            {canDelete && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteDialog(user)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            )}

                            {!canApproveReject && !canEdit && !canDelete && (
                              <span className="text-xs text-muted-foreground italic">
                                No actions
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredAndSortedUsers.map((user) => {
                const status = getUserStatus(user);
                const isApproved = status === "approved";

                const canApproveReject =
                  ["admin", "superadmin"].includes(auth.user.role) &&
                  status === "pending" &&
                  user.id !== auth.user.id;

                const canEdit = canEditAnything && isApproved;
                const canDelete =
                  canEditAnything &&
                  isApproved &&
                  user.id !== auth.user.id;

                return (
                  <div
                    key={user.id}
                    className={`rounded-xl border border-border bg-card p-4 shadow-sm transition-all ${
                      status === "pending"
                        ? "bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
                        : status === "rejected"
                        ? "bg-rose-50/60 dark:bg-rose-950/20 ring-2 ring-rose-500/20"
                        : ""
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            #{user.id}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                        <h3 className="font-semibold text-base truncate">
                          {user.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 truncate">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                      <RoleBadge role={user.role} />
                    </div>

                    {/* Barangay Permit */}
                    {user.barangay_permit && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Barangay Permit:
                        </p>
                        <a
                          href={`/storage/${user.barangay_permit}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <img
                            src={`/storage/${user.barangay_permit}`}
                            alt="Barangay Permit"
                            className="h-32 w-full rounded-lg border-2 border-border object-cover"
                          />
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                      {canApproveReject && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleApprove(user)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => openRejectDialog(user)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openEdit(user)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}

                      {!canApproveReject && !canEdit && !canDelete && (
                        <span className="text-xs text-muted-foreground italic w-full text-center py-2">
                          No actions available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {users.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {users.links.map((link, i) => (
              <Button
                key={i}
                size="sm"
                variant={link.active ? "default" : "outline"}
                disabled={!link.url}
                onClick={() => link.url && router.visit(link.url)}
                className="min-w-[2.5rem]"
              >
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </Button>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <Dialog open={true} onOpenChange={closeEdit}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit User: {editingUser.name}
                </DialogTitle>
                <DialogDescription>
                  Update user information and optionally upload a new barangay permit
                  image.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="Enter user name"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    value={data.role}
                    onChange={(e) => setData("role", e.target.value as Role)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                  {errors.role && (
                    <p className="text-xs text-red-500 mt-1">{errors.role}</p>
                  )}
                </div>

                {/* Current Barangay Permit preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Current Barangay Permit
                    <span className="text-[11px] text-muted-foreground">
                      (optional to change)
                    </span>
                  </Label>
                  <div className="w-full flex justify-center">
                    <div className="w-40 h-40 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {editingUser.barangay_permit ? (
                        <img
                          src={`/storage/${editingUser.barangay_permit}`}
                          alt="Barangay Permit"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[11px] italic">No image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* New Barangay Permit */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    New Barangay Permit (optional)
                  </Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setData(
                        "barangay_permit",
                        e.target.files && e.target.files.length > 0
                          ? e.target.files[0]
                          : null
                      )
                    }
                    className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100
                    dark:file:bg-violet-900/40 dark:file:text-violet-200
                    file:cursor-pointer"
                  />
                  {errors.barangay_permit && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.barangay_permit}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Leave this empty if you don&apos;t want to change the barangay
                    permit image.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={closeEdit}
                    className="w-full sm:w-auto"
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="w-full sm:w-auto"
                    disabled={processing}
                    type="button"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {processing ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Reject User Dialog */}
        {rejectUserTarget && (
          <Dialog open={true} onOpenChange={closeRejectDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Reject User</DialogTitle>
                <DialogDescription>
                  Provide an optional reason for rejecting{" "}
                  <span className="font-semibold">{rejectUserTarget.name}</span>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Reason (optional)</Label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Information provided is incomplete..."
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={closeRejectDialog}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={submitReject}
                    disabled={rejectProcessing}
                    className="w-full sm:w-auto"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {rejectProcessing ? "Rejecting..." : "Confirm Reject"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete User Dialog with type-to-confirm */}
        {deleteUserTarget && (
          <Dialog open={true} onOpenChange={closeDeleteDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  This will permanently delete the account of{" "}
                  <span className="font-semibold">{deleteUserTarget.name}</span>. This
                  action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <p className="text-sm text-muted-foreground">
                  To confirm, please type{" "}
                  <span className="font-mono font-semibold">DELETE</span> in all caps.
                </p>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                />

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={closeDeleteDialog}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={submitDelete}
                    disabled={
                      deleteProcessing || deleteConfirmText.trim() !== "DELETE"
                    }
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deleteProcessing ? "Deleting..." : "Delete User"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}

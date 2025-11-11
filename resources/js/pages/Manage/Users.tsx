import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Manage Users", href: "/Users" }];

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  barangay_permit: string | null;
  is_approved: boolean | number; // allow 0/1 or true/false
}

interface Paginated<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
}

export default function Users() {
  const { auth, users } = usePage<{ auth: { user: User }; users: Paginated<User> }>().props;
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user" });

  /* ===================== Permissions ===================== */
  const canEditAnything = auth.user.role === "superadmin";

  /* ===================== Approve / Reject ===================== */
  const handleApprove = (id: number) => {
    router.post(`/users/${id}/approve`, {}, { preserveScroll: true });
  };

  const handleReject = (id: number) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    router.post(`/users/${id}/reject`, {}, { preserveScroll: true });
  };

  /* ===================== Delete User ===================== */
  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;

    router.delete(`/users/${id}`, {
      preserveScroll: true,
      onSuccess: () => {
        router.reload({ only: ["users"] });
      },
    });
  };

  /* ===================== Edit Modal ===================== */
  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = () => {
    if (!editingUser) return;
    router.put(`/users/${editingUser.id}`, form, {
      preserveScroll: true,
      onSuccess: () => {
        setEditingUser(null);
        router.reload({ only: ["users"] });
      },
      onError: (errors) => {
        console.error("Update failed:", errors);
      },
    });
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
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>
        <Shield className="w-3 h-3 mr-1" />
        {role}
      </span>
    );
  };

  const StatusBadge = ({ approved }: { approved: boolean }) => {
    return approved ? (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-400/20">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </span>
    );
  };

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
            <span className="font-semibold text-lg">{users.data.length}</span>
          </div>
        </div>

        {/* Empty State */}
        {users.data.length === 0 ? (
          <div className="rounded-xl border border-border bg-card text-card-foreground p-8 sm:p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No users yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              New users will appear here once they register. You'll be able to approve and manage them.
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
                  {users.data.map((user) => {
                    const isApproved = !!user.is_approved;

                    const canApproveReject =
                      ["admin", "superadmin"].includes(auth.user.role) &&
                      !isApproved &&
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
                          !isApproved
                            ? "bg-amber-50/60 dark:bg-amber-950/20"
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
                          <StatusBadge approved={isApproved} />
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {canApproveReject && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() => handleApprove(user.id)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(user.id)}
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
                                onClick={() => handleDelete(user.id)}
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
              {users.data.map((user) => {
                const isApproved = !!user.is_approved;

                const canApproveReject =
                  ["admin", "superadmin"].includes(auth.user.role) &&
                  !isApproved &&
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
                      !isApproved
                        ? "bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
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
                          <StatusBadge approved={isApproved} />
                        </div>
                        <h3 className="font-semibold text-base truncate">{user.name}</h3>
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
                        <p className="text-xs text-muted-foreground mb-2">Barangay Permit:</p>
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
                            onClick={() => handleApprove(user.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(user.id)}
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
                          onClick={() => handleDelete(user.id)}
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
          <Dialog open={true} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit User: {editingUser.name}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter user name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as User["role"] })
                    }
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="w-full sm:w-auto"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save Changes
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

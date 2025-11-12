import React, { useState, useMemo } from "react";
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
  ClipboardList,
  PawPrint,
  User as UserIcon,
  MapPin,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  Edit,
  Check,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { DOG_BREEDS, CAT_BREEDS } from "@/components1/breed";
import { route } from "ziggy-js";
import { useConfirmDialog } from "@/components1/confirm-dialog";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Manage Posts", href: "/manage" }];

interface Owner {
  id: number;
  name: string;
  email?: string;
}

type Status =
  | "waiting_for_approval"
  | "available"
  | "pending"
  | "adopted"
  | "rejected"
  | string;

interface Adoption {
  id: number;
  pname: string;
  status: Status;
  category: "cat" | "dog" | string;
  gender: "male" | "female" | string;
  location: string | null;
  created_at: string;
  user: Owner | null;
  age?: number | null;
  age_unit?: "months" | "years" | string | null;
  breed?: string | null;
  color?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_path?: string | null;
}

interface Paginated<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
}

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
};

type Filters = {
  q?: string | null;
  status?: string | null;
  category?: string | null;
};

type StatusFilter =
  | "all"
  | "waiting_for_approval"
  | "available"
  | "pending"
  | "adopted"
  | "rejected";

type CategoryFilter = "all" | "dog" | "cat";

const ALL_BREEDS = [...DOG_BREEDS, ...CAT_BREEDS];

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="18" font-family="system-ui">No Photo</text></svg>';

export default function ManageIndex() {
  const { auth, adoptions, filters } = usePage<{
    auth: { user: AuthUser };
    adoptions: Paginated<Adoption>;
    filters: Filters;
  }>().props;

  const [editingPost, setEditingPost] = useState<Adoption | null>(null);
  const [form, setForm] = useState({
    pname: "",
    gender: "male",
    age: "",
    age_unit: "years",
    category: "dog",
    breed: "",
    custom_breed: "",
    color: "",
    location: "",
    description: "",
    image: null as File | null, // 🔥 new image field
  });

  const isSuperadmin = auth.user.role === "superadmin";

  const { confirm } = useConfirmDialog();

  /* ===================== Status Helpers ===================== */

  const StatusBadge = ({ status }: { status: Status }) => {
    if (status === "waiting_for_approval") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Waiting for approval
        </span>
      );
    }
    if (status === "available") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    }
    if (status === "adopted") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/30">
          <PawPrint className="w-3 h-3 mr-1" />
          Adopted
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/30">
        {status}
      </span>
    );
  };

  const genderLabel = (g: string) => {
    if (g === "male") return "Male";
    if (g === "female") return "Female";
    return g;
  };

  const categoryLabel = (c: string) => {
    if (c === "dog") return "Dog";
    if (c === "cat") return "Cat";
    return c;
  };

  const currentBreedList = form.category === "cat" ? CAT_BREEDS : DOG_BREEDS;

  const breedOptions = (() => {
    const base = [...currentBreedList];
    if (form.breed && !base.includes(form.breed as (typeof base)[number])) {
      base.push(form.breed);
    }
    return base;
  })();

  const canApproveReject = (post: Adoption) =>
    ["admin", "superadmin"].includes(auth.user.role) &&
    post.status === "waiting_for_approval";

  const canEdit = (post: Adoption) =>
    isSuperadmin &&
    post.status !== "waiting_for_approval" &&
    post.status !== "rejected";

  const canDeletePost = (post: Adoption) =>
    isSuperadmin && post.status !== "waiting_for_approval";

  /* ===================== Life Stage Helper ===================== */

  const getLifeStage = (post: Adoption): string | null => {
    if (post.age == null || isNaN(post.age)) return null;

    const unit = (post.age_unit || "years").toLowerCase();
    let years = post.age;

    if (unit.includes("month")) {
      years = post.age / 12;
    }

    const category = (post.category || "").toLowerCase();

    if (category === "dog") {
      if (years < 1) return "Puppy";
      if (years <= 7) return "Adult";
      return "Senior";
    }

    if (category === "cat") {
      if (years < 1) return "Kitten";
      if (years <= 7) return "Adult";
      return "Senior";
    }

    if (years < 1) return "Young";
    if (years <= 7) return "Adult";
    return "Senior";
  };

  /* ===================== Status Summary ===================== */

  const statusSummary = useMemo(() => {
    const base = {
      total: adoptions.data.length,
      waiting_for_approval: 0,
      available: 0,
      pending: 0,
      adopted: 0,
      rejected: 0,
    };

    adoptions.data.forEach((p) => {
      if (p.status === "waiting_for_approval") base.waiting_for_approval++;
      else if (p.status === "available") base.available++;
      else if (p.status === "pending") base.pending++;
      else if (p.status === "adopted") base.adopted++;
      else if (p.status === "rejected") base.rejected++;
    });

    return base;
  }, [adoptions.data]);

  /* ===================== Filters (category + status) ===================== */

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (filters?.status as StatusFilter) || "all"
  );

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (filters?.category as CategoryFilter) || "all"
  );

  const applyFilters = (nextStatus?: StatusFilter, nextCategory?: CategoryFilter) => {
    const s = nextStatus ?? statusFilter;
    const c = nextCategory ?? categoryFilter;

    setStatusFilter(s);
    setCategoryFilter(c);

    const params: Record<string, string> = {};

    if (s !== "all") {
      params.status = s;
    }

    if (c !== "all") {
      params.category = c;
    }

    if (filters?.q) {
      params.q = String(filters.q);
    }

    router.get(route("manage.index"), params, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  /* ===================== Actions ===================== */

  const handleApprove = async (post: Adoption) => {
    const ok = await confirm({
      title: "Approve Adoption Post",
      message: `Approve adoption post of ${post.pname}?`,
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "success",
    });

    if (!ok) return;

    router.post(
      route("manage.adoption.approve", post.id),
      {},
      {
        preserveScroll: true,
      }
    );
  };

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<Adoption | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectProcessing, setRejectProcessing] = useState(false);

  const openRejectDialog = (post: Adoption) => {
    setRejectTarget(post);
    setRejectReason("");
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
      route("manage.adoption.reject", rejectTarget.id),
      {
        reason: rejectReason || "",
      },
      {
        preserveScroll: true,
        onFinish: () => setRejectProcessing(false),
        onSuccess: () => {
          closeRejectDialog();
          router.reload({ only: ["adoptions"] });
        },
      }
    );
  };

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Adoption | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteProcessing, setDeleteProcessing] = useState(false);

  const openDeleteDialog = (post: Adoption) => {
    setDeleteTarget(post);
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

    router.delete(route("manage.adoption.destroy", deleteTarget.id), {
      preserveScroll: true,
      onFinish: () => setDeleteProcessing(false),
      onSuccess: () => {
        closeDeleteDialog();
        router.reload({ only: ["adoptions"] });
      },
    });
  };

  const openEdit = (post: Adoption) => {
    const existingBreed = post.breed || "";
    const isInList =
      existingBreed &&
      ALL_BREEDS.includes(existingBreed as (typeof ALL_BREEDS)[number]);

    setEditingPost(post);
    setForm({
      pname: post.pname || "",
      gender: (post.gender as string) || "male",
      age: post.age != null ? String(post.age) : "",
      age_unit: (post.age_unit as string) || "years",
      category: (post.category as string) || "dog",
      breed: isInList ? existingBreed : existingBreed ? "Other / Not Sure" : "",
      custom_breed: !isInList ? existingBreed : "",
      color: post.color || "",
      location: post.location || "",
      description: post.description || "",
      image: null, // 🔥 reset image on open
    });
  };

  const handleSave = () => {
    if (!editingPost) return;

    const finalBreed =
      form.breed === "Other / Not Sure"
        ? form.custom_breed || "Other / Not Sure"
        : form.breed || "Other / Not Sure";

    // 🔥 Use multipart/form-data so we can send optional image
    router.post(
      route("manage.adoption.update", editingPost.id),
      {
        _method: "PUT",
        pname: form.pname,
        gender: form.gender,
        age: form.age ? Number(form.age) : 1,
        age_unit: form.age_unit,
        category: form.category,
        breed: finalBreed,
        color: form.color || null,
        location: form.location || null,
        description: form.description || null,
        image: form.image, // 🔥 optional new image
      },
      {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          setEditingPost(null);
          router.reload({ only: ["adoptions"] });
        },
      }
    );
  };

  /* ===================== Render ===================== */

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manage Posts" />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header + Total + Summary */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
                <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                Manage Adoption Posts
              </h1>
            </div>

            <div className="flex items-center gap-2 text-sm text-right">
              <span className="text-muted-foreground">Total Posts:</span>
              <span className="font-semibold text-lg">
                {statusSummary.total}
              </span>
            </div>
          </div>

          {/* FILTER BAR: Category + Status */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-1 mt-1">
                Category:
              </span>

              {[
                { label: "All", value: "all" as CategoryFilter },
                { label: "Dogs", value: "dog" as CategoryFilter },
                { label: "Cats", value: "cat" as CategoryFilter },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => applyFilters(undefined, c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    categoryFilter === c.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-1 mt-1">
                Status:
              </span>

              {[
                { label: "All", value: "all" as StatusFilter },
                { label: "Waiting", value: "waiting_for_approval" as StatusFilter },
                { label: "Available", value: "available" as StatusFilter },
                { label: "Pending", value: "pending" as StatusFilter },
                { label: "Adopted", value: "adopted" as StatusFilter },
                { label: "Rejected", value: "rejected" as StatusFilter },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => applyFilters(s.value, undefined)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    statusFilter === s.value
                      ? "bg-primary/90 text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state */}
        {adoptions.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card text-card-foreground p-8 sm:p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <PawPrint className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No posts yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              New adoption posts will appear here for review and approval.
            </p>
          </div>
        ) : (
          <>
            {/* CARD GRID – ALL BREAKPOINTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {adoptions.data.map((post) => {
                const waiting = post.status === "waiting_for_approval";
                const photo = post.image_url || PLACEHOLDER;
                const _canApproveReject = canApproveReject(post);
                const _canEdit = canEdit(post);
                const _canDelete = canDeletePost(post);
                const lifeStage = getLifeStage(post);

                return (
                  <div
                    key={post.id}
                    className={`group rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-sm transition-all flex flex-col overflow-hidden ${
                      waiting
                        ? "bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
                        : "hover:shadow-md hover:border-primary/40"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative w-full h-40 bg-muted overflow-hidden">
                      {photo ? (
                        <img
                          src={photo}
                          alt={post.pname}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          onError={(e) => {
                            if (e.currentTarget.src !== PLACEHOLDER) {
                              e.currentTarget.src = PLACEHOLDER;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="font-mono text-[11px] bg-black/60 text-white px-2 py-0.5 rounded-full">
                          #{post.id}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      {/* Name + owner */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground truncate">
                            <PawPrint className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{post.pname}</span>
                          </div>

                          {post.user && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{post.user.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {categoryLabel(post.category)}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted">
                          {genderLabel(post.gender)}
                        </span>
                      </div>

                      {/* Status line */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          Status:
                        </span>
                        <StatusBadge status={post.status} />
                      </div>

                      {/* Location + Created */}
                      <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {post.location || "No location specified"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {new Date(post.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* DETAILS BOX – Age + Life Stage + Breed + Color + Desc */}
                      {(post.breed ||
                        post.age != null ||
                        post.color ||
                        post.description) && (
                        <div className="mt-3 mb-1 rounded-lg border border-border bg-background/70 px-3 py-2 space-y-1 text-xs">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {post.breed && (
                              <span className="text-muted-foreground">
                                <span className="font-semibold">Breed:</span>{" "}
                                {post.breed}
                              </span>
                            )}

                            {post.age != null && (
                              <span className="text-muted-foreground">
                                <span className="font-semibold">Age:</span>{" "}
                                {post.age} {post.age_unit || "years"}
                                {lifeStage && (
                                  <span className="ml-1 text-[11px] text-muted-foreground">
                                    ({lifeStage})
                                  </span>
                                )}
                              </span>
                            )}

                            {post.color && (
                              <span className="text-muted-foreground">
                                <span className="font-semibold">Color:</span>{" "}
                                {post.color}
                              </span>
                            )}
                          </div>

                          {post.description && (
                            <p className="text-[11px] text-muted-foreground mt-1 max-h-20 overflow-y-auto leading-snug">
                              {post.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 pt-3 pb-4 border-t border-border flex flex-wrap gap-2 mt-auto bg-card/90">
                      {_canApproveReject && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => handleApprove(post)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => openRejectDialog(post)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {!_canApproveReject && (
                        <>
                          {_canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEdit(post)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}

                          {_canDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => openDeleteDialog(post)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}

                          {!_canEdit && !_canDelete && (
                            <span className="text-xs text-muted-foreground italic w-full text-center py-1.5">
                              No actions available
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {adoptions.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {adoptions.links.map((link, i) => (
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
        {editingPost && (
          <Dialog open={true} onOpenChange={() => setEditingPost(null)}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Post: {editingPost.pname}
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {/* Pet Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pet Name</Label>
                  <Input
                    value={form.pname}
                    onChange={(e) =>
                      setForm({ ...form, pname: e.target.value })
                    }
                    placeholder="Enter pet name"
                  />
                </div>

                {/* Gender + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gender</Label>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.gender}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value as "dog" | "cat",
                        })
                      }
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                  </div>
                </div>

                {/* Age + Age Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.age}
                      onChange={(e) =>
                        setForm({ ...form, age: e.target.value })
                      }
                      placeholder="e.g. 2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Age Unit</Label>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={form.age_unit}
                      onChange={(e) =>
                        setForm({ ...form, age_unit: e.target.value })
                      }
                    >
                      <option value="years">Years</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                {/* Breed */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Breed{" "}
                    <span className="text-[11px] text-muted-foreground">
                      (based on category)
                    </span>
                  </Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={form.breed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        breed: e.target.value,
                        custom_breed:
                          e.target.value === "Other / Not Sure"
                            ? form.custom_breed
                            : "",
                      })
                    }
                  >
                    <option value="">Select breed</option>
                    {breedOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>

                  {form.breed === "Other / Not Sure" && (
                    <div className="space-y-1 pt-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Custom Breed
                      </Label>
                      <Input
                        value={form.custom_breed}
                        onChange={(e) =>
                          setForm({ ...form, custom_breed: e.target.value })
                        }
                        placeholder="Type the breed (e.g. Native Aspin mix)"
                      />
                    </div>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Color</Label>
                  <Input
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    placeholder="e.g. White, Brown"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="e.g. Valenzuela City"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <textarea
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[100px]"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe the pet, personality, requirements, etc."
                  />
                </div>

                {/* Current Image Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Current Photo{" "}
                    <span className="text-[11px] text-muted-foreground">
                      (optional to change)
                    </span>
                  </Label>
                  <div className="w-full flex justify-center">
                    <div className="w-40 h-40 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {editingPost.image_url ? (
                        <img
                          src={editingPost.image_url}
                          alt={editingPost.pname}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (e.currentTarget.src !== PLACEHOLDER) {
                              e.currentTarget.src = PLACEHOLDER;
                            }
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload New Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">New Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setForm((prev) => ({ ...prev, image: file }));
                    }}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-900/40 dark:file:text-violet-200 file:cursor-pointer"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Leave this empty if you don&apos;t want to change the photo.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setEditingPost(null)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="w-full sm:w-auto">
                    <Check className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Reject Adoption Dialog */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Reject Adoption Post
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provide an optional reason for rejecting{" "}
                  <span className="font-semibold">
                    {rejectTarget.pname || "this post"}
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
                    placeholder="e.g. Incomplete information or not eligible for listing..."
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

        {/* Delete Adoption Dialog */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  Delete Adoption Post
                </h2>
              </div>

              <div className="px-5 py-4 space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  This will permanently delete the adoption post of{" "}
                  <span className="font-semibold">
                    {deleteTarget.pname || "this post"}
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
      </div>
    </AppLayout>
  );
}

import React, { useState } from "react";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  is_approved?: boolean | number;
  is_rejected?: boolean | number;
  reject_reason?: string | null;
  barangay_permit?: string | null;
};

export default function PendingApproval() {
  const { auth, flash } = usePage<{
    auth: { user: AuthUser | null };
    flash: { success?: string; error?: string };
  }>().props;

  const user = auth?.user;
  const isRejected = !!user?.is_rejected;
  const isApproved = !!user?.is_approved;

  if (isApproved) {
    router.visit("/");
  }

  const existingPermitUrl = user?.barangay_permit
    ? `/storage/${user.barangay_permit}`
    : null;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, setData, post, processing, errors, reset } = useForm<{
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    barangay_permit: File | null;
  }>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    password_confirmation: "",
    barangay_permit: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    post(route("pending.resubmit"), {
      forceFormData: true,
      onSuccess: () => {
        reset("password", "password_confirmation", "barangay_permit");
        setPreviewUrl(null);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setData("barangay_permit", file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <Head title="Pending Approval" />

      {/* Fullscreen overlay – WALANG click-outside close */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        {/* Card – scrollable content lang sa loob */}
        <div className="w-full max-w-xl max-h-[90vh] bg-background rounded-2xl shadow-lg border border-border p-6 sm:p-7 overflow-y-auto">
          {/* HEADER */}
          <div className="space-y-2 text-center mb-3">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {isRejected
                ? "Account Review Required"
                : "⏳ Waiting for Admin Approval"}
            </h2>

            {!isRejected && (
              <p className="text-sm text-muted-foreground">
                Your registration request has been submitted.
                <br className="hidden sm:block" />
                Please wait while the admin reviews your account.
              </p>
            )}
          </div>

          {/* FLASH MESSAGES */}
          <div className="space-y-2 mb-3">
            {flash?.success && (
              <div className="rounded-md bg-emerald-50 text-emerald-700 px-3 py-2 text-sm border border-emerald-200">
                {flash.success}
              </div>
            )}
            {flash?.error && (
              <div className="rounded-md bg-rose-50 text-rose-700 px-3 py-2 text-sm border border-rose-200">
                {flash.error}
              </div>
            )}
          </div>

          {/* ================= REJECTED VIEW ================= */}
          {isRejected && (
            <div className="space-y-5">
              {/* Reason panel */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-900">
                <p className="font-semibold">
                  Your account was rejected by an administrator.
                </p>
                {user?.reject_reason && (
                  <p className="mt-2">
                    <span className="font-medium">Reason:</span>{" "}
                    <span>{user.reject_reason}</span>
                  </p>
                )}
                <p className="mt-2 text-[11px] text-rose-700/80">
                  Please correct your information below. After you resubmit,
                  your status will go back to{" "}
                  <span className="font-semibold">Pending</span>.
                </p>
              </div>

              {/* CURRENT / PREVIEW IMAGE (scrollable area) */}
              <div className="space-y-3">
                {previewUrl && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      New Barangay Permit Preview:
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background">
                      <img
                        src={previewUrl}
                        alt="New Barangay Permit Preview"
                        className="w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {!previewUrl && existingPermitUrl && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Current Barangay Permit:
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background">
                      <img
                        src={existingPermitUrl}
                        alt="Current Barangay Permit"
                        className="w-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Uploading a new file will replace this permit.
                    </p>
                  </div>
                )}
              </div>

              {/* FORM (lahat required) */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-xl border border-border bg-muted/30 px-4 py-4"
              >
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    autoComplete="name"
                    required
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    autoComplete="email"
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500">{errors.email}</p>
                  )}
                </div>

                {/* Password + Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      Password <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    {errors.password && (
                      <p className="text-xs text-rose-500">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation">
                      Confirm Password{" "}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={data.password_confirmation}
                      onChange={(e) =>
                        setData("password_confirmation", e.target.value)
                      }
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                {/* Barangay Permit */}
                <div className="space-y-1.5">
                  <Label htmlFor="barangay_permit">
                    Barangay Permit <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="barangay_permit"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                  {errors.barangay_permit && (
                    <p className="text-xs text-rose-500">
                      {errors.barangay_permit}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Upload a clear photo or scan of your barangay permit (max
                    2&nbsp;MB).
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-border mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.post("/logout")}
                    className="w-full sm:w-auto"
                  >
                    Logout
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full sm:w-auto"
                  >
                    {processing ? "Submitting..." : "Submit for Review Again"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ================= PENDING ONLY ================= */}
          {!isRejected && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">
                  Your account is currently under review.
                </p>
                <p className="mt-1 text-[11px] text-amber-800/80">
                  You will be notified once an administrator has approved your
                  account.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.post("/logout")}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

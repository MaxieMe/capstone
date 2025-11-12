// resources/js/Pages/Manage/TransactionHistory.tsx
import React from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  name: string;
  email?: string | null;
};

type Adoption = {
  id: number;
  pname: string;
  status: string;
  category?: string | null;
  user?: User | null; // owner
};

type Inquiry = {
  id: number;
  adoption?: Adoption | null;
  requester_id?: number | null;
  requester_name: string;
  requester_email: string;
  requester_phone?: string | null;
  visit_at?: string | null;
  meetup_location?: string | null;
  message?: string | null;
  status: string;
  created_at: string;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type PageProps = {
  inquiries: {
    data: Inquiry[];
    links: PaginationLink[];
  };
  filters?: {
    q?: string;
    status?: string;
  };
};

export default function TransactionHistory({ inquiries, filters }: PageProps) {
  const { props } = usePage() as any;
  const user = props?.auth?.user;

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const formatStatus = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: "Dashboard", href: route("dashboard") },
        { title: "Transaction History", href: route("manage.transaction.history") },
      ]}
    >
      <Head title="Adoption Inquiries History" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Adoption Inquiries History
            </h1>
          </div>
          <Link
            href={route("manage.index")}
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            ← Back to Manage
          </Link>
        </div>

        {/* Filter bar (simple) */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow p-4">
          <form
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
            method="get"
          >
            <div className="flex-1 w-full">
              <input
                type="text"
                name="q"
                defaultValue={filters?.q ?? ""}
                placeholder="Search by requester or pet name..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              />
            </div>
            <div>
              <select
                name="status"
                defaultValue={filters?.status ?? ""}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="sent">Sent</option>
                <option value="read">Read</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Pet</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Requester</th>
                  <th className="px-4 py-3 text-left">Visit / Location</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {inquiries.data.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      No inquiries found.
                    </td>
                  </tr>
                )}

                {inquiries.data.map((inq) => (
                  <tr
                    key={inq.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  >
                    {/* Pet */}
                    <td className="px-4 py-3 align-top">
                      {inq.adoption ? (
                        <div>
                          <Link
                            href={route("adoption.show", inq.adoption.id)}
                            className="font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                          >
                            {inq.adoption.pname}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {inq.adoption.category
                              ? inq.adoption.category.toUpperCase()
                              : "—"}{" "}
                            • {inq.adoption.status}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (Pet deleted)
                        </span>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-3 align-top">
                      {inq.adoption?.user ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {inq.adoption.user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {inq.adoption.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          (No owner)
                        </span>
                      )}
                    </td>

                    {/* Requester */}
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {inq.requester_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {inq.requester_email}
                        </div>
                        {inq.requester_phone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {inq.requester_phone}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Visit / Location */}
                    <td className="px-4 py-3 align-top">
                      <div className="text-xs text-gray-700 dark:text-gray-200">
                        <div>
                          <span className="font-semibold">Visit:</span>{" "}
                          {formatDateTime(inq.visit_at)}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold">Location:</span>{" "}
                          {inq.meetup_location || "—"}
                        </div>
                      </div>
                      {inq.message && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                          <span className="font-semibold">Message:</span>{" "}
                          {inq.message}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 align-top">
                      <span
                        className={
                          "inline-flex px-2 py-1 rounded-full text-xs font-semibold " +
                          (inq.status === "submitted"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : inq.status === "sent"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : inq.status === "read"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200")
                        }
                      >
                        {formatStatus(inq.status)}
                      </span>
                    </td>

                    {/* Submitted At */}
                    <td className="px-4 py-3 align-top text-xs text-gray-600 dark:text-gray-300">
                      {formatDateTime(inq.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {inquiries.links?.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-center gap-1">
              {inquiries.links.map((link, i) => (
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
        </div>
      </div>
    </AppLayout>
  );
}

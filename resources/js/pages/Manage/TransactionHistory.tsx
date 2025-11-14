// resources/js/Pages/Manage/TransactionHistory.tsx
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

type User = {
    id: number;
    name: string;
    email?: string | null;
};

type Adoption = {
    id: number;
    pet_name: string;
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
    location?: string | null;
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
        if (!value) return '—';
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
                { title: 'Dashboard', href: route('dashboard') },
                {
                    title: 'Transaction History',
                    href: route('manage.transaction.history'),
                },
            ]}
        >
            <Head title="Adoption Inquiries History" />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                            Adoption Inquiries History
                        </h1>
                    </div>
                    <Link
                        href={route('manage.index')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                        ← Back to Manage
                    </Link>
                </div>

                {/* Filter bar (simple) */}
                <div className="mb-6 rounded-xl bg-white p-4 shadow dark:bg-gray-800">
                    <form
                        className="flex flex-col items-start gap-3 sm:flex-row sm:items-center"
                        method="get"
                    >
                        <div className="w-full flex-1">
                            <input
                                type="text"
                                name="q"
                                defaultValue={filters?.q ?? ''}
                                placeholder="Search by requester or pet name..."
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <select
                                name="status"
                                defaultValue={filters?.status ?? ''}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
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
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                            Filter
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left">Pet</th>
                                    <th className="px-4 py-3 text-left">
                                        Owner
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Requester
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Visit / Location
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                        Submitted At
                                    </th>
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
                                                        href={route(
                                                            'adoption.show',
                                                            inq.adoption.id,
                                                        )}
                                                        className="font-semibold text-violet-600 hover:underline dark:text-violet-400"
                                                    >
                                                        {inq.adoption.pet_name}
                                                    </Link>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {inq.adoption.category
                                                            ? inq.adoption.category.toUpperCase()
                                                            : '—'}{' '}
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
                                                        {
                                                            inq.adoption.user
                                                                .email
                                                        }
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
                                                    <span className="font-semibold">
                                                        Visit:
                                                    </span>{' '}
                                                    {formatDateTime(
                                                        inq.visit_at,
                                                    )}
                                                </div>
                                                <div className="mt-1">
                                                    <span className="font-semibold">
                                                        Location:
                                                    </span>{' '}
                                                    {inq.location || '—'}
                                                </div>
                                            </div>
                                            {inq.message && (
                                                <div className="mt-2 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-semibold">
                                                        Message:
                                                    </span>{' '}
                                                    {inq.message}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 align-top">
                                            <span
                                                className={
                                                    'inline-flex rounded-full px-2 py-1 text-xs font-semibold ' +
                                                    (inq.status === 'submitted'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                        : inq.status === 'sent'
                                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                          : inq.status ===
                                                              'read'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200')
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
                        <div className="flex justify-center gap-1 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                            {inquiries.links.map((link, i) => (
                                <Button
                                    key={i}
                                    size="sm"
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    disabled={!link.url}
                                    onClick={() =>
                                        link.url && router.visit(link.url)
                                    }
                                    className="min-w-[2.5rem]"
                                >
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

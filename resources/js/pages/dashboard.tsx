import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

type UserLite = {
  id: number;
  name: string;
  email?: string | null;
  created_at?: string;
};

type AdoptionLite = {
  id: number;
  pname: string;
  status: 'available' | 'pending' | 'adopted' | string;
  created_at?: string;
  image_url?: string | null;
  user?: { id: number; name: string } | null;
};

type Totals = {
  adoptions: number;
  available: number;
  pending: number;
  adopted: number;
  users: number;      // ✅ add this
};

type CategorySplit = { cat: number; dog: number };
type Trend12mPoint = { label: string; count: number };
type Trend7dPoint = { date: string; count: number };
type TrendCategoryPoint = { label: string; cat: number; dog: number };
type BreedItem = { breed: string; total: number };

export default function Dashboard({

  totals,
  byCategory,
  topBreeds,
  recentAdoptions,
  pendingUsers,
  trend12m,
  trend7d,
  trendByCategory,
}: {
  totals: Totals;
  byCategory: CategorySplit;
  topBreeds: BreedItem[];
  recentAdoptions: AdoptionLite[];
  pendingUsers: UserLite[];
  trend12m: Trend12mPoint[];
  trend7d: Trend7dPoint[];
  trendByCategory: TrendCategoryPoint[];
}) {
  const pieData = [
    { name: '🐱 Cats', value: byCategory.cat },
    { name: '🐶 Dogs', value: byCategory.dog },
  ];
  const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#f43f5e'];
  const max7d = Math.max(5, ...trend7d.map(t => t.count));
   const totalPosts = totals.adoptions || 0;
  const adoptionRate =
    totalPosts > 0 ? Math.round((totals.adopted / totalPosts) * 100) : 0;

  const openPosts = (totals.available || 0) + (totals.pending || 0);
  const pendingUsersCount = pendingUsers ? pendingUsers.length : 0;

  const last7DaysTotal = trend7d.reduce((sum, d) => sum + d.count, 0);

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('dashboard') }]}>
      <Head title="Dashboard" />

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎯 Admin Dashboard
            </h1>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={route('adoption.index')}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 shadow-lg transition-all"
            >
              📊 View Adoption
            </Link>
          </div>
        </div>
      </div>



      {/* KPI Cards */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <KpiCard title="Total Posts" value={totals.adoptions} subtitle="All-time" icon="📦" />
          <KpiCard title="Available" value={totals.available} subtitle="Open" icon="✅" />
          <KpiCard title="Pending" value={totals.pending} subtitle="In progress" icon="⏳" />
          <KpiCard title="Adopted" value={totals.adopted} subtitle="Success" icon="❤️" />
          {/* ✅ new total users card (reads totals.users) */}
          <KpiCard title="Users" value={totals.users} subtitle="Total users" icon="👤" />
        </div>
      </div>

            {/* Quick Actions */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 lg:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                ⚡ Quick Actions
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                Jump straight into the most common admin tasks.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <Link
              href={route('manage.index')}
              className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3 text-[11px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-violet-50 hover:border-violet-400 dark:hover:bg-violet-900/30 transition-all"
            >
              🐶 Manage Posts
            </Link>

            <Link
              href={route('admin.users')}
              className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3 text-[11px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-violet-50 hover:border-violet-400 dark:hover:bg-violet-900/30 transition-all"
            >
              👥 Manage Users
            </Link>

            <Link
              href={route('manage.transaction.history')}
              className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3 text-[11px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-violet-50 hover:border-violet-400 dark:hover:bg-violet-900/30 transition-all"
            >
              📑 Transaction History
            </Link>

            <Link
              href={route('sponsor.index')}
              className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 sm:py-3 text-[11px] sm:text-xs lg:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-violet-50 hover:border-violet-400 dark:hover:bg-violet-900/30 transition-all"
            >
              💳 Sponsor Requests
            </Link>
          </div>
        </div>
      </div>


      {/* Charts Row 1: 12m Line + Category Pie */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
              📈 Posts in the last 12 months
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Monthly trend</p>
          </div>
          <div className="h-60 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend12m} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">🐾 By Category</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Distribution</p>
          </div>
          <div className="h-60 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label={{ fontSize: 12 }}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">📊 Monthly by Category</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Cats vs Dogs</p>
          </div>
          <div className="h-60 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="label" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="cat" name="🐱 Cats" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="dog" name="🐶 Dogs" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-day mini bars */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">🔥 New Posts (Last 7 days)</h2>
            <span className="text-xs sm:text-sm text-gray-500">per day</span>
          </div>

          <MiniBars trend7d={trend7d} max7d={max7d} />
        </div>
      </div>

      {/* Pending approvals + Recent Adoptions */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending approvals */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">⏳ Pending Approvals</h2>
            <Link href={route('admin.users')} className="text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-semibold">Manage →</Link>
          </div>
          {pendingUsers && pendingUsers.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 flex-1 overflow-y-auto">
              {pendingUsers.map(u => (
                <li key={u.id} className="py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 px-1 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-white font-bold grid place-items-center">
                      {u.name?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate">{u.name}</div>
                      <div className="text-xs text-gray-500 truncate">@{u.email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap ml-2">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No pending users 🎉</div>
          )}
        </div>

        {/* Recent Adoptions */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">🐾 Recent Adoptions</h2>
            <Link href={route('adoption.index')} className="text-xs sm:text-sm text-violet-600 hover:text-violet-700 font-semibold">View all →</Link>
          </div>

          {recentAdoptions && recentAdoptions.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 overflow-y-auto">
              {recentAdoptions.map((pet) => {
                const badge =
                  pet.status === 'adopted' ? 'bg-green-500'
                  : pet.status === 'pending' ? 'bg-yellow-500'
                  : 'bg-emerald-500';
                return (
                  <Link
                    key={pet.id}
                    href={route('adoption.show', pet.id)}
                    className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105 transition-all duration-200 bg-white dark:bg-gray-800"
                  >
                    <div className="h-24 sm:h-28 md:h-32 bg-gray-100 dark:bg-gray-700 overflow-hidden relative grid place-items-center">
                      {pet.image_url ? (
                        <img src={pet.image_url} alt={pet.pname} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : <div className="text-2xl sm:text-3xl">🐾</div>}
                      <span className={`absolute top-2 right-2 text-[9px] sm:text-xs text-white px-2 py-1 rounded-full font-bold ${badge}`}>
                        {pet.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-xs sm:text-sm truncate text-gray-900 dark:text-white">{pet.pname}</div>
                      <div className="mt-1 text-[10px] sm:text-xs text-gray-500">by {pet.user?.name ?? 'Unknown'}</div>
                      <div className="mt-1 text-[9px] sm:text-xs text-gray-400">{pet.created_at ? new Date(pet.created_at).toLocaleString() : ''}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No recent posts yet.</div>
          )}
        </div>
      </div>

      {/* Top Breeds */}
<div className="px-4 sm:px-6 lg:px-8 mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4">🏆 Top Breeds</h2>
  {topBreeds && topBreeds.length ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {topBreeds.map((breed, i) => (
        <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">{breed.breed}</div>
              {/* Conditional pluralization for posts */}
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                {breed.total} {breed.total === 1 ? 'post' : 'posts'}
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-violet-600">#{i + 1}</div>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
              style={{ width: `${topBreeds.length > 0 ? (breed.total / topBreeds[0].total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center text-gray-500 py-8 text-sm">No breeds data yet.</div>
  )}
</div>
    </AppLayout>
  );
}

function KpiCard({ title, value, subtitle, icon }: { title: string; value: number; subtitle?: string; icon?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md hover:shadow-lg transition-all p-3 sm:p-4 border border-gray-100 dark:border-gray-700 group">
      <div className="text-lg sm:text-2xl mb-2">{icon}</div>
      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</div>
      <div className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mt-1">
        {value}
      </div>
      {subtitle && <div className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function MiniBars({ trend7d, max7d }: { trend7d: Trend7dPoint[]; max7d: number }) {
  return (
    <div className="h-44 flex items-end gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
      {trend7d.map((t) => {
        const pct = max7d ? Math.round((t.count / max7d) * 100) : 0;
        return (
          <div key={t.date} className="flex-1 flex flex-col items-center justify-end">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-purple-500 hover:shadow-lg transition-all"
              style={{ height: `${Math.max(pct, 8)}%` }}
              title={`${t.count} posts`}
            />
            <div className="mt-2 text-[10px] sm:text-xs text-gray-500">
              {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-semibold">{t.count}</div>
          </div>
        );
      })}
    </div>
  );
}

// resources/js/pages/system/index.tsx
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function SystemPage({
  app,
  cache,
  disk,
}: {
  app: {
    name: string;
    env: string;
    debug: boolean;
    url: string;
    timezone: string;
    locale: string;
    maintenance: boolean;
    laravel: string;
    php: string;
    db_driver: string;
    db_version?: string | null;
  };
  cache: { driver: string; prefix?: string };
  disk: { public_exists: boolean };
}) {
  const doPost = (name: string, data?: any) => {
    router.post(route(name), data ?? {}, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'System Control', href: route('system.index') }]}>
      <Head title="System Control" />

      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              System Control
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Superadmin tools for maintenance, caches, and diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {app.maintenance ? (
              <button
                onClick={() => doPost('system.maintenance', { action: 'up' })}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow"
              >
                Disable Maintenance
              </button>
            ) : (
              <button
                onClick={() => doPost('system.maintenance', { action: 'down' })}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow"
              >
                Enable Maintenance
              </button>
            )}
            <button
              onClick={() => doPost('system.cache.clear')}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear Caches
            </button>
            <button
              onClick={() => doPost('system.cache.warm')}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Rebuild Caches
            </button>
            <button
              onClick={() => doPost('system.queue.restart')}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              queue:restart
            </button>
            <button
              onClick={() => doPost('system.storage.link')}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 shadow"
            >
              storage:link
            </button>
          </div>
        </div>
      </div>

      {/* Status badges */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BadgeCard
            label="Maintenance"
            value={app.maintenance ? 'ENABLED' : 'OFF'}
            tone={app.maintenance ? 'red' : 'emerald'}
          />
          
          <BadgeCard label="Cache Driver" value={cache.driver} tone="violet" />
        </div>
      </div>

      {/* System info */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Application">
          <InfoRow k="Name" v={app.name} />
          <InfoRow k="Env" v={app.env} />
          <InfoRow k="Debug" v={String(app.debug)} />
          <InfoRow k="URL" v={app.url} />
          <InfoRow k="Timezone" v={app.timezone} />
          <InfoRow k="Locale" v={app.locale} />
          <InfoRow k="Laravel" v={app.laravel} />
          <InfoRow k="PHP" v={app.php} />
        </Panel>

        <Panel title="Database">
          <InfoRow k="Driver" v={app.db_driver} />
          <InfoRow k="Version" v={app.db_version ?? '—'} />
        </Panel>
      </div>

      {/* Notes */}
      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 text-sm text-gray-600 dark:text-gray-300">
          <p className="mb-2">Tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><b>storage:link</b> should show “OK” for Storage Symlink.</li>
            <li><b>Clear Caches</b> runs cache/route/config/view clear.</li>
            <li><b>Rebuild Caches</b> runs config/route/view cache.</li>
            <li><b>queue:restart</b> will ask workers to gracefully restart.</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}

function BadgeCard({ label, value, tone }: { label: string; value: string; tone: 'red'|'emerald'|'yellow'|'violet' }) {
  const tones: Record<string, string> = {
    red: 'from-red-500 to-rose-600',
    emerald: 'from-emerald-500 to-green-600',
    yellow: 'from-yellow-500 to-amber-600',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 inline-flex items-center text-xs text-white px-2.5 py-1 rounded-full bg-gradient-to-r ${tones[tone]} shadow`}>
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
      <div className="text-lg font-bold mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-gray-500">{k}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white">{v}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  );
}

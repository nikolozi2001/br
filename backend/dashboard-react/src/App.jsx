import { useState, useEffect } from 'react';
import { Activity, Database, Server, Zap, HardDrive, AlertCircle, RefreshCw, Globe, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Endpoint definitions ────────────────────────────────────────────────────

const ENDPOINT_GROUPS = [
  {
    name: 'ძიება',
    icon: '🔍',
    endpoints: [
      {
        method: 'GET', path: '/api/documents',
        desc: 'სუბიექტების ძიება (გვერდებით)',
        params: [
          { name: 'page', type: 'query' }, { name: 'limit', type: 'query' },
          { name: 'identificationNumber', type: 'query' }, { name: 'organizationName', type: 'query' },
          { name: 'legalForm', type: 'query' }, { name: 'ownershipType', type: 'query' },
          { name: 'isActive', type: 'query' }, { name: 'activityCode', type: 'query' },
          { name: 'size', type: 'query' }, { name: 'legalAddressRegion', type: 'query' },
          { name: 'legalAddressCity', type: 'query' }, { name: 'head', type: 'query' },
          { name: 'partner', type: 'query' },
        ],
      },
      {
        method: 'GET', path: '/api/documents/legal_code/:legalCode',
        desc: 'სუბიექტი საიდენტიფიკაციო კოდით',
        params: [{ name: 'legalCode', type: 'route' }],
      },
      {
        method: 'GET', path: '/api/documents/export',
        desc: 'ძიების შედეგების Excel ექსპორტი',
        params: [
          { name: 'identificationNumber', type: 'query' }, { name: 'organizationName', type: 'query' },
          { name: 'legalForm', type: 'query' }, { name: 'isActive', type: 'query' },
        ],
      },
      {
        method: 'GET', path: '/api/basic-info',
        desc: 'სუბიექტის ძირითადი ინფორმაცია',
        params: [
          { name: 'identificationNumber', type: 'query' }, { name: 'organizationName', type: 'query' },
          { name: 'legalForm', type: 'query' }, { name: 'ownershipType', type: 'query' },
          { name: 'isActive', type: 'query' }, { name: 'activityCode', type: 'query' },
          { name: 'head', type: 'query' }, { name: 'partner', type: 'query' },
        ],
      },
      {
        method: 'GET', path: '/api/basic-info/legal_code/:legalCode',
        desc: 'ძირითადი ინფო კოდით',
        params: [{ name: 'legalCode', type: 'route' }],
      },
    ],
  },
  {
    name: 'სუბიექტის დეტალები',
    icon: '🏢',
    endpoints: [
      {
        method: 'GET', path: '/api/address-web',
        desc: 'სუბიექტის მისამართი',
        params: [{ name: 'statId', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/full-name-web',
        desc: 'სუბიექტის სრული სახელი',
        params: [{ name: 'statId', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/representatives',
        desc: 'სუბიექტის წარმომადგენლები',
        params: [{ name: 'statId', type: 'query' }, { name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/partners',
        desc: 'სუბიექტის პარტნიორები',
        params: [{ name: 'statId', type: 'query' }, { name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/partners-vw',
        desc: 'პარტნიორები (view)',
        params: [{ name: 'statId', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/legal-unit-web',
        desc: 'საგადასახადო ერთეული',
        params: [{ name: 'personId', type: 'query' }, { name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/coordinates',
        desc: 'სუბიექტის გეო-კოორდინატები',
        params: [{ name: 'taxId', type: 'query' }, { name: 'lang', type: 'query' }],
      },
    ],
  },
  {
    name: 'საძიებო სიები (Lookups)',
    icon: '📋',
    endpoints: [
      {
        method: 'GET', path: '/api/legal-forms',
        desc: 'ორგანიზაციულ-სამართლებრივი ფორმები',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/legal-forms/gis/:gis',
        desc: 'GIS-ისთვის სამართლებრივი ფორმები',
        params: [{ name: 'gis', type: 'route' }, { name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/locations',
        desc: 'ყველა ლოკაცია',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/locations/regions',
        desc: 'რეგიონების სია',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/locations/code/:code',
        desc: 'ლოკაცია კოდით',
        params: [{ name: 'code', type: 'route' }, { name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/activities',
        desc: 'ეკონომიკური საქმიანობის სახეები (NACE)',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/activities/gis',
        desc: 'GIS-ისთვის საქმიანობის სახეები',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/ownership-types',
        desc: 'საკუთრების ფორმები',
        params: [{ name: 'lang', type: 'query' }],
      },
      {
        method: 'GET', path: '/api/sizes',
        desc: 'საწარმოს ზომის კატეგორიები',
        params: [{ name: 'lang', type: 'query' }],
      },
    ],
  },
  {
    name: 'GIS ანალიზი',
    icon: '🗺️',
    endpoints: [
      {
        method: 'GET', path: '/api/gis-search',
        desc: 'სუბიექტების ძიება GIS-ზე',
        params: [
          { name: 'city', type: 'query' }, { name: 'search', type: 'query' },
          { name: 'legalForm', type: 'query' }, { name: 'leg', type: 'query' },
          { name: 'activity', type: 'query' }, { name: 'act', type: 'query' },
        ],
      },
      {
        method: 'GET', path: '/api/gis-search/cities',
        desc: 'ქალაქების სია GIS-ისთვის',
        params: [],
      },
    ],
  },
  {
    name: 'რეპორტები',
    icon: '📊',
    endpoints: [
      { method: 'GET', path: '/api/report1',  desc: 'რეპორტი 1 — სუბიექტები სამართლებრივი ფორმის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report2',  desc: 'რეპორტი 2 — სუბიექტები საქმიანობის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report3',  desc: 'რეპორტი 3 — სუბიექტები საკუთრების მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report4',  desc: 'რეპორტი 4 — სუბიექტები რეგიონის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report5',  desc: 'რეპორტი 5 — სუბიექტები ზომის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report6',  desc: 'რეპორტი 6', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report7',  desc: 'რეპორტი 7', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report8',  desc: 'რეპორტი 8', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report9',  desc: 'რეპორტი 9', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/report10', desc: 'რეპორტი 10', params: [{ name: 'lang', type: 'query' }] },
    ],
  },
  {
    name: 'საწარმოთა დემოგრაფია',
    icon: '📈',
    endpoints: [
      { method: 'GET', path: '/api/enterprise-birth-death',     desc: 'საწარმოთა დაბადება/გარდაცვალება', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-nace',            desc: 'დაბადება NACE სექციის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-death-nace',      desc: 'გარდაცვალება NACE სექციის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-birth-region',    desc: 'დაბადება რეგიონის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-death-region',    desc: 'გარდაცვალება რეგიონის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-birth-sector',    desc: 'დაბადება სექტორის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-death-sector',    desc: 'გარდაცვალება სექტორის მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-survival-year',   desc: 'გადარჩენის მაჩვენებელი წლების მიხედვით', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-birth-distribution', desc: 'დაბადების განაწილება', params: [{ name: 'lang', type: 'query' }] },
      { method: 'GET', path: '/api/enterprise-death-distribution', desc: 'გარდაცვალების განაწილება', params: [{ name: 'lang', type: 'query' }] },
    ],
  },
  {
    name: 'მონიტორინგი',
    icon: '🛠️',
    endpoints: [
      { method: 'GET',    path: '/api/monitoring/health',              desc: 'სერვერის ჯანმრთელობა', params: [] },
      { method: 'GET',    path: '/api/monitoring/diagnostics',         desc: 'სრული დიაგნოსტიკა', params: [] },
      { method: 'GET',    path: '/api/monitoring/metrics',             desc: 'Performance metrics', params: [] },
      { method: 'GET',    path: '/api/monitoring/cache/stats',         desc: 'Cache სტატისტიკა', params: [] },
      { method: 'DELETE', path: '/api/monitoring/cache',               desc: 'Cache გასუფთავება', params: [{ name: 'pattern', type: 'query' }] },
      { method: 'POST',   path: '/api/monitoring/circuit-breaker/reset', desc: 'Circuit Breaker-ის reset', params: [] },
      { method: 'POST',   path: '/api/monitoring/query-performance/reset', desc: 'Query Monitor-ის reset', params: [] },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtUptime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const METHOD_STYLE = {
  GET:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  POST:   'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  PUT:    'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

function PathDisplay({ path }) {
  const parts = path.split('/').filter(Boolean);
  return (
    <span className="font-mono text-sm">
      {parts.map((part, i) => (
        <span key={i}>
          <span className="text-slate-500">/</span>
          {part.startsWith(':')
            ? <span className="text-amber-400">{part}</span>
            : <span className="text-slate-200">{part}</span>
          }
        </span>
      ))}
    </span>
  );
}

function ParamBadge({ name, type }) {
  return type === 'route'
    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-700/40 font-mono">:{name}</span>
    : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 font-mono">?{name}</span>;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusCard({ icon, label, value, sub, color = 'text-slate-100' }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function EndpointRow({ method, path, desc, params }) {
  return (
    <div className="py-3 border-b border-slate-700/50 last:border-0 space-y-2">
      {/* Line 1: method + path + description */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded font-mono w-16 text-center ${METHOD_STYLE[method] || METHOD_STYLE.GET}`}>
          {method}
        </span>
        <PathDisplay path={path} />
        {desc && <span className="text-xs text-slate-500 ml-auto">{desc}</span>}
      </div>
      {/* Line 2: params */}
      {params.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-[76px]">
          {params.map(p => <ParamBadge key={p.name} {...p} />)}
        </div>
      )}
    </div>
  );
}

function EndpointGroup({ name, icon, endpoints }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-750 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-slate-200 text-sm">{name}</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 pb-1">
          {endpoints.map((ep, i) => <EndpointRow key={i} {...ep} />)}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, max, colorClass = 'bg-blue-500' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MetricCard({ title, children }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/40 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-200 tabular-nums">{value}</span>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'endpoints', label: '📡 API Endpoints' },
  { id: 'server',    label: '⚙️ სერვერი' },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [stats, setStats]   = useState(null);
  const [online, setOnline] = useState(true);
  const [ts, setTs]         = useState('იტვირთება...');
  const [spin, setSpin]     = useState(false);
  const [tab, setTab]       = useState('endpoints');
  const [search, setSearch] = useState('');

  async function load() {
    setSpin(true);
    try {
      const r = await fetch('/admin/dashboard/stats');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStats(await r.json());
      setOnline(true);
      setTs('განახლდა: ' + new Date().toLocaleTimeString('ka-GE'));
    } catch (e) {
      setOnline(false);
      setTs('შეცდომა: ' + e.message);
    } finally {
      setSpin(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const totalEndpoints = ENDPOINT_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);

  const filteredGroups = search.trim()
    ? ENDPOINT_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(ep =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.desc.toLowerCase().includes(search.toLowerCase()) ||
          ep.params.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full pulse ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-sm font-semibold text-slate-100">BR API Dashboard</span>
          <span className="text-xs text-slate-500 hidden sm:block">ბიზნეს რეგისტრი</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{ts}</span>
          <button onClick={load} className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="განახლება">
            <RefreshCw className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-10">
        {/* Status cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          <StatusCard icon="⚡" label="API Status" value={online ? 'Online' : 'Offline'} color={online ? 'text-emerald-400' : 'text-red-400'} />
          <StatusCard icon="🗄️" label="Database"  value={stats ? (stats.database.status === 'healthy' ? 'Connected' : 'Error') : '…'} color={stats?.database?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'} />
          <StatusCard icon="⏱️" label="Uptime"    value={stats ? fmtUptime(stats.server.uptime) : '…'} />
          <StatusCard icon="🔧" label="Node.js"   value={stats ? stats.server.nodeVersion : '…'} sub={stats?.server?.platform} />
          <StatusCard icon="📡" label="Endpoints" value={totalEndpoints} sub={`${ENDPOINT_GROUPS.length} group` } />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 mb-4 border-b border-slate-700">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer -mb-px border-b-2 ${
                tab === t.id
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Endpoints tab */}
        {tab === 'endpoints' && (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Endpoint-ის ძიება... (path, params, description)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex gap-4 text-xs text-slate-500 mb-4">
              <span><span className="inline-block w-2 h-2 rounded bg-amber-400 mr-1" />:param — route parameter</span>
              <span><span className="inline-block w-2 h-2 rounded bg-slate-500 mr-1" />?param — query parameter</span>
            </div>
            {filteredGroups.map(g => <EndpointGroup key={g.name} {...g} />)}
            {filteredGroups.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-12">ვერ მოიძებნა</div>
            )}
          </>
        )}

        {/* Server tab */}
        {tab === 'server' && stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard title="Heap Memory">
                <Row label="Used"     value={`${stats.server.memory.heapUsed} MB`} />
                <Row label="Total"    value={`${stats.server.memory.heapTotal} MB`} />
                <Row label="External" value={`${stats.server.memory.external} MB`} />
                <Row label="RSS"      value={`${stats.server.memory.rss} MB`} />
                <ProgressBar value={stats.server.memory.heapUsed} max={stats.server.memory.heapTotal} colorClass="bg-blue-500" />
              </MetricCard>
              <MetricCard title="სისტემის მეხსიერება">
                <Row label="Free"         value={`${stats.server.freeSystemMemoryMB} MB`} />
                <Row label="Total"        value={`${stats.server.totalSystemMemoryMB} MB`} />
                <Row label="Load Avg (1m)" value={stats.server.loadAvg[0].toFixed(2)} />
                <Row label="CPU Cores"    value={stats.server.cpuCount} />
                <ProgressBar
                  value={stats.server.totalSystemMemoryMB - stats.server.freeSystemMemoryMB}
                  max={stats.server.totalSystemMemoryMB}
                  colorClass="bg-amber-500"
                />
              </MetricCard>
              <MetricCard title="მონაცემთა ბაზა">
                <Row label="Status"        value={<span className={stats.database.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}>{stats.database.status}</span>} />
                <Row label="Response Time" value={stats.database.responseTime || 'N/A'} />
                <Row label="Pool Size"     value={stats.database.poolSize ?? '—'} />
                <Row label="Available"     value={stats.database.poolAvailable ?? '—'} />
                <Row label="Borrowed"      value={stats.database.poolBorrowed ?? '—'} />
              </MetricCard>
              <MetricCard title="Cache">
                <Row label="Hit Ratio"  value={stats.cache.hitRatio} />
                <Row label="Hits"       value={stats.cache.hitCount.toLocaleString()} />
                <Row label="Misses"     value={stats.cache.missCount.toLocaleString()} />
                <Row label="Entries"    value={`${stats.cache.size} / ${stats.cache.maxSize}`} />
                <Row label="Usage"      value={`${stats.cache.memoryUsageKB} KB`} />
                <ProgressBar value={parseFloat(stats.cache.hitRatio) || 0} max={100} colorClass="bg-emerald-500" />
              </MetricCard>
              <MetricCard title="Query Monitor">
                <Row label="სულ Queries"  value={stats.queries.total.toLocaleString()} />
                <Row label="Avg Time"     value={`${stats.queries.avgMs} ms`} />
                <Row label="Peak Time"    value={`${stats.queries.peakMs} ms`} />
                <Row label="Slow Queries" value={`${stats.queries.slow} (${stats.queries.slowPct})`} />
                <Row label="Error Rate"   value={stats.queries.errorRate} />
              </MetricCard>
            </div>
          </div>
        )}
        {tab === 'server' && !stats && (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">იტვირთება...</div>
        )}
      </main>
    </div>
  );
}

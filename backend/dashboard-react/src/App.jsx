import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Globe, Server, Database, Zap, Activity,
  FileText, Settings, RefreshCw, Menu, X, Trash2, ChevronDown,
  ChevronUp, AlertCircle, CheckCircle, Clock, TrendingUp
} from 'lucide-react';

// ─── Endpoint data ────────────────────────────────────────────────────────────
const ENDPOINT_GROUPS = [
  { name: 'ძიება', icon: '🔍', endpoints: [
    { method: 'GET', path: '/api/documents', desc: 'სუბიექტების ძიება', params: [
      {name:'page',t:'q'},{name:'limit',t:'q'},{name:'identificationNumber',t:'q'},
      {name:'organizationName',t:'q'},{name:'legalForm',t:'q'},{name:'ownershipType',t:'q'},
      {name:'isActive',t:'q'},{name:'activityCode',t:'q'},{name:'size',t:'q'},
      {name:'legalAddressRegion',t:'q'},{name:'legalAddressCity',t:'q'},
      {name:'head',t:'q'},{name:'partner',t:'q'},
    ]},
    { method: 'GET', path: '/api/documents/legal_code/:legalCode', desc: 'კოდით', params: [{name:'legalCode',t:'r'}] },
    { method: 'GET', path: '/api/documents/export', desc: 'Excel ექსპორტი', params: [
      {name:'identificationNumber',t:'q'},{name:'organizationName',t:'q'},{name:'legalForm',t:'q'},{name:'isActive',t:'q'},
    ]},
    { method: 'GET', path: '/api/basic-info', desc: 'ძირითადი ინფო', params: [
      {name:'identificationNumber',t:'q'},{name:'organizationName',t:'q'},{name:'legalForm',t:'q'},
      {name:'ownershipType',t:'q'},{name:'isActive',t:'q'},{name:'activityCode',t:'q'},
      {name:'head',t:'q'},{name:'partner',t:'q'},
    ]},
    { method: 'GET', path: '/api/basic-info/legal_code/:legalCode', desc: 'ძირითადი ინფო კოდით', params: [{name:'legalCode',t:'r'}] },
  ]},
  { name: 'სუბიექტის დეტალები', icon: '🏢', endpoints: [
    { method: 'GET', path: '/api/address-web',    desc: 'მისამართი',           params: [{name:'statId',t:'q'}] },
    { method: 'GET', path: '/api/full-name-web',  desc: 'სრული სახელი',        params: [{name:'statId',t:'q'}] },
    { method: 'GET', path: '/api/representatives',desc: 'წარმომადგენლები',     params: [{name:'statId',t:'q'},{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/partners',       desc: 'პარტნიორები',         params: [{name:'statId',t:'q'},{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/partners-vw',    desc: 'პარტნიორები (view)',  params: [{name:'statId',t:'q'}] },
    { method: 'GET', path: '/api/legal-unit-web', desc: 'საგადასახადო ერთეული',params: [{name:'personId',t:'q'},{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/coordinates',    desc: 'გეო-კოორდინატები',    params: [{name:'taxId',t:'q'},{name:'lang',t:'q'}] },
  ]},
  { name: 'Lookups', icon: '📋', endpoints: [
    { method: 'GET', path: '/api/legal-forms',          desc: 'სამართლებრივი ფორმები',   params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/legal-forms/gis/:gis', desc: 'GIS სამართლ. ფორმები',   params: [{name:'gis',t:'r'},{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/locations',            desc: 'ლოკაციები',               params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/locations/regions',    desc: 'რეგიონები',               params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/locations/code/:code', desc: 'ლოკაცია კოდით',          params: [{name:'code',t:'r'},{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/activities',           desc: 'NACE საქმიანობები',       params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/activities/gis',       desc: 'GIS საქმიანობები',        params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/ownership-types',      desc: 'საკუთრების ფორმები',      params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/sizes',                desc: 'ზომის კატეგორიები',       params: [{name:'lang',t:'q'}] },
  ]},
  { name: 'GIS', icon: '🗺️', endpoints: [
    { method: 'GET', path: '/api/gis-search',        desc: 'GIS ძიება', params: [
      {name:'city',t:'q'},{name:'search',t:'q'},{name:'legalForm',t:'q'},{name:'activity',t:'q'},
    ]},
    { method: 'GET', path: '/api/gis-search/cities', desc: 'ქალაქების სია', params: [] },
  ]},
  { name: 'რეპორტები', icon: '📊', endpoints: [
    ...[1,2,3,4,5,6,7,8,9,10].map(n => ({
      method: 'GET', path: `/api/report${n}`, desc: `რეპორტი ${n}`, params: [{name:'lang',t:'q'}],
    })),
  ]},
  { name: 'საწარმოთა დემოგრაფია', icon: '📈', endpoints: [
    { method: 'GET', path: '/api/enterprise-birth-death',        desc: 'დაბადება/გარდაცვალება',      params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-nace',               desc: 'დაბადება NACE-ით',            params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-death-nace',         desc: 'გარდაცვალება NACE-ით',        params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-birth-region',       desc: 'დაბადება რეგიონით',           params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-death-region',       desc: 'გარდაცვალება რეგიონით',       params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-birth-sector',       desc: 'დაბადება სექტორით',           params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-death-sector',       desc: 'გარდაცვალება სექტორით',       params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-survival-year',      desc: 'გადარჩენა წლებით',            params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-birth-distribution', desc: 'დაბადების განაწილება',        params: [{name:'lang',t:'q'}] },
    { method: 'GET', path: '/api/enterprise-death-distribution', desc: 'გარდაცვალების განაწილება',    params: [{name:'lang',t:'q'}] },
  ]},
  { name: 'მონიტორინგი', icon: '🛠️', endpoints: [
    { method: 'GET',    path: '/api/monitoring/health',                  desc: 'სერვერის ჯანმრთელობა', params: [] },
    { method: 'GET',    path: '/api/monitoring/diagnostics',             desc: 'სრული დიაგნოსტიკა',    params: [] },
    { method: 'GET',    path: '/api/monitoring/metrics',                 desc: 'Performance metrics',   params: [] },
    { method: 'GET',    path: '/api/monitoring/cache/stats',             desc: 'Cache სტატისტიკა',      params: [] },
    { method: 'DELETE', path: '/api/monitoring/cache',                   desc: 'Cache გასუფთავება',     params: [{name:'pattern',t:'q'}] },
    { method: 'POST',   path: '/api/monitoring/circuit-breaker/reset',   desc: 'Circuit Breaker reset', params: [] },
    { method: 'POST',   path: '/api/monitoring/query-performance/reset', desc: 'Query Monitor reset',   params: [] },
  ]},
];

const TOTAL_ENDPOINTS = ENDPOINT_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtUptime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const METHOD_CLS = {
  GET:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function statusColor(code) {
  if (code < 300) return 'text-emerald-400';
  if (code < 400) return 'text-blue-400';
  if (code < 500) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Small components ─────────────────────────────────────────────────────────
function ProgressBar({ value, max, cls = 'bg-blue-500' }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/40 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-200 tabular-nums">{value}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon, label, value, color = 'text-slate-100', sub }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value ?? '…'}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Endpoint browser ─────────────────────────────────────────────────────────
function PathDisplay({ path }) {
  return (
    <span className="font-mono text-sm">
      {path.split('/').filter(Boolean).map((p, i) => (
        <span key={i}>
          <span className="text-slate-500">/</span>
          <span className={p.startsWith(':') ? 'text-amber-400' : 'text-slate-200'}>{p}</span>
        </span>
      ))}
    </span>
  );
}

function ParamPill({ name, t }) {
  return t === 'r'
    ? <span className="px-1.5 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-700/40 font-mono">:{name}</span>
    : <span className="px-1.5 py-0.5 rounded text-xs bg-slate-700/60 text-slate-400 border border-slate-600/40 font-mono">?{name}</span>;
}

function EndpointRow({ method, path, desc, params }) {
  return (
    <div className="py-3 border-b border-slate-700/40 last:border-0 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded font-mono w-16 text-center border ${METHOD_CLS[method] || METHOD_CLS.GET}`}>
          {method}
        </span>
        <PathDisplay path={path} />
        {desc && <span className="text-xs text-slate-500 ml-auto">{desc}</span>}
      </div>
      {params.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-[76px]">
          {params.map(p => <ParamPill key={p.name} {...p} />)}
        </div>
      )}
    </div>
  );
}

function EndpointGroup({ name, icon, endpoints }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-slate-200 text-sm">{name}</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{endpoints.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-1">{endpoints.map((e, i) => <EndpointRow key={i} {...e} />)}</div>}
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function PageOverview({ stats, online }) {
  const d = stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="⚡" label="API სტატუსი" value={online ? 'Online' : 'Offline'} color={online ? 'text-emerald-400' : 'text-red-400'} />
        <KpiCard icon="🗄️" label="მონაცემთა ბაზა" value={d ? (d.database.status === 'healthy' ? 'Connected' : 'Error') : null} color={d?.database?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'} />
        <KpiCard icon="⏱️" label="Uptime" value={d ? fmtUptime(d.server.uptime) : null} />
        <KpiCard icon="📡" label="Endpoints" value={TOTAL_ENDPOINTS} sub={`${ENDPOINT_GROUPS.length} ჯგუფი`} />
      </div>
      {d && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon="🧠" label="Heap Used" value={`${d.server.memory.heapUsed} MB`} sub={`/ ${d.server.memory.heapTotal} MB`} />
          <KpiCard icon="💾" label="RSS" value={`${d.server.memory.rss} MB`} />
          <KpiCard icon="🎯" label="Cache Hit" value={d.cache.hitRatio} sub={`${d.cache.hitCount.toLocaleString()} hits`} />
          <KpiCard icon="🔍" label="სულ Queries" value={d.queries.total.toLocaleString()} sub={`avg ${d.queries.avgMs} ms`} />
        </div>
      )}
      {d && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card title="Request სტატისტიკა" icon={Activity}>
            <MetricRow label="სულ Requests"   value={d.requests.total.toLocaleString()} />
            <MetricRow label="Success Rate"   value={d.requests.successRate} />
            <MetricRow label="შეცდომები"      value={d.requests.errors} />
            <MetricRow label="Avg Duration"   value={`${d.requests.avgDuration} ms`} />
          </Card>
          <Card title="DB Connection Pool" icon={Database}>
            <MetricRow label="Response Time" value={d.database.responseTime || 'N/A'} />
            <MetricRow label="Pool Size"     value={d.database.poolSize ?? '—'} />
            <MetricRow label="Available"     value={d.database.poolAvailable ?? '—'} />
            <MetricRow label="Borrowed"      value={d.database.poolBorrowed ?? '—'} />
          </Card>
        </div>
      )}
    </div>
  );
}

function PageEndpoints() {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? ENDPOINT_GROUPS.map(g => ({ ...g, endpoints: g.endpoints.filter(e =>
        e.path.toLowerCase().includes(search.toLowerCase()) ||
        e.desc.toLowerCase().includes(search.toLowerCase()) ||
        e.params.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
      )})).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  return (
    <div>
      <input
        type="text"
        placeholder="ძიება path, description, param..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-3 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      />
      <div className="flex gap-4 text-xs text-slate-500 mb-4">
        <span><span className="inline-block w-2 h-2 rounded bg-amber-400 mr-1 align-middle" />:param — route parameter</span>
        <span><span className="inline-block w-2 h-2 rounded bg-slate-500 mr-1 align-middle" />?param — query parameter</span>
      </div>
      {filtered.map(g => <EndpointGroup key={g.name} {...g} />)}
      {!filtered.length && <p className="text-center text-slate-500 text-sm py-12">ვერ მოიძებნა</p>}
    </div>
  );
}

function PageServer({ stats }) {
  if (!stats) return <Loader />;
  const { server } = stats;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card title="Heap Memory" icon={Activity}>
        <MetricRow label="Used"     value={`${server.memory.heapUsed} MB`} />
        <MetricRow label="Total"    value={`${server.memory.heapTotal} MB`} />
        <MetricRow label="External" value={`${server.memory.external} MB`} />
        <MetricRow label="RSS"      value={`${server.memory.rss} MB`} />
        <ProgressBar value={server.memory.heapUsed} max={server.memory.heapTotal} cls="bg-blue-500" />
      </Card>
      <Card title="სისტემა" icon={Server}>
        <MetricRow label="Node.js"      value={server.nodeVersion} />
        <MetricRow label="Platform"     value={server.platform} />
        <MetricRow label="CPU Cores"    value={server.cpuCount} />
        <MetricRow label="Uptime"       value={fmtUptime(server.uptime)} />
        <MetricRow label="Load Avg 1m"  value={server.loadAvg[0].toFixed(2)} />
        <MetricRow label="System Free"  value={`${server.freeSystemMemoryMB} MB / ${server.totalSystemMemoryMB} MB`} />
        <ProgressBar value={server.totalSystemMemoryMB - server.freeSystemMemoryMB} max={server.totalSystemMemoryMB} cls="bg-amber-500" />
      </Card>
    </div>
  );
}

function PageDatabase({ stats }) {
  if (!stats) return <Loader />;
  const { database } = stats;
  const ok = database.status === 'healthy';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <Card title="კავშირი" icon={Database}>
        <MetricRow label="სტატუსი"      value={<span className={ok ? 'text-emerald-400' : 'text-red-400'}>{database.status}</span>} />
        <MetricRow label="Response Time" value={database.responseTime || 'N/A'} />
      </Card>
      <Card title="Connection Pool" icon={Database}>
        <MetricRow label="Pool Size"  value={database.poolSize ?? '—'} />
        <MetricRow label="Available"  value={database.poolAvailable ?? '—'} />
        <MetricRow label="Borrowed"   value={database.poolBorrowed ?? '—'} />
        <MetricRow label="Pending"    value={database.poolPending ?? '—'} />
      </Card>
    </div>
  );
}

function PageCache({ stats, onClearCache }) {
  const [clearing, setClearing] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleClear() {
    setClearing(true);
    try {
      const r = await fetch('/admin/dashboard/cache', { method: 'DELETE' });
      const d = await r.json();
      setMsg(d.message || 'გასუფთავდა');
      setTimeout(() => setMsg(''), 3000);
      onClearCache?.();
    } catch (e) {
      setMsg('შეცდომა: ' + e.message);
    } finally {
      setClearing(false);
    }
  }

  if (!stats) return <Loader />;
  const { cache } = stats;
  return (
    <div className="space-y-3">
      {msg && <div className="bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-sm px-4 py-2 rounded-lg">{msg}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="სტატისტიკა" icon={Zap}
          action={
            <button onClick={handleClear} disabled={clearing}
              className="flex items-center gap-1.5 text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-700/50 px-3 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
              <Trash2 className="w-3 h-3" />
              {clearing ? 'იწმება...' : 'Cache-ის გასუფთავება'}
            </button>
          }
        >
          <MetricRow label="Hit Ratio"      value={cache.hitRatio} />
          <MetricRow label="Hits"           value={cache.hitCount.toLocaleString()} />
          <MetricRow label="Misses"         value={cache.missCount.toLocaleString()} />
          <MetricRow label="Total Requests" value={cache.totalRequests.toLocaleString()} />
          <ProgressBar value={parseFloat(cache.hitRatio) || 0} max={100} cls="bg-emerald-500" />
        </Card>
        <Card title="მეხსიერება" icon={Activity}>
          <MetricRow label="Entries"    value={cache.size} />
          <MetricRow label="Max Size"   value={cache.maxSize} />
          <MetricRow label="Usage (KB)" value={cache.memoryUsageKB} />
        </Card>
      </div>
    </div>
  );
}

function PageQueries({ stats }) {
  if (!stats) return <Loader />;
  const { queries } = stats;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="🔢" label="სულ" value={queries.total.toLocaleString()} />
        <KpiCard icon="⏱️" label="Avg Time" value={`${queries.avgMs} ms`} />
        <KpiCard icon="🔺" label="Peak Time" value={`${queries.peakMs} ms`} />
        <KpiCard icon="⚠️" label="Slow Queries" value={`${queries.slow} (${queries.slowPct})`} color={queries.slow > 0 ? 'text-amber-400' : 'text-slate-100'} />
      </div>
      <Card title="Query სტატისტიკა" icon={TrendingUp}>
        <MetricRow label="სულ Queries"     value={queries.total.toLocaleString()} />
        <MetricRow label="Avg Exec Time"   value={`${queries.avgMs} ms`} />
        <MetricRow label="Peak Exec Time"  value={`${queries.peakMs} ms`} />
        <MetricRow label="Slow Queries"    value={`${queries.slow} (${queries.slowPct})`} />
        <MetricRow label="Error Rate"      value={queries.errorRate} />
        <MetricRow label="შეცდომები"       value={queries.errors} />
      </Card>
      {queries.slowQueries?.length > 0 && (
        <Card title="ნელი Queries (TOP 10)" icon={AlertCircle}>
          <div className="space-y-2 mt-1">
            {queries.slowQueries.map((q, i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-400 font-semibold">{q.executionTime} ms</span>
                  <span className="text-slate-500">{fmtTime(q.timestamp)}</span>
                </div>
                <div className="font-mono text-slate-400 truncate">{q.sql}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PageLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoR, setAutoR]   = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/admin/dashboard/logs?limit=100');
      setLogs(await r.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (!autoR) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load, autoR]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">ბოლო {logs.length} request</span>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={autoR} onChange={e => setAutoR(e.target.checked)} className="rounded" />
          ავტო-განახლება
        </label>
      </div>
      {loading ? <Loader /> : logs.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-12">Request-ები ჯერ არ არის</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Method</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Path</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20 text-center">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-right">Duration</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28 text-right">დრო</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${METHOD_CLS[l.method] || METHOD_CLS.GET}`}>{l.method}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-300 truncate max-w-xs">{l.path}</td>
                  <td className={`px-4 py-2.5 text-center font-semibold text-xs tabular-nums ${statusColor(l.status)}`}>{l.status}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-400 tabular-nums">{l.duration} ms</td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-500">{fmtTime(l.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">იტვირთება...</div>;
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',   label: 'მიმოხილვა',     icon: LayoutDashboard },
  { id: 'endpoints',  label: 'API Endpoints',  icon: Globe },
  { id: 'server',     label: 'სერვერი',        icon: Server },
  { id: 'database',   label: 'მონაც. ბაზა',   icon: Database },
  { id: 'cache',      label: 'Cache',          icon: Zap },
  { id: 'queries',    label: 'Query Monitor',  icon: Activity },
  { id: 'logs',       label: 'Request Logs',   icon: FileText },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats]     = useState(null);
  const [online, setOnline]   = useState(true);
  const [ts, setTs]           = useState('');
  const [spin, setSpin]       = useState(false);
  const [page, setPage]       = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setSpin(true);
    try {
      const r = await fetch('/admin/dashboard/stats');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setStats(await r.json());
      setOnline(true);
      setTs(new Date().toLocaleTimeString('ka-GE'));
    } catch (e) {
      setOnline(false);
      setTs('შეცდომა');
    } finally {
      setSpin(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const current = NAV.find(n => n.id === page);

  function NavItem({ id, label, icon: Icon }) {
    const active = page === id;
    return (
      <button
        onClick={() => { setPage(id); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <img src="/dashboard-build/favicon.ico" alt="BR" className="w-8 h-8 rounded-lg" />
          <div>
            <div className="text-sm font-semibold text-slate-100">BR API</div>
            <div className="text-xs text-slate-500">Admin Dashboard</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(n => <NavItem key={n.id} {...n} />)}
      </nav>
      {/* Status */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full pulse shrink-0 ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-500 truncate">{online ? 'სისტემა დაკავშირებულია' : 'კავშირი გაწყვეტილია'}</span>
        </div>
        {ts && <div className="text-xs text-slate-600 mt-1">განახლდა: {ts}</div>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-slate-800 border-r border-slate-700 shrink-0 fixed inset-y-0 left-0 z-20">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-slate-800 border-r border-slate-700 flex flex-col z-40">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-200 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-100">{current?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{ts && `განახლდა: ${ts}`}</span>
            <button onClick={load} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <RefreshCw className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {page === 'overview'  && <PageOverview stats={stats} online={online} />}
          {page === 'endpoints' && <PageEndpoints />}
          {page === 'server'    && <PageServer stats={stats} />}
          {page === 'database'  && <PageDatabase stats={stats} />}
          {page === 'cache'     && <PageCache stats={stats} onClearCache={load} />}
          {page === 'queries'   && <PageQueries stats={stats} />}
          {page === 'logs'      && <PageLogs />}
        </main>
      </div>
    </div>
  );
}

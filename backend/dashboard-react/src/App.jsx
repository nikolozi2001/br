import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Globe, Server, Database, Zap, Activity,
  FileText, RefreshCw, Menu, Trash2, ChevronDown, ChevronUp,
  AlertCircle, TrendingUp, Copy, Check, Play,
} from 'lucide-react';

// ─── Param helpers ────────────────────────────────────────────────────────────
const p = (name, t, dataType, required, desc, example) =>
  ({ name, t, dataType, required, desc, example });

const qStr  = (name, desc, ex, req=false) => p(name, 'q', 'string',  req, desc, ex);
const qInt  = (name, desc, ex, req=false) => p(name, 'q', 'integer', req, desc, ex);
const qBool = (name, desc, ex, req=false) => p(name, 'q', 'boolean', req, desc, ex);
const qLang = () => p('lang', 'q', 'string', false, 'ენა: ka ან en', 'ka');
const rStr  = (name, desc, ex) => p(name, 'r', 'string', true, desc, ex);
const rInt  = (name, desc, ex) => p(name, 'r', 'integer', true, desc, ex);

function buildExample(path, params) {
  let url = path;
  const queryParams = params.filter(p => p.t === 'q' && p.example != null);
  params.filter(p => p.t === 'r').forEach(rp => {
    url = url.replace(`:${rp.name}`, rp.example);
  });
  if (queryParams.length) {
    url += '?' + queryParams.map(qp => `${qp.name}=${qp.example}`).join('&');
  }
  return url;
}

// ─── Endpoint definitions ─────────────────────────────────────────────────────
// Example record: Stat_ID=20387840, Legal_Code=200007143, Legal_Form_ID=1 (შპს),
// Ownership_Type_ID=11, Activity_2_Code=86.10.0, Region_Code=11, City_Code="11 47"
const ENDPOINT_GROUPS = [
  {
    name: 'ძიება', icon: '🔍',
    endpoints: [
      {
        method: 'GET', path: '/api/documents', desc: 'სუბიექტების ძიება (გვერდებით)',
        params: [
          qInt('page',   'გვერდი', 1),
          qInt('limit',  'ჩანაწერების რაოდენობა', 20),
          qStr('identificationNumber', 'საიდენტიფიკაციო კოდი (ერთი კოდი)', '200007143'),
          qStr('organizationName', 'სახელი (ნაწილობრივი ძიება)', null),
          qInt('legalForm', 'სამართლებრივი ფორმის ID (1=შპს, 30=იმ)', 1),
          qInt('ownershipType', 'საკუთრების ტიპის ID (11=კერძო ადგილობრივი)', 11),
          qBool('isActive', 'მხოლოდ აქტიური სუბიექტები', 'true'),
          qStr('activityCode', 'NACE კოდი', '86.10.0'),
          qInt('size', 'ზომის კატეგ. (1=მცირე, 2=საშუალო, 3=მსხვილი)', 3),
          qStr('legalAddressRegion', 'Region_Code — კოდი, არა სახელი (11=ქ.თბილისი)', '11'),
          qStr('legalAddressCity', 'City_Code — კოდი, არა სახელი (11 47=ნაძალადევი)', '11 47'),
          qStr('head', 'ხელმძღვანელის სახელი', 'გადაბაძე'),
          qStr('partner', 'პარტნიორის სახელი', 'ავალიანი'),
        ],
      },
      {
        method: 'GET', path: '/api/documents/legal_code/:legalCode', desc: 'სუბიექტი კოდით',
        params: [rStr('legalCode', 'საიდენტიფიკაციო კოდი', '100028033')],
      },
      {
        method: 'GET', path: '/api/documents/export', desc: 'Excel ექსპორტი',
        params: [
          qStr('identificationNumber', 'საიდენტიფიკაციო კოდი', '200007143'),
          qStr('organizationName', 'სახელი (ნაწილობრივი ძიება)', null),
          qInt('legalForm', 'სამართლებრივი ფორმის ID (1=შპს, 30=იმ)', 1),
          qBool('isActive', 'მხოლოდ აქტიური', 'true'),
        ],
      },
      {
        method: 'GET', path: '/api/basic-info', desc: 'სუბიექტის ძირითადი ინფო',
        params: [
          qStr('identificationNumber', 'საიდენტიფიკაციო კოდი (ერთი კოდი)', '200007143'),
          qStr('organizationName', 'სახელი (ნაწილობრივი ძიება)', null),
          qInt('legalForm', 'სამართლებრივი ფორმის ID (1=შპს, 30=იმ)', 1),
          qInt('ownershipType', 'საკუთრების ტიპის ID (11=კერძო ადგილობრივი)', 11),
          qBool('isActive', 'მხოლოდ აქტიური', 'true'),
          qStr('activityCode', 'NACE კოდი', '86.10.0'),
          qStr('head', 'ხელმძღვანელის სახელი', 'გადაბაძე'),
          qStr('partner', 'პარტნიორის სახელი', 'ავალიანი'),
          qStr('legalAddressRegion', 'Region_Code — კოდი, არა სახელი (11=ქ.თბილისი)', '11'),
        ],
      },
      {
        method: 'GET', path: '/api/basic-info/legal_code/:legalCode', desc: 'ძირითადი ინფო კოდით',
        params: [rStr('legalCode', 'საიდენტიფიკაციო კოდი', '100028033')],
      },
    ],
  },
  {
    name: 'სუბიექტის დეტალები', icon: '🏢',
    endpoints: [
      {
        method: 'GET', path: '/api/address-web', desc: 'სუბიექტის მისამართი',
        params: [qInt('statId', 'სუბიექტის სტატისტიკური ID', 20387840, true)],
      },
      {
        method: 'GET', path: '/api/full-name-web', desc: 'სუბიექტის სრული სახელი',
        params: [qInt('statId', 'სუბიექტის სტატისტიკური ID', 20387840, true)],
      },
      {
        method: 'GET', path: '/api/representatives', desc: 'სუბიექტის წარმომადგენლები',
        params: [
          qInt('statId', 'სუბიექტის სტატისტიკური ID', 20387840, true),
          qLang(),
        ],
      },
      {
        method: 'GET', path: '/api/partners', desc: 'სუბიექტის პარტნიორები',
        params: [
          qInt('statId', 'სუბიექტის სტატისტიკური ID', 20387840, true),
          qLang(),
        ],
      },
      {
        method: 'GET', path: '/api/partners-vw', desc: 'პარტნიორები (view)',
        params: [qInt('statId', 'სუბიექტის სტატისტიკური ID', 20387840, true)],
      },
      {
        method: 'GET', path: '/api/legal-unit-web', desc: 'საგადასახადო ერთეული',
        params: [
          qInt('personId', 'პირის ID', 20387840, true),
          qLang(),
        ],
      },
      {
        method: 'GET', path: '/api/coordinates', desc: 'გეო-კოორდინატები',
        params: [
          qStr('taxId', 'საიდენტიფიკაციო კოდი', '200007143', true),
          qLang(),
        ],
      },
    ],
  },
  {
    name: 'Lookups', icon: '📋',
    endpoints: [
      {
        method: 'GET', path: '/api/legal-forms', desc: 'სამართლებრივი ფორმები',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/legal-forms/gis/:gis', desc: 'GIS სამართლებრივი ფორმები',
        params: [rStr('gis', 'GIS ფილტრი', '1'), qLang()],
      },
      {
        method: 'GET', path: '/api/locations', desc: 'ყველა ლოკაცია',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/locations/regions', desc: 'რეგიონების სია',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/locations/code/:code', desc: 'ლოკაცია კოდით',
        params: [rStr('code', 'ლოკაციის კოდი', '11'), qLang()],
      },
      {
        method: 'GET', path: '/api/activities', desc: 'NACE საქმიანობები',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/activities/gis', desc: 'GIS საქმიანობები',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/ownership-types', desc: 'საკუთრების ფორმები',
        params: [qLang()],
      },
      {
        method: 'GET', path: '/api/sizes', desc: 'ზომის კატეგორიები',
        params: [qLang()],
      },
    ],
  },
  {
    name: 'GIS', icon: '🗺️',
    endpoints: [
      {
        method: 'GET', path: '/api/gis-search', desc: 'სუბიექტების GIS ძიება',
        params: [
          qStr('city',      'ქალაქი', 'თბილისი'),
          qStr('search',    'საძიებო ტექსტი', 'სამედიცინო'),
          qInt('legalForm', 'სამართლებრივი ფორმა (1=შპს)', 1),
          qStr('activity',  'NACE საქმიანობა', '86.10.0'),
        ],
      },
      {
        method: 'GET', path: '/api/gis-search/cities', desc: 'ქალაქების სია',
        params: [],
      },
    ],
  },
  {
    name: 'საწარმოთა დემოგრაფია', icon: '📈',
    endpoints: [
      { method: 'GET', path: '/api/enterprise-birth-death',        desc: 'დაბადება/გარდაცვალება',    params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-nace',               desc: 'დაბადება NACE-ით',          params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-death-nace',         desc: 'გარდაცვალება NACE-ით',      params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-birth-region',       desc: 'დაბადება რეგიონით',         params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-death-region',       desc: 'გარდაცვალება რეგიონით',     params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-birth-sector',       desc: 'დაბადება სექტორით',         params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-death-sector',       desc: 'გარდაცვალება სექტორით',     params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-survival-year',      desc: 'გადარჩენა წლებით',          params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-birth-distribution', desc: 'დაბადების განაწილება',      params: [qLang()] },
      { method: 'GET', path: '/api/enterprise-death-distribution', desc: 'გარდაცვალების განაწილება',  params: [qLang()] },
    ],
  },
  {
    name: 'მონიტორინგი', icon: '🛠️',
    endpoints: [
      { method: 'GET',    path: '/api/monitoring/health',                   desc: 'სერვერის ჯანმრთელობა', params: [] },
      { method: 'GET',    path: '/api/monitoring/diagnostics',              desc: 'სრული დიაგნოსტიკა',    params: [] },
      { method: 'GET',    path: '/api/monitoring/metrics',                  desc: 'Performance metrics',   params: [] },
      { method: 'GET',    path: '/api/monitoring/cache/stats',              desc: 'Cache სტატისტიკა',      params: [] },
      { method: 'DELETE', path: '/api/monitoring/cache',                    desc: 'Cache გასუფთავება',     params: [qStr('pattern', 'Key pattern', 'report*')] },
      { method: 'POST',   path: '/api/monitoring/circuit-breaker/reset',    desc: 'Circuit Breaker reset', params: [] },
      { method: 'POST',   path: '/api/monitoring/query-performance/reset',  desc: 'Query Monitor reset',   params: [] },
    ],
  },
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
function statusColor(c) {
  if (c < 300) return 'text-emerald-400';
  if (c < 400) return 'text-blue-400';
  if (c < 500) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Small UI ─────────────────────────────────────────────────────────────────
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

// ─── History helper ───────────────────────────────────────────────────────────
const MAX_HISTORY = 360;
function addHistoryPoint(prev, data) {
  const last = prev[prev.length - 1];
  const rpm = last != null
    ? Math.max(0, data.requests.total - last.totalReqs) * 12
    : 0;
  const point = {
    heap:      data.server.memory.heapUsed,
    heapPct:   parseFloat(((data.server.memory.heapUsed / data.server.memory.heapTotal) * 100).toFixed(1)),
    rpm,
    totalReqs: data.requests.total,
  };
  const arr = [...prev, point];
  return arr.length > MAX_HISTORY ? arr.slice(-MAX_HISTORY) : arr;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#3b82f6', unit = '' }) {
  if (data.length < 2) return (
    <div className="h-10 flex items-center justify-center text-xs text-slate-600">მონაცემი გროვდება...</div>
  );
  const W = 400, H = 40;
  const max = Math.max(...data, 0.001);
  const min = Math.min(...data);
  const range = max - min || 1;
  const toX = i => (i / (data.length - 1)) * W;
  const toY = v => H - 2 - ((v - min) / range) * (H - 6);
  const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const area = `0,${H} ${pts} ${W},${H}`;
  const last = data[data.length - 1];
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>{min.toFixed(1)}{unit}</span>
        <span className="font-semibold text-slate-200">{last.toFixed(1)}{unit}</span>
        <span>{max.toFixed(1)}{unit}</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polygon points={area} fill={color} fillOpacity="0.12" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

// ─── AlertBar ─────────────────────────────────────────────────────────────────
// heapTotal-ზე ratio ცრუ alert-ს იძლევა — V8 heapTotal-ს პატარადან იწყებს და
// საჭიროებისამებრ ზრდის (--max-old-space-size=8192). ამიტომ absolute MB-ს ვამოწმებთ.
function AlertBar({ stats }) {
  if (!stats) return null;
  const heapMB   = stats.server.memory.heapUsed;
  const rssMB    = stats.server.memory.rss;
  const errRate  = parseFloat(stats.queries.errorRate) || 0;
  const alerts   = [];
  if (heapMB > 4096)       alerts.push({ lvl: 'error', msg: `Heap ${heapMB} MB — მეხსიერება კრიტიკულ ზღვარს მიუახლოვდა (>4 GB)` });
  else if (heapMB > 2048)  alerts.push({ lvl: 'warn',  msg: `Heap ${heapMB} MB — მეხსიერება მაღალია (>2 GB)` });
  if (rssMB > 6144)        alerts.push({ lvl: 'error', msg: `RSS ${rssMB} MB — პროცესი ბევრ მეხსიერებას მოიხმარს` });
  if (stats.database.status !== 'healthy') alerts.push({ lvl: 'error', msg: 'მონაცემთა ბაზასთან კავშირი გაწყვეტილია' });
  if (errRate > 5)         alerts.push({ lvl: 'error', msg: `Query Error Rate ${stats.queries.errorRate} — ბაზის შეცდომები გაიზარდა` });
  else if (errRate > 1)    alerts.push({ lvl: 'warn',  msg: `Query Error Rate ${stats.queries.errorRate}` });
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border ${
          a.lvl === 'error'
            ? 'bg-red-900/30 border-red-700/50 text-red-300'
            : 'bg-amber-900/30 border-amber-700/50 text-amber-300'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          {a.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} title="კოპირება"
      className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Endpoint row (expandable) ────────────────────────────────────────────────
function PathDisplay({ path }) {
  return (
    <span className="font-mono text-sm">
      {path.split('/').filter(Boolean).map((seg, i) => (
        <span key={i}>
          <span className="text-slate-500">/</span>
          <span className={seg.startsWith(':') ? 'text-amber-400' : 'text-slate-200'}>{seg}</span>
        </span>
      ))}
    </span>
  );
}

function EndpointRow({ method, path, desc, params }) {
  const [open, setOpen] = useState(false);
  const examplePath = buildExample(path, params.filter(p => p.example !== ''));
  const fullUrl = 'https://br-api.geostat.ge' + examplePath;
  const canRun = method === 'GET';

  return (
    <div className="border-b border-slate-700/40 last:border-0">
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 py-3 hover:bg-slate-700/20 transition-colors cursor-pointer text-left px-1 rounded"
      >
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded font-mono w-16 text-center border ${METHOD_CLS[method] || METHOD_CLS.GET}`}>
          {method}
        </span>
        <PathDisplay path={path} />
        <span className="text-xs text-slate-500 ml-auto mr-2 hidden sm:block">{desc}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
      </button>

      {/* Expanded details */}
      {open && (
        <div className="mb-3 ml-1 space-y-3">
          {/* Params table */}
          {params.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">პარამეტრები</div>
              <div className="rounded-lg overflow-hidden border border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-700">
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold w-40">პარამეტრი</th>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold w-20">ტიპი</th>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold w-24">სავალდებულო</th>
                      <th className="text-left px-3 py-2 text-slate-500 font-semibold">აღწერა</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(pm => (
                      <tr key={pm.name} className="border-b border-slate-700/50 last:border-0">
                        <td className="px-3 py-2">
                          <span className={`font-mono ${pm.t === 'r' ? 'text-amber-400' : 'text-sky-400'}`}>
                            {pm.t === 'r' ? `:${pm.name}` : pm.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{pm.dataType}</td>
                        <td className="px-3 py-2">
                          {pm.required
                            ? <span className="text-red-400 font-semibold">დიახ</span>
                            : <span className="text-slate-500">არა</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{pm.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Example */}
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">მაგალითი</div>
            <div className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-emerald-400 truncate">{fullUrl}</span>
              <CopyBtn text={fullUrl} />
            </div>
            {canRun && (
              <button
                onClick={() => window.open(fullUrl, '_blank')}
                className="mt-2 flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Play className="w-3 h-3" />
                გაშვება
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EndpointGroup({ name, icon, endpoints }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-700/30 transition-colors cursor-pointer">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-semibold text-slate-200 text-sm">{name}</span>
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{endpoints.length}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-2">{endpoints.map((e, i) => <EndpointRow key={i} {...e} />)}</div>}
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function Loader() {
  return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">იტვირთება...</div>;
}

function PageOverview({ stats, online, history }) {
  const d = stats;
  const heapHistory = history.map(p => p.heapPct);
  const rpmHistory  = history.map(p => p.rpm);
  return (
    <div className="space-y-6">
      <AlertBar stats={stats} />
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
            <MetricRow label="სულ Requests" value={d.requests.total.toLocaleString()} />
            <MetricRow label="Success Rate"  value={d.requests.successRate} />
            <MetricRow label="შეცდომები"     value={d.requests.errors} />
            <MetricRow label="Avg Duration"  value={`${d.requests.avgDuration} ms`} />
          </Card>
          <Card title="DB Connection Pool" icon={Database}>
            <MetricRow label="Response Time" value={d.database.responseTime || 'N/A'} />
            <MetricRow label="Pool Size"     value={d.database.poolSize ?? '—'} />
            <MetricRow label="Available"     value={d.database.poolAvailable ?? '—'} />
            <MetricRow label="Borrowed"      value={d.database.poolBorrowed ?? '—'} />
          </Card>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="Heap % — ბოლო 30 წთ" icon={Activity}>
          <Sparkline data={heapHistory} color="#3b82f6" unit="%" />
        </Card>
        <Card title="Requests/წთ — ბოლო 30 წთ" icon={TrendingUp}>
          <Sparkline data={rpmHistory} color="#10b981" unit="" />
        </Card>
      </div>
    </div>
  );
}

function PageEndpoints() {
  const [search, setSearch] = useState('');
  const filtered = search.trim()
    ? ENDPOINT_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(e =>
          e.path.toLowerCase().includes(search.toLowerCase()) ||
          e.desc.toLowerCase().includes(search.toLowerCase()) ||
          e.params.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  return (
    <div>
      <input type="text" placeholder="ძიება path, description, param..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
      />
      <div className="flex gap-4 text-xs text-slate-500 mb-4">
        <span><span className="inline-block w-2 h-2 rounded bg-amber-400 mr-1 align-middle" />:param — route param</span>
        <span><span className="inline-block w-2 h-2 rounded bg-sky-400 mr-1 align-middle" />param — query param</span>
        <span className="ml-auto text-slate-600">endpoint-ზე დაჭერით ვრცელდება</span>
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
        <MetricRow label="Node.js"     value={server.nodeVersion} />
        <MetricRow label="Platform"    value={server.platform} />
        <MetricRow label="CPU Cores"   value={server.cpuCount} />
        <MetricRow label="Uptime"      value={fmtUptime(server.uptime)} />
        <MetricRow label="Load Avg 1m" value={server.loadAvg[0].toFixed(2)} />
        <MetricRow label="System Free" value={`${server.freeSystemMemoryMB} MB / ${server.totalSystemMemoryMB} MB`} />
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
    } catch (e) { setMsg('შეცდომა: ' + e.message); }
    finally { setClearing(false); }
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
        <KpiCard icon="⚠️" label="Slow" value={`${queries.slow} (${queries.slowPct})`} color={queries.slow > 0 ? 'text-amber-400' : 'text-slate-100'} />
      </div>
      <Card title="Query სტატისტიკა" icon={TrendingUp}>
        <MetricRow label="სულ Queries"    value={queries.total.toLocaleString()} />
        <MetricRow label="Avg Exec Time"  value={`${queries.avgMs} ms`} />
        <MetricRow label="Peak Exec Time" value={`${queries.peakMs} ms`} />
        <MetricRow label="Slow Queries"   value={`${queries.slow} (${queries.slowPct})`} />
        <MetricRow label="Error Rate"     value={queries.errorRate} />
      </Card>
      {queries.slowQueries?.length > 0 && (
        <Card title="ნელი Queries (TOP 10)" icon={AlertCircle}>
          <div className="space-y-2 mt-1">
            {queries.slowQueries.map((q, i) => (
              <div key={i} className="bg-slate-900/50 rounded-lg p-3 text-xs">
                <div className="flex justify-between mb-1">
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

const STATUS_FILTERS = [
  { id: 'all',    label: 'ყველა' },
  { id: '2xx',    label: '2xx ✓' },
  { id: '4xx',    label: '4xx ⚠' },
  { id: '5xx',    label: '5xx ✕' },
  { id: 'errors', label: '4xx+5xx' },
];

function normalizePath(p) {
  return p.split('?')[0].replace(/\/\d{5,}/g, '/:id');
}

function buildEndpointStats(logs) {
  const map = {};
  for (const l of logs) {
    const key = `${l.method}\x00${normalizePath(l.path)}`;
    if (!map[key]) map[key] = { method: l.method, path: normalizePath(l.path), count: 0, totalMs: 0, errors: 0 };
    map[key].count++;
    map[key].totalMs += l.duration;
    if (l.status >= 400) map[key].errors++;
  }
  return Object.values(map).map(e => ({
    ...e,
    avgMs:     Math.round(e.totalMs / e.count),
    errorRate: e.count > 0 ? ((e.errors / e.count) * 100).toFixed(1) : '0.0',
  }));
}

const SORT_OPTS = [
  { id: 'count',  label: 'ხშირი'  },
  { id: 'avgMs',  label: 'ნელი'   },
  { id: 'errors', label: 'შეცდომა' },
];

function PageLogs() {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [autoR, setAutoR]         = useState(true);
  const [tab, setTab]             = useState('stats');
  const [statusFilter, setStatus] = useState('all');
  const [pathFilter, setPath]     = useState('');
  const [sortBy, setSortBy]       = useState('count');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/admin/dashboard/logs?limit=200');
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

  const endpointStats = buildEndpointStats(logs)
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, 20);

  const maxCount = endpointStats[0]?.count || 1;

  const visible = logs.filter(l => {
    if (pathFilter && !l.path.toLowerCase().includes(pathFilter.toLowerCase())) return false;
    if (statusFilter === '2xx'    && (l.status < 200 || l.status >= 300)) return false;
    if (statusFilter === '4xx'    && (l.status < 400 || l.status >= 500)) return false;
    if (statusFilter === '5xx'    && l.status < 500)                       return false;
    if (statusFilter === 'errors' && l.status < 400)                       return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
          <button onClick={() => setTab('stats')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${tab === 'stats' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
            📊 ტოპ Endpoints
          </button>
          <button onClick={() => setTab('logs')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${tab === 'logs' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
            📋 Logs ({logs.length})
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input type="checkbox" checked={autoR} onChange={e => setAutoR(e.target.checked)} className="rounded" />
          ავტო-განახლება
        </label>
      </div>

      {/* ── Tab: ტოპ Endpoints ── */}
      {tab === 'stats' && (
        loading ? <Loader /> : logs.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-12">Request-ები ჯერ არ არის</p>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-1">
              {SORT_OPTS.map(o => (
                <button key={o.id} onClick={() => setSortBy(o.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    sortBy === o.id
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}>
                  {o.label === 'ხშირი' ? '🔢' : o.label === 'ნელი' ? '⏱' : '⚠'} {o.label}
                </button>
              ))}
              <span className="text-xs text-slate-600 self-center ml-2">{endpointStats.length} unique endpoint</span>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase w-16">Method</th>
                    <th className="px-3 py-2.5 text-left text-slate-500 font-semibold uppercase">Path</th>
                    <th className="px-3 py-2.5 text-right text-slate-500 font-semibold uppercase w-20">მოთხოვნა</th>
                    <th className="px-3 py-2.5 text-right text-slate-500 font-semibold uppercase w-24">Avg ms</th>
                    <th className="px-3 py-2.5 text-right text-slate-500 font-semibold uppercase w-20">შეცდ.</th>
                  </tr>
                </thead>
                <tbody>
                  {endpointStats.map((e, i) => (
                    <tr key={i} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20">
                      <td className="px-3 py-2">
                        <span className={`font-bold font-mono px-1.5 py-0.5 rounded border ${METHOD_CLS[e.method] || METHOD_CLS.GET}`}>{e.method}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono text-slate-300 truncate max-w-xs">{e.path}</div>
                        <div className="mt-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                          <div className="h-1 rounded-full bg-blue-500/60" style={{ width: `${(e.count / maxCount) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200 font-semibold">{e.count.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-semibold ${e.avgMs > 2000 ? 'text-red-400' : e.avgMs > 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {e.avgMs.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2 text-right tabular-nums ${e.errors > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {e.errors > 0 ? `${e.errors} (${e.errorRate}%)` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Tab: Logs ── */}
      {tab === 'logs' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text" placeholder="path ფილტრი..."
              value={pathFilter} onChange={e => setPath(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-48"
            />
            <div className="flex gap-1">
              {STATUS_FILTERS.map(f => (
                <button key={f.id} onClick={() => setStatus(f.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 ml-auto">{visible.length} / {logs.length}</span>
          </div>
          {loading ? <Loader /> : visible.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">
              {logs.length === 0 ? 'Request-ები ჯერ არ არის' : 'ფილტრი ცარიელია'}
            </p>
          ) : (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-left w-16">Method</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-left">Path</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-center w-14">Status</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-left w-28 hidden md:table-cell">IP</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-right w-20">ms</th>
                    <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase text-right w-20">დრო</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(l => (
                    <tr key={l.id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20">
                      <td className="px-3 py-2">
                        <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded border ${METHOD_CLS[l.method] || METHOD_CLS.GET}`}>{l.method}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-300 truncate max-w-[200px]">{l.path}</td>
                      <td className={`px-3 py-2 text-center font-semibold text-xs tabular-nums ${statusColor(l.status)}`}>{l.status}</td>
                      <td className="px-3 py-2 text-xs text-slate-500 font-mono hidden md:table-cell">{l.ip || '—'}</td>
                      <td className="px-3 py-2 text-right text-xs text-slate-400 tabular-nums">{l.duration}</td>
                      <td className="px-3 py-2 text-right text-xs text-slate-500">{fmtTime(l.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',  label: 'მიმოხილვა',    icon: LayoutDashboard },
  { id: 'endpoints', label: 'API Endpoints', icon: Globe },
  { id: 'server',    label: 'სერვერი',       icon: Server },
  { id: 'database',  label: 'მონაც. ბაზა',  icon: Database },
  { id: 'cache',     label: 'Cache',         icon: Zap },
  { id: 'queries',   label: 'Query Monitor', icon: Activity },
  { id: 'logs',      label: 'Request Logs',  icon: FileText },
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats]     = useState(null);
  const [history, setHistory] = useState([]);
  const [online, setOnline]   = useState(true);
  const [ts, setTs]           = useState('');
  const [spin, setSpin]       = useState(false);
  const [page, setPage]       = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const applyData = useCallback((data) => {
    setStats(data);
    setHistory(prev => addHistoryPoint(prev, data));
    setOnline(true);
    setTs(new Date().toLocaleTimeString('ka-GE'));
  }, []);

  const load = useCallback(async () => {
    setSpin(true);
    try {
      const r = await fetch('/admin/dashboard/stats');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      applyData(await r.json());
    } catch {
      setOnline(false);
      setTs('შეცდომა');
    } finally { setSpin(false); }
  }, [applyData]);

  // SSE — real-time updates (replaces setInterval polling)
  useEffect(() => {
    const es = new EventSource('/admin/dashboard/events');
    es.onmessage = (e) => {
      try { applyData(JSON.parse(e.data)); } catch {}
    };
    es.onerror = () => setOnline(false);
    return () => es.close();
  }, [applyData]);

  function NavItem({ id, label, icon: Icon }) {
    const active = page === id;
    return (
      <button onClick={() => { setPage(id); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
        }`}>
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </button>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <img src="/dashboard-build/favicon.ico" alt="BR" className="w-8 h-8 rounded-lg" />
          <div>
            <div className="text-sm font-semibold text-slate-100">BR API</div>
            <div className="text-xs text-slate-500">Admin Dashboard</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(n => <NavItem key={n.id} {...n} />)}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full pulse shrink-0 ${online ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-xs text-slate-500 truncate">{online ? 'სისტემა დაკავშირებულია' : 'კავშირი გაწყვეტილია'}</span>
        </div>
        {ts && <div className="text-xs text-slate-600 mt-1">განახლდა: {ts}</div>}
      </div>
    </div>
  );

  const current = NAV.find(n => n.id === page);

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans">
      <aside className="hidden lg:flex flex-col w-56 bg-slate-800 border-r border-slate-700 shrink-0 fixed inset-y-0 left-0 z-20">
        {sidebar}
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 bg-slate-800 border-r border-slate-700 flex flex-col z-40">{sidebar}</aside>
        </div>
      )}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-200 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-100">{current?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{ts && `განახლდა: ${ts}`}</span>
            <button onClick={load}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
              <RefreshCw className={`w-3 h-3 ${spin ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">
          {page === 'overview'  && <PageOverview stats={stats} online={online} history={history} />}
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

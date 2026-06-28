// SiteAccess — standardized "Who can sign in to this site?" page for every NHA-AI site.
// BYTE-IDENTICAL across sites (anti-drift): only the route's appKey prop differs.
// Reads ONE shared backend (the site-security edge function) which computes the picture
// from nhaai_security. Read-only transparency; management lives in the hub console.
// Source of truth for this file: NHAWork docs/planning/standardized-site-security-pages-2026-06-28/SiteAccess.tsx
import { useEffect, useState } from "react";

const ENDPOINT = "https://nhwdgstjhugezhqlktie.supabase.co/functions/v1/site-security";

const TYPE_LABEL: Record<string, string> = {
  user_type: "User type", school_id: "School", department: "Department",
  job: "Job code", job_family: "Job family", email: "Individual (email)",
  dept_and_jobfamily: "Department + job family",
};

const CSS = `
.sa-root{--nha-blue:#003865;--nha-blue-mid:#0a4f86;--nha-blue-100:#dce9f4;--nha-cyan:#00AEEF;
 --nha-cyan-soft:#d9f1fb;--nha-cyan-dim:#eaf7fd;--nha-green-soft:#e8f3d6;--nha-orange-soft:#ffe7d1;
 --bg:#f4f6f8;--surface:#fff;--ink:#1c2733;--ink-soft:#54606c;--ink-faint:#8a96a2;
 --line:#e2e8ee;--line-soft:#eef2f6;--line-strong:#cdd6df;--fill-soft:#eef2f6;
 --mono:ui-monospace,SFMono-Regular,Menlo,monospace;--head:system-ui,-apple-system,sans-serif;
 background:var(--bg);min-height:100vh;color:var(--ink);font-family:var(--head);
 -webkit-font-smoothing:antialiased}
.sa-top{position:sticky;top:0;z-index:10;background:var(--surface);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 1.5rem}
.sa-brand{font-family:var(--head);font-weight:700;color:var(--nha-blue);text-decoration:none;font-size:1.05rem}
.sa-topr{display:flex;gap:1.25rem;align-items:center}
.sa-topr a{color:var(--ink-soft);text-decoration:none;font-size:.88rem;font-weight:600}
.sa-topr a:hover{color:var(--nha-blue)}
.sa-wrap{max-width:920px;margin:0 auto;padding:2rem 1.5rem 4.5rem}
.sa-eyebrow{display:inline-block;font-family:var(--mono);font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:.65rem}
.sa-wrap h1{color:var(--nha-blue);font-size:2.35rem;line-height:1.12;margin:0 0 .65rem;font-family:var(--head)}
.sa-id{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap;margin-bottom:.9rem}
.sa-id .nm{font-weight:700}
.sa-id .dom{font-family:var(--mono);font-size:.82rem;color:var(--ink-faint)}
.sa-pill{display:inline-block;padding:4px 11px;border-radius:999px;font-family:var(--mono);font-size:.72rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;background:var(--nha-blue-100);color:var(--nha-blue)}
.sa-lede{color:var(--ink-soft);font-size:1.05rem;line-height:1.55;margin-bottom:1.5rem;max-width:66ch}
.sa-manage{margin:0 0 1.5rem;padding:.9rem 1.15rem;background:rgba(0,174,239,.06);border:1px solid rgba(0,174,239,.25);border-radius:14px}
.sa-manage .lab{font-family:var(--mono);font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;color:var(--nha-blue);margin-bottom:8px}
.sa-row{display:flex;flex-wrap:wrap;gap:.65rem;align-items:center}
.sa-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 15px;border-radius:9px;text-decoration:none;font-weight:600;font-size:.82rem;min-height:40px;cursor:pointer}
.sa-btn-primary{background:var(--nha-blue);color:#fff}
.sa-btn-ghost{background:var(--surface);color:var(--nha-blue);border:1px solid var(--line)}
.sa-note{color:var(--ink-soft);font-size:.82rem;margin-left:auto;max-width:42ch}
.sa-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.9rem;margin-bottom:2rem}
.sa-tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:1.15rem}
.sa-tile .l{font-family:var(--mono);font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:.4rem}
.sa-tile .v{font-family:var(--head);font-size:1.9rem;font-weight:700;color:var(--nha-blue);line-height:1.15}
.sa-tile .v.sm{font-size:1.05rem;font-weight:600}
.sa-comp{background:var(--nha-cyan-dim);border-radius:14px;padding:.9rem 1.15rem;margin-bottom:1.5rem;font-size:.95rem;line-height:1.5}
.sa-comp strong{color:var(--nha-blue);font-weight:600}
.sa-card{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--nha-cyan);border-radius:14px;padding:1.15rem 1.5rem;margin-bottom:1.5rem}
.sa-card h3{margin:0 0 .4rem;color:var(--nha-blue);font-size:1.2rem}
.sa-card p{margin:0 0 .65rem;color:var(--ink-soft);line-height:1.55}
.sa-card ul{margin:0;padding-left:1.1rem;color:var(--ink-soft);font-size:.95rem}
.sa-card li{margin-bottom:4px}
.sa-card a{color:var(--nha-blue-mid);font-weight:600}
.sa-sec{font-family:var(--head);font-size:1.45rem;font-weight:700;color:var(--ink);margin:0 0 .4rem;display:flex;align-items:center;gap:.65rem;flex-wrap:wrap}
.sa-secnote{color:var(--ink-soft);font-size:.95rem;margin:0 0 1.15rem;max-width:64ch}
.sa-scope{display:inline-block;padding:4px 10px;border-radius:999px;font-family:var(--mono);font-size:.82rem;font-weight:500;letter-spacing:.04em;background:var(--nha-cyan-soft);color:var(--nha-blue-mid)}
.sa-g{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:1.15rem 1.5rem;margin-bottom:.9rem}
.sa-ghead{display:flex;align-items:baseline;justify-content:space-between;gap:.65rem;flex-wrap:wrap;margin-bottom:.65rem}
.sa-gname{font-family:var(--head);font-size:1.2rem;font-weight:600;color:var(--nha-blue)}
.sa-gmeta{display:flex;gap:.65rem;align-items:baseline;color:var(--ink-soft);font-size:.82rem;flex-wrap:wrap}
.sa-gkey{font-family:var(--mono);color:var(--ink-faint)}
.sa-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-family:var(--mono);font-size:.72rem;font-weight:500;letter-spacing:.04em;text-transform:uppercase}
.sa-badge-reuse{background:var(--nha-blue-100);color:var(--nha-blue)}
.sa-badge-one{background:var(--nha-orange-soft);color:#A13E00}
.sa-badge-cross{background:var(--nha-green-soft);color:#4D7600}
.sa-gdesc{color:var(--ink-soft);font-size:.95rem;margin-bottom:.9rem}
.sa-rule{background:var(--bg);border-left:3px solid var(--nha-cyan);padding:.65rem .9rem;border-radius:6px;margin-bottom:.4rem}
.sa-rule:last-child{margin-bottom:0}
.sa-rtype{font-family:var(--mono);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px}
.sa-rval{color:var(--ink);font-size:.95rem;line-height:1.5}
.sa-pipe{color:var(--ink-faint);margin:0 .4rem}
.sa-gcount{color:var(--ink-soft);font-size:.82rem;margin-top:.65rem;padding-top:.65rem;border-top:1px solid var(--line-soft)}
.sa-gcount strong{color:var(--ink);font-weight:600}
.sa-sp{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--nha-orange-soft);border-radius:9px;padding:.9rem 1.15rem;margin-bottom:.65rem}
.sa-sp[data-k=rule]{border-left-color:var(--nha-cyan)}
.sa-sp[data-k=shared]{border-left-color:#9ccc3a}
.sa-sp[data-k=delegate]{border-left-color:var(--nha-blue)}
.sa-sp[data-k=migrate]{border-left-color:#e0a800}
.sa-sp .l{font-weight:600;color:var(--ink);margin-bottom:3px}
.sa-sp .d{color:var(--ink-soft);font-size:.95rem;line-height:1.5}
.sa-rr{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--line-strong);border-radius:9px;padding:.65rem 1.15rem;margin-bottom:.4rem}
.sa-rr[data-k=owner]{border-left-color:var(--nha-blue)}
.sa-rr[data-k=per_person]{border-left-color:var(--nha-cyan)}
.sa-rr[data-k=shared]{border-left-color:#9ccc3a}
.sa-rr[data-k=flag]{border-left-color:#e0a800}
.sa-rrh{display:flex;justify-content:space-between;gap:.65rem;align-items:baseline;flex-wrap:wrap}
.sa-rra{font-weight:600;color:var(--ink)}
.sa-rrw{font-family:var(--mono);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:999px;background:var(--fill-soft);color:var(--ink-soft);white-space:nowrap}
.sa-rrw[data-k=owner]{background:var(--nha-blue-100);color:var(--nha-blue)}
.sa-rrw[data-k=flag]{background:var(--nha-orange-soft);color:#A13E00}
.sa-rrw[data-k=shared]{background:var(--nha-green-soft);color:#4D7600}
.sa-rrd{color:var(--ink-soft);font-size:.95rem;margin-top:4px;line-height:1.5}
.sa-foot{margin-top:2.75rem;padding-top:1.5rem;border-top:1px solid var(--line);color:var(--ink-faint);font-size:.82rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:.65rem}
.sa-foot code{font-family:var(--mono);font-size:.72rem;background:var(--fill-soft);padding:2px 6px;border-radius:4px;color:var(--ink-soft)}
.sa-empty{background:var(--surface);border:1px dashed var(--line-strong);border-radius:14px;padding:2rem;text-align:center;color:var(--ink-faint)}
@media(max-width:640px){.sa-wrap{padding:1.5rem 1rem 4.5rem}.sa-wrap h1{font-size:1.9rem}.sa-note{margin-left:0}}
`;

function Rules({ rules }: { rules: any[] }) {
  const byType: Record<string, string[]> = {};
  (rules || []).forEach((r) => { (byType[r.member_type] = byType[r.member_type] || []).push(r.display_label); });
  return (
    <>
      {Object.entries(byType).map(([type, vals]) => (
        <div className="sa-rule" key={type}>
          <div className="sa-rtype">{TYPE_LABEL[type] || type}</div>
          <div className="sa-rval">
            {vals.map((v, i) => (
              <span key={i}>{i > 0 && <span className="sa-pipe">·</span>}{v}</span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Group({ g }: { g: any }) {
  const badge = g.intent === "one-shot" ? "sa-badge-one" : "sa-badge-reuse";
  return (
    <div className="sa-g" data-testid="sa-group">
      <div className="sa-ghead">
        <div>
          <div className="sa-gname">{g.name}</div>
          <div className="sa-gmeta">
            <span className="sa-gkey">{g.key}</span>
            <span className={`sa-badge ${badge}`}>{g.intent}</span>
            {g.scope === "cross-app" && <span className="sa-badge sa-badge-cross">shared</span>}
            {g.valid_until && <span>Expires {String(g.valid_until).slice(0, 10)}</span>}
          </div>
        </div>
      </div>
      {g.description && <p className="sa-gdesc">{g.description}</p>}
      <Rules rules={g.rules} />
      {g.matched_member_count != null && (
        <div className="sa-gcount"><strong>{Number(g.matched_member_count).toLocaleString()}</strong> people currently match this group.</div>
      )}
    </div>
  );
}

export default function SiteAccess({ appKey }: { appKey: string }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    fetch(`${ENDPOINT}?app=${encodeURIComponent(appKey)}`)
      .then((r) => r.json())
      .then((x) => { if (live) (x && x.error ? setErr(x.error) : setD(x)); })
      .catch((e) => live && setErr(String(e?.message || e)));
    return () => { live = false; };
  }, [appKey]);

  return (
    <div className="sa-root">
      <style>{CSS}</style>
      <header className="sa-top">
        <a className="sa-brand" href="/">{d?.name || "Security"}</a>
        <div className="sa-topr">
          <a href="/">← Back to site</a>
          <a href="https://nha-ai.com/apps">NHA AI apps →</a>
        </div>
      </header>
      <div className="sa-wrap">
        {!d && !err && <div className="sa-empty">Loading site access…</div>}
        {err && <div className="sa-empty">Couldn't load site access: {err}</div>}
        {d && (
          <>
            <span className="sa-eyebrow">Security · Site Access</span>
            <h1 data-testid="sa-title">Who can sign in to this site?</h1>
            <div className="sa-id">
              <span className="nm" data-testid="sa-site-name">{d.name}</span>
              <span className="dom">{(d.base_url || "").replace("https://", "")}</span>
              <span className="sa-pill" data-testid="sa-model">{d.model_label}</span>
            </div>
            <p className="sa-lede">{d.summary}</p>

            <section className="sa-manage">
              <div className="lab">Manage access</div>
              <div className="sa-row">
                <a className="sa-btn sa-btn-primary" href={d.manage?.console_href} target="_blank" rel="noreferrer">Open Security console</a>
                {d.manage?.requestable && <a className="sa-btn sa-btn-ghost" href={d.base_url}>Request access</a>}
                <span className="sa-note">
                  {d.admins ? `${d.admins.count} ${d.admins.note}.` : "Managed centrally from the Security console."}
                </span>
              </div>
            </section>

            <div className="sa-stats">
              {(d.stat_tiles || []).map((t: any, i: number) => (
                <div className="sa-tile" key={i}>
                  <div className="l">{t.label}</div>
                  <div className={`v ${t.small ? "sm" : ""}`} data-testid="sa-stat">{t.value}</div>
                </div>
              ))}
            </div>

            {d.show_composition && (
              <div className="sa-comp">
                <strong>How rules combine:</strong> Within a single group, rules of the <em>same</em> type
                (e.g. multiple schools) are <strong>OR</strong>'d — any matching value qualifies. Rules of
                <em> different</em> types (e.g. user_type + school_id) are <strong>AND</strong>'d — all must
                match. Across groups, you only need to match <em>one</em>.
              </div>
            )}

            {d.groups && d.groups.length > 0 ? (
              <>
                <h2 className="sa-sec">Site access <span className="sa-scope">{d.scope_badge?.text || "Per-site policy"}</span></h2>
                <p className="sa-secnote">Granted on a per-site basis with <code>app_key='{d.app_key}'</code>. Each card is one access group.</p>
                {d.groups.map((g: any) => <Group g={g} key={g.key} />)}
              </>
            ) : d.model_card ? (
              <div className="sa-card">
                <h3>{d.model_card.title}</h3>
                <p>{d.model_card.body}</p>
                {d.model_card.bullets?.length > 0 && (
                  <ul>{d.model_card.bullets.map((b: string, i: number) => <li key={i}>{b}</li>)}</ul>
                )}
                {d.model_card.link && (
                  <p style={{ marginTop: ".65rem" }}><a href={d.model_card.link.href}>{d.model_card.link.label}</a></p>
                )}
              </div>
            ) : null}

            {d.special && d.special.length > 0 && (
              <>
                <h2 className="sa-sec" style={{ marginTop: "2rem" }}>Special access &amp; exceptions</h2>
                {d.special.map((s: any, i: number) => (
                  <div className="sa-sp" data-k={s.kind} key={i}>
                    <div className="l">{s.label}</div>
                    <div className="d">{s.detail}</div>
                  </div>
                ))}
              </>
            )}

            {d.special_rules && d.special_rules.length > 0 && (
              <>
                <h2 className="sa-sec" style={{ marginTop: "2rem" }}>Inside the site — what's restricted <span className="sa-scope">custom to this site</span></h2>
                <p className="sa-secnote">Special rules that apply <em>after</em> sign-in — who can do what within the site. Inventoried centrally so it's known; enforced server-side by each site.</p>
                {d.special_rules.map((r: any, i: number) => (
                  <div className="sa-rr" data-k={r.kind} key={i}>
                    <div className="sa-rrh"><span className="sa-rra">{r.area}</span><span className="sa-rrw" data-k={r.kind}>{r.who}</span></div>
                    <div className="sa-rrd">{r.detail}</div>
                  </div>
                ))}
              </>
            )}

            <div className="sa-foot">
              <span>Source of truth: <code>nhaai_security</code> on Supabase (one shared endpoint, every site)</span>
              <span>Cookie: <code>{d.cookie_name}</code> · live</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

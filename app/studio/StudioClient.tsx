'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl, download, drawSlide, ensureFonts, loadImage, slideToBlob } from '@/lib/studio-draw';
import RefsPanel from './RefsPanel';
import { uploadImage } from './upload';
import {
  GOALS,
  ROUTE_PRESETS,
  SIZES,
  STATUS_LABEL,
  TEMPLATES,
  captionVariants,
  makeCaption,
  makeHashtags,
  newSlide,
  srcFor,
  starterSlides,
  templateDef,
  type CaptionGoal,
  type Post,
  type PostFormat,
  type PostLang,
  type PostStats,
  type PostStatus,
  type RefPost,
  type Slide,
  type TemplateId,
  type Theme,
} from '@/lib/studio';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const THEMES: { id: Theme; label: string }[] = [
  { id: 'light', label: '밝게' },
  { id: 'green', label: '초록' },
  { id: 'dark', label: '어둡게' },
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json' } });
  if (res.status === 401) {
    window.location.href = '/studio';
    throw new Error('로그인이 필요해요');
  }
  if (!res.ok) throw new Error('저장하지 못했어요. 다시 시도해 주세요.');
  return res.json();
}

export default function StudioClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Record<string, PostStats>>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Post | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [refs, setRefs] = useState<RefPost[]>([]);

  const load = useCallback(async () => {
    const [data, r] = await Promise.all([
      api<{ posts: Post[]; stats: Record<string, PostStats> }>('/api/studio/posts'),
      api<{ refs: RefPost[] }>('/api/studio/refs'),
    ]);
    setPosts(data.posts);
    setStats(data.stats);
    setRefs(r.refs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [load]);

  const select = (p: Post | null) => {
    if (dirty && !confirm('저장하지 않은 변경이 있어요. 버리고 이동할까요?')) return;
    setSelId(p?.id ?? null);
    setDraft(p ? structuredClone(p) : null);
    setDirty(false);
    setMsg('');
  };

  const create = async (date: string) => {
    if (dirty && !confirm('저장하지 않은 변경이 있어요. 버리고 새로 만들까요?')) return;
    const goal: CaptionGoal = 'buyer';
    const lang: PostLang = 'ko';
    const linkWord = '프로필 링크';
    const { post } = await api<{ post: Post }>('/api/studio/posts', {
      method: 'POST',
      body: JSON.stringify({
        date,
        title: '새 게시물',
        goal,
        lang,
        slides: starterSlides(goal, lang),
        caption: makeCaption(goal, lang, 'eu', linkWord, 0),
        hashtags: makeHashtags(goal, lang, 'eu'),
      }),
    });
    setPosts((ps) => [...ps, post]);
    setStats((s) => ({ ...s, [post.id]: { visitors: 0, clicks: 0, signups: 0 } }));
    setSelId(post.id);
    setDraft(structuredClone(post));
    setDirty(false);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setMsg('');
    try {
      const { post } = await api<{ post: Post }>(`/api/studio/posts/${draft.id}`, { method: 'PUT', body: JSON.stringify(draft) });
      setPosts((ps) => ps.map((p) => (p.id === post.id ? post : p)));
      setDirty(false);
      setMsg('저장했어요.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft || !confirm('이 게시물을 지울까요? 추적 링크 기록은 남아요.')) return;
    await api(`/api/studio/posts/${draft.id}`, { method: 'DELETE' });
    setPosts((ps) => ps.filter((p) => p.id !== draft.id));
    setSelId(null);
    setDraft(null);
    setDirty(false);
  };

  const patch = (p: Partial<Post>) => {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
  };

  // 다른 탭에서 닫을 때 경고
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const monthPosts = posts.filter((p) => p.date.startsWith(ymd(month).slice(0, 7))).sort((a, b) => a.date.localeCompare(b.date));
  const totals = posts.reduce((t, p) => {
    const s = stats[p.id];
    return s ? { visitors: t.visitors + s.visitors, signups: t.signups + s.signups } : t;
  }, { visitors: 0, signups: 0 });

  return (
    <div className="studio">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark p2p-mark" aria-hidden="true">T</span>
          <span>마케팅 스튜디오</span>
        </div>
        <span style={{ flex: 1 }} />
        <a className="tab hide-sm" href="/admin">수요 조사 결과</a>
        <a className="tab hide-sm" href="/" target="_blank" rel="noreferrer">사이트 보기</a>
        <form method="post" action="/api/admin/logout"><button className="btn btn-ghost btn-sm" type="submit">로그아웃</button></form>
      </header>

      <main className="page studio-page">
        <div className="studio-grid">
          <aside className="studio-side">
            <Calendar month={month} setMonth={setMonth} posts={posts} selId={selId} onPick={(p) => select(p)} onCreate={create} />
            <div className="card-flush">
              <div className="row small" style={{ fontWeight: 600, justifyContent: 'space-between' }}>
                <span>{month.getMonth() + 1}월 게시물 {monthPosts.length}개</span>
                <span className="muted">전체 방문 {totals.visitors} · 등록 {totals.signups}</span>
              </div>
              {loading ? (
                <div className="empty">불러오는 중…</div>
              ) : monthPosts.length === 0 ? (
                <div className="empty">날짜를 눌러 첫 게시물을 만들어 보세요.</div>
              ) : (
                monthPosts.map((p) => {
                  const s = stats[p.id];
                  return (
                    <button key={p.id} type="button" className="row studio-item" aria-current={p.id === selId} onClick={() => select(p)}>
                      <span className="studio-date">{p.date.slice(5).replace('-', '/')}</span>
                      <span className="grow" style={{ textAlign: 'left' }}>
                        <b>{p.title || '제목 없음'}</b>
                        <span className="tiny muted" style={{ display: 'block' }}>
                          {SIZES[p.format].label.split(' ')[0]} · {p.slides.length}장 · 방문 {s?.visitors ?? 0} · 등록 {s?.signups ?? 0}
                        </span>
                      </span>
                      <span className={`chip st-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </button>
                  );
                })
              )}
            </div>
            <RefsPanel refs={refs} setRefs={setRefs} />
          </aside>

          <section className="studio-main">
            {!draft ? (
              <div className="card empty" style={{ padding: 48 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>왼쪽 달력에서 날짜를 누르면 게시물이 만들어져요.</p>
                <p className="small" style={{ marginTop: 8 }}>카드 이미지 → 캡션·해시태그 → 추적 링크 순서로 채우고, PNG를 내려받아 인스타그램에 올리면 돼요.</p>
                <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => create(ymd(new Date()))}>오늘 날짜로 새 게시물</button>
              </div>
            ) : (
              <Editor
                key={draft.id}
                post={draft}
                stats={stats[draft.id]}
                refs={refs}
                patch={patch}
                dirty={dirty}
                saving={saving}
                msg={msg}
                onSave={save}
                onDelete={remove}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Calendar({ month, setMonth, posts, selId, onPick, onCreate }: {
  month: Date;
  setMonth: (d: Date) => void;
  posts: Post[];
  selId: string | null;
  onPick: (p: Post) => void;
  onCreate: (date: string) => void;
}) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);
  const today = ymd(new Date());
  const byDate = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of posts) m.set(p.date, [...(m.get(p.date) ?? []), p]);
    return m;
  }, [posts]);

  return (
    <div className="card cal">
      <div className="cal-head">
        <button type="button" className="btn btn-ghost btn-sm" aria-label="이전 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <strong>{month.getFullYear()}년 {month.getMonth() + 1}월</strong>
        <button type="button" className="btn btn-ghost btn-sm" aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {WEEK.map((w) => (
          <span key={w} className="cal-w">{w}</span>
        ))}
        {days.map((d) => {
          const key = ymd(d);
          const list = byDate.get(key) ?? [];
          const out = d.getMonth() !== month.getMonth();
          return (
            <div key={key} className={`cal-day${out ? ' out' : ''}${key === today ? ' today' : ''}`}>
              <button type="button" className="cal-num" onClick={() => onCreate(key)} title={`${key}에 새 게시물`}>
                {d.getDate()}
              </button>
              {list.map((p) => (
                <button key={p.id} type="button" className={`cal-post st-${p.status}`} aria-current={p.id === selId} onClick={() => onPick(p)} title={p.title}>
                  {p.title || '제목 없음'}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <p className="tiny muted">날짜 숫자를 누르면 그날 게시물이 새로 만들어져요.</p>
    </div>
  );
}

function SlideCanvas({ slide, format, lang, page, className }: { slide: Slide; format: PostFormat; lang: PostLang; page?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { w, h } = SIZES[format];
  useEffect(() => {
    let alive = true;
    Promise.all([ensureFonts(), slide.image ? loadImage(slide.image) : Promise.resolve(null)]).then(([, image]) => {
      const ctx = ref.current?.getContext('2d');
      if (alive && ctx) drawSlide(ctx, slide, format, lang, page, image);
    });
    return () => {
      alive = false;
    };
  }, [slide, format, lang, page]);
  return <canvas ref={ref} width={w} height={h} className={className} />;
}

function Editor({ post, stats, refs, patch, dirty, saving, msg, onSave, onDelete }: {
  post: Post;
  stats?: PostStats;
  refs: RefPost[];
  patch: (p: Partial<Post>) => void;
  dirty: boolean;
  saving: boolean;
  msg: string;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [cur, setCur] = useState(0);
  const [route, setRoute] = useState('eu');
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);
  const slide = post.slides[Math.min(cur, post.slides.length - 1)];
  const def = slide ? templateDef(slide.template) : null;
  const link = typeof window !== 'undefined' ? `${window.location.origin}/?src=${srcFor(post.slug)}` : '';
  const pages = post.slides.length;

  const setSlides = (slides: Slide[]) => patch({ slides });
  const setSlide = (s: Partial<Slide>) => setSlides(post.slides.map((x, i) => (i === cur ? { ...x, ...s } : x)));
  const setField = (k: string, v: string) => slide && setSlide({ fields: { ...slide.fields, [k]: v } });

  const addSlide = (id: TemplateId) => {
    setSlides([...post.slides, newSlide(id, post.lang)]);
    setCur(post.slides.length);
  };
  const move = (dir: -1 | 1) => {
    const j = cur + dir;
    if (j < 0 || j >= pages) return;
    const s = [...post.slides];
    [s[cur], s[j]] = [s[j], s[cur]];
    setSlides(s);
    setCur(j);
  };
  const delSlide = () => {
    if (pages <= 1) return;
    setSlides(post.slides.filter((_, i) => i !== cur));
    setCur(Math.max(0, cur - 1));
  };

  const regenCaption = (goal = post.goal, lang = post.lang, r = route, v = variant) => {
    patch({ caption: makeCaption(goal, lang, r, lang === 'ko' ? '프로필 링크' : 'link in bio', v), hashtags: makeHashtags(goal, lang, r) });
  };

  const changeLang = (lang: PostLang) => {
    if (lang === post.lang) return;
    const reset = confirm('카드 글자와 캡션을 이 언어의 기본 문구로 바꿀까요? (취소하면 언어 설정만 바뀌어요)');
    if (reset) {
      patch({ lang, slides: post.slides.map((s) => ({ ...newSlide(s.template, lang, s.theme) })), caption: makeCaption(post.goal, lang, route, lang === 'ko' ? '프로필 링크' : 'link in bio', variant), hashtags: makeHashtags(post.goal, lang, route) });
    } else patch({ lang });
  };

  const copy = async (what: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      prompt('복사해서 쓰세요', value);
    }
  };

  const savePng = async (i: number) => {
    const blob = await slideToBlob(post.slides[i], post.format, post.lang, pages > 1 ? `${i + 1}/${pages}` : undefined);
    download(blob, `tripcarry_${post.slug}_${i + 1}.png`);
  };
  const saveAll = async () => {
    setBusy(true);
    try {
      for (let i = 0; i < pages; i++) {
        await savePng(i);
        await new Promise((r) => setTimeout(r, 350));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="studio-editor">
      <div className="card studio-bar">
        <input className="input studio-title" value={post.title} onChange={(e) => patch({ title: e.target.value })} placeholder="게시물 이름 (나만 보는 메모)" aria-label="게시물 이름" />
        <div className="studio-meta">
          <label className="field">
            <span className="label">올릴 날짜</span>
            <input className="input" type="date" value={post.date} onChange={(e) => e.target.value && patch({ date: e.target.value })} />
          </label>
          <label className="field">
            <span className="label">형식</span>
            <select className="select" value={post.format} onChange={(e) => patch({ format: e.target.value as PostFormat })}>
              {(Object.keys(SIZES) as PostFormat[]).map((f) => (
                <option key={f} value={f}>{SIZES[f].label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">언어</span>
            <select className="select" value={post.lang} onChange={(e) => changeLang(e.target.value as PostLang)}>
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="field">
            <span className="label">상태</span>
            <select className="select" value={post.status} onChange={(e) => patch({ status: e.target.value as PostStatus })}>
              {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="studio-actions">
          <span className="small muted">{dirty ? '저장하지 않은 변경이 있어요' : msg}</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>삭제</button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving || !dirty}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </div>

      <AiPanel post={post} refs={refs} patch={(p) => { patch(p); setCur(0); }} />

      <section className="card studio-section">
        <div className="section-head">
          <h2>① 카드 이미지</h2>
          <span>{pages}장 · {SIZES[post.format].label}</span>
        </div>
        <div className="thumbs" role="tablist" aria-label="카드 목록">
          {post.slides.map((s, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === cur} className="thumb" onClick={() => setCur(i)}>
              <SlideCanvas slide={s} format={post.format} lang={post.lang} page={pages > 1 ? `${i + 1}/${pages}` : undefined} />
              <span>{i + 1}. {templateDef(s.template).name}</span>
            </button>
          ))}
          <div className="thumb-add">
            <span className="tiny muted">카드 추가</span>
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" className="chip chip-neutral chip-btn" onClick={() => addSlide(t.id)} title={t.desc}>+ {t.name}</button>
            ))}
          </div>
        </div>

        {slide && def && (
          <div className="slide-edit">
            <div className="slide-preview">
              <SlideCanvas slide={slide} format={post.format} lang={post.lang} page={pages > 1 ? `${cur + 1}/${pages}` : undefined} className={`preview-${post.format}`} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="btn btn-sm" onClick={() => savePng(cur)}>이 장 PNG 받기</button>
                <button type="button" className="btn btn-dark btn-sm" onClick={saveAll} disabled={busy}>{busy ? '내려받는 중…' : `전체 ${pages}장 받기`}</button>
              </div>
            </div>
            <div className="slide-fields">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <b>{cur + 1}. {def.name}</b> <span className="small muted">{def.desc}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(-1)} disabled={cur === 0} aria-label="앞으로">←</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(1)} disabled={cur === pages - 1} aria-label="뒤로">→</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={delSlide} disabled={pages <= 1}>이 장 삭제</button>
                </div>
              </div>
              <div className="field">
                <span className="label">색</span>
                <div className="pills">
                  {THEMES.map((t) => (
                    <button key={t.id} type="button" className="pill btn-sm" aria-pressed={slide.theme === t.id} onClick={() => setSlide({ theme: t.id })}>{t.label}</button>
                  ))}
                </div>
              </div>
              {slide.template === 'photo' && (
                <div className="field">
                  <span className="label">배경 사진</span>
                  {(post.photos ?? []).length === 0 ? (
                    <span className="small muted">위 "AI로 만들기"에서 이 게시물에 사진을 먼저 올려 주세요.</span>
                  ) : (
                    <div className="photo-pick">
                      {(post.photos ?? []).map((id) => (
                        <button key={id} type="button" aria-pressed={slide.image === id} onClick={() => setSlide({ image: id })}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assetUrl(id)} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {def.fields.map((f) => (
                <label key={f.key} className="field">
                  <span className="label">{f.label}</span>
                  {f.multiline ? (
                    <textarea className="textarea" rows={2} value={slide.fields[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
                  ) : (
                    <input className="input" value={slide.fields[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
                  )}
                </label>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSlide({ fields: newSlide(slide.template, post.lang).fields })}>기본 문구로 되돌리기</button>
            </div>
          </div>
        )}
      </section>

      <section className="card studio-section">
        <div className="section-head">
          <h2>② 캡션 · 해시태그</h2>
          <span>인스타그램 캡션 최대 2,200자 · 해시태그 30개</span>
        </div>
        <div className="studio-meta">
          <label className="field">
            <span className="label">목적</span>
            <select className="select" value={post.goal} onChange={(e) => { const g = e.target.value as CaptionGoal; patch({ goal: g }); regenCaption(g); }}>
              {GOALS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label">노선</span>
            <select className="select" value={route} onChange={(e) => { setRoute(e.target.value); regenCaption(post.goal, post.lang, e.target.value); }}>
              {ROUTE_PRESETS.map((r) => (
                <option key={r.id} value={r.id}>{r.ko}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="label">&nbsp;</span>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const v = variant + 1;
                setVariant(v);
                regenCaption(post.goal, post.lang, route, v);
              }}
            >
              다른 문구 ({(variant % captionVariants(post.goal, post.lang)) + 1}/{captionVariants(post.goal, post.lang)})
            </button>
          </div>
          <div className="field">
            <span className="label">&nbsp;</span>
            <button type="button" className="btn btn-ghost" onClick={() => patch({ slides: starterSlides(post.goal, post.lang) })}>이 목적의 카드 세트로 바꾸기</button>
          </div>
        </div>
        <label className="field">
          <span className="label">캡션 <span className="opt">{post.caption.length}/2200</span></span>
          <textarea className="textarea" rows={9} value={post.caption} maxLength={2200} onChange={(e) => patch({ caption: e.target.value })} />
        </label>
        <label className="field">
          <span className="label">해시태그 <span className="opt">{post.hashtags.split(/\s+/).filter((x) => x.startsWith('#')).length}/30</span></span>
          <textarea className="textarea" rows={2} value={post.hashtags} onChange={(e) => patch({ hashtags: e.target.value })} />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => copy('caption', `${post.caption}\n.\n.\n${post.hashtags}`)}>
            {copied === 'caption' ? '복사됐어요 ✓' : '캡션 + 해시태그 복사'}
          </button>
          <button type="button" className="btn" onClick={() => copy('tags', post.hashtags)}>{copied === 'tags' ? '복사됐어요 ✓' : '해시태그만 복사'}</button>
        </div>
      </section>

      <section className="card studio-section">
        <div className="section-head">
          <h2>③ 추적 링크</h2>
          <span>이 게시물로 들어온 사람만 따로 세요</span>
        </div>
        <div className="track-link">
          <code>{link}</code>
          <button type="button" className="btn btn-sm" onClick={() => copy('link', link)}>{copied === 'link' ? '복사됐어요 ✓' : '링크 복사'}</button>
        </div>
        <ul className="small muted" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>인스타그램 캡션의 링크는 눌리지 않아요. <b>스토리의 링크 스티커</b>나 <b>프로필 링크</b>에 이 주소를 넣으세요.</li>
          <li>프로필 링크는 하나라서, 가장 밀고 있는 게시물의 링크로 바꿔 두면 게시물별로 비교할 수 있어요.</li>
        </ul>
        <div className="grid-3">
          <div className="card"><div className="stat-num">{stats?.visitors ?? 0}</div><div className="stat-label">방문자</div></div>
          <div className="card"><div className="stat-num">{stats?.clicks ?? 0}</div><div className="stat-label">버튼 클릭</div></div>
          <div className="card"><div className="stat-num">{stats?.signups ?? 0}</div><div className="stat-label">사전 등록</div></div>
        </div>
      </section>
    </div>
  );
}

function AiPanel({ post, refs, patch }: { post: Post; refs: RefPost[]; patch: (p: Partial<Post>) => void }) {
  const [idea, setIdea] = useState('');
  const [count, setCount] = useState(post.format === 'story' ? 1 : 4);
  const [useRefs, setUseRefs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const photos = post.photos ?? [];

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setErr('');
    try {
      const ids: string[] = [];
      for (const f of Array.from(files).slice(0, 5 - photos.length)) ids.push(await uploadImage(f));
      patch({ photos: [...photos, ...ids] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '사진을 올리지 못했어요.');
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    if (!idea.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idea, lang: post.lang, format: post.format, goal: post.goal, slideCount: count, refIds: useRefs, photoIds: photos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI가 만들지 못했어요.');
      if (post.slides.length && !confirm('지금 카드와 캡션을 AI가 만든 것으로 바꿀까요? (저장 전이라 마음에 안 들면 다시 만들 수 있어요)')) return;
      patch({ title: data.title, slides: data.slides, caption: data.caption, hashtags: data.hashtags });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI가 만들지 못했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card studio-section ai-panel">
      <div className="section-head">
        <h2>✨ AI로 만들기</h2>
        <span>아이디어 + (참고 게시물) + (사진) → 카드·캡션·해시태그</span>
      </div>
      <textarea
        className="textarea"
        rows={3}
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        maxLength={1000}
        placeholder="예: 파리 약국 크림을 한국 가격과 비교하는 카드뉴스. 20~30대 여성, 저장하고 싶게. 마지막에 사전 등록 유도"
        aria-label="아이디어"
      />

      <div className="field">
        <span className="label">사진 <span className="opt">선택 · 최대 5장 · AI가 사진을 보고 관련 문구를 쓰고, 사진 카드 배경으로 써요</span></span>
        <div className="photo-pick">
          {photos.map((id) => (
            <div key={id} className="photo-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(id)} alt="" />
              <button type="button" aria-label="사진 빼기" onClick={() => patch({ photos: photos.filter((x) => x !== id), slides: post.slides.map((s) => (s.image === id ? { ...s, image: undefined } : s)) })}>×</button>
            </div>
          ))}
          {photos.length < 5 && (
            <label className="photo-add">
              {uploading ? '올리는 중…' : '+ 사진'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>

      {refs.length > 0 && (
        <div className="field">
          <span className="label">참고할 게시물 <span className="opt">선택 · 최대 5개 · 왼쪽 보관함에서 추가</span></span>
          <div className="photo-pick">
            {refs.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={useRefs.includes(r.id)}
                title={r.style?.summary ?? r.note}
                onClick={() => setUseRefs((u) => (u.includes(r.id) ? u.filter((x) => x !== r.id) : u.length < 5 ? [...u, r.id] : u))}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(r.assetId)} alt={r.note || '참고 게시물'} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          카드
          <select className="select" style={{ width: 90 }} value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}장</option>
            ))}
          </select>
        </label>
        <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          목적
          <select className="select" style={{ width: 'auto' }} value={post.goal} onChange={(e) => patch({ goal: e.target.value as CaptionGoal })}>
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>
        <span className="small muted">{post.lang === 'ko' ? '한국어' : 'English'} · {post.format === 'feed' ? '피드' : '스토리'} (위 설정)</span>
        <button type="button" className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={generate} disabled={busy || !idea.trim()}>
          {busy ? 'AI가 만드는 중… (10~30초)' : '✨ AI로 카드·캡션 만들기'}
        </button>
      </div>
      {err && <div className="notice notice-warn small">{err}</div>}
    </section>
  );
}

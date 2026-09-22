import { useEffect, useRef, useState } from "react";
import NetworkScene from "./components/NetworkScene";
import {
  profile,
  summary,
  highlights,
  competencies,
  experience,
  education,
  continuous,
  languages,
  leadership,
  path,
  healthFocus,
  plan90,
} from "./data/cv";

const NAV = [
  ["perfil", "Perfil"],
  ["desempeno", "Desempeño"],
  ["salud", "Enfoque salud"],
  ["competencias", "Competencias"],
  ["experiencia", "Experiencia"],
  ["educacion", "Educación"],
  ["contacto", "Contacto"],
];

const Icon = ({ d, label }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden={!label} role={label ? "img" : undefined} aria-label={label}>
    <path d={d} fill="currentColor" />
  </svg>
);
const ICONS = {
  pin: "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
  phone: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z",
  mail: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5Z",
  linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.3 18.3V10H5.7v8.3h2.6ZM7 8.9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11.3 9.4v-4.6c0-2.4-1.3-3.6-3-3.6a2.6 2.6 0 0 0-2.4 1.3V10h-2.5v8.3h2.6v-4.4c0-1.1.2-2.2 1.6-2.2s1.4 1.3 1.4 2.3v4.3h2.3Z",
  github: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  award: "M12 2a7 7 0 0 0-4 12.7V22l4-2 4 2v-7.3A7 7 0 0 0 12 2Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z",
  download: "M5 20h14v-2H5v2Zm7-3 5-5-1.4-1.4-2.6 2.6V4h-2v9.2l-2.6-2.6L7 12l5 5Z",
};

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useActiveSection() {
  const [active, setActive] = useState("");
  useEffect(() => {
    const onScroll = () => {
      let current = "";
      NAV.forEach(([id]) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = id;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return active;
}


function useSpotlight() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return undefined;
    const onMove = (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      if (el.classList.contains("tilt")) {
        el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`);
        el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
      }
    };
    const onOut = (e) => {
      const el = e.target.closest && e.target.closest(".tilt");
      if (el && !el.contains(e.relatedTarget)) {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      }
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return p;
}

function Rotator({ words, interval = 2200 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval]);
  return (
    <span className="rotator" aria-live="polite">
      <span key={i} className="rotator__word">
        {words[i]}
      </span>
    </span>
  );
}

function Counter({ value }) {
  const ref = useRef(null);
  const match = /^(\D*)(\d+)(.*)$/.exec(value);
  const [shown, setShown] = useState(match ? `${match[1]}0${match[3]}` : value);
  useEffect(() => {
    if (!match) return undefined;
    const el = ref.current;
    const target = parseInt(match[2], 10);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1400;
      const tick = (now) => {
        const k = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(`${match[1]}${Math.round(target * eased)}${match[3]}`);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span ref={ref} className="stat__value">
      {shown}
    </span>
  );
}

const Ecg = () => (
  <svg className="ecg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="ecgGrad" x1="0" x2="1">
        <stop offset="0" stopColor="#2dd4bf" stopOpacity="0" />
        <stop offset="0.35" stopColor="#2dd4bf" />
        <stop offset="0.7" stopColor="#38bdf8" />
        <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path className="ecg__base" d="M0 70 H250 l18 -8 l14 8 H330 l10 18 l16 -78 l16 92 l12 -24 H470 l22 -14 l22 14 H700 l18 -8 l14 8 H780 l10 18 l16 -78 l16 92 l12 -24 H920 l22 -14 l22 14 H1200" />
    <path
      className="ecg__line"
      pathLength="1000"
      d="M0 70 H250 l18 -8 l14 8 H330 l10 18 l16 -78 l16 92 l12 -24 H470 l22 -14 l22 14 H700 l18 -8 l14 8 H780 l10 18 l16 -78 l16 92 l12 -24 H920 l22 -14 l22 14 H1200"
    />
  </svg>
);

function Marquee({ items }) {
  const row = items.concat(items);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {row.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}

const Section = ({ id, kicker, title, children }) => (
  <section id={id} className="section">
    <header className="section__head" data-reveal>
      <span className="kicker">{kicker}</span>
      <h2>{title}</h2>
    </header>
    {children}
  </section>
);

function Job({ job, index }) {
  const [open, setOpen] = useState(false);
  const PREVIEW = 5;
  const hidden = job.bullets.length - PREVIEW;
  return (
    <article className="job" data-reveal style={{ "--i": index }}>
      <div className="job__dot" aria-hidden="true" />
      <div className={`job__card spot${open ? " job--open" : ""}`}>
        <div className="job__top">
          <div>
            <h3 className="job__company">{job.company}</h3>
            {job.sector && <span className="job__sector">{job.sector}</span>}
          </div>
          <div className="job__meta">
            <span>{job.period}</span>
            <span>{job.place}</span>
          </div>
        </div>
        <p className="job__role">
          {job.role}
          {job.subrole && <span> | {job.subrole}</span>}
        </p>
        {job.impact && (
          <ul className="job__impact">
            {job.impact.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        {job.intro && <p className="job__intro">{job.intro}</p>}
        <ul className="job__bullets">
          {job.bullets.map((b, i) => (
            <li key={i} className={i >= PREVIEW ? "job__extra" : undefined}>
              {b}
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button className="job__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? "Ver menos" : `Ver ${hidden} más`}
          </button>
        )}
        {job.result && (
          <div className="job__result">
            <strong>Resultado destacado</strong>
            <p>{job.result}</p>
          </div>
        )}
        <div className="job__tags">
          <span className="job__taglabel">{job.tagLabel}:</span>
          {job.tags.map((t) => (
            <span key={t} className="chip chip--sm">
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  useReveal();
  useSpotlight();
  const progress = useScrollProgress();
  const active = useActiveSection();
  const [menu, setMenu] = useState(false);

  return (
    <>
      <NetworkScene />
      <div className="vignette" aria-hidden="true" />
      <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />

      <nav className={`nav ${menu ? "nav--open" : ""}`}>
        <a href="#top" className="nav__brand" onClick={() => setMenu(false)}>
          <span className="monogram">JD</span>
          <span className="nav__name">James Diaz Lopez</span>
        </a>
        <button className="nav__burger" aria-label="Menú" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <span />
          <span />
        </button>
        <div className="nav__links">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? "is-active" : ""} onClick={() => setMenu(false)}>
              {label}
            </a>
          ))}
          <button className="btn btn--ghost btn--sm" onClick={() => window.print()}>
            <Icon d={ICONS.download} /> PDF
          </button>
        </div>
      </nav>

      <main id="top">
        <header className="hero">
          <div className="hero__inner">
            <p className="hero__eyebrow" data-reveal>
              <span className="pulse-dot" /> {profile.location} · <Rotator words={profile.focus} />
            </p>
            <h1 className="hero__name" data-reveal>
              James <span>Diaz Lopez</span>
            </h1>
            <p className="hero__title" data-reveal>
              <span className="hero__role">{profile.title}</span>
              <span className="hero__tag">{profile.tagline.join(" | ")}</span>
            </p>
            <ul className="hero__focus" data-reveal>
              {profile.focus.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="hero__cta" data-reveal>
              <a className="btn btn--primary" href={`mailto:${profile.email}`}>
                <Icon d={ICONS.mail} /> Contactar
              </a>
              <button className="btn btn--ghost" onClick={() => window.print()}>
                <Icon d={ICONS.download} /> Descargar CV
              </button>
              <div className="hero__social">
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <Icon d={ICONS.linkedin} />
                </a>
                <a href={profile.links.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <Icon d={ICONS.github} />
                </a>
                <a href={profile.links.certifications} target="_blank" rel="noreferrer" aria-label="Certificaciones">
                  <Icon d={ICONS.award} />
                </a>
              </div>
            </div>
            <div className="print-contact">
              {profile.location} · {profile.phone} · {profile.email} · linkedin.com/in/jmc-business · github.com/jmc-software-x
            </div>
          </div>
          <Ecg />
          <a href="#perfil" className="hero__scroll" aria-label="Bajar al perfil">
            <span />
          </a>
        </header>

        <Section id="perfil" kicker="01" title="Perfil ejecutivo">
          <div className="profile">
            <div className="profile__text" data-reveal>
              {summary.map((p, i) => (
                <p key={i} className={i === 0 ? "lead" : undefined}>
                  {p}
                </p>
              ))}
            </div>
            <div className="stats">
              {highlights.map((h, i) => (
                <div className="stat spot tilt" key={h.label} data-reveal style={{ "--i": i }}>
                  <Counter value={h.value} />
                  <span className="stat__label">{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="desempeno" kicker="02" title="Resumen de desempeño en Dirección de TI">
          <div className="lead-sum spot" data-reveal>
            <p className="lead-sum__intro">{leadership.intro}</p>
            <ul className="lead-sum__list">
              {leadership.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="job__tags">
              <span className="job__taglabel">Alcance:</span>
              {leadership.tags.map((t) => (
                <span key={t} className="chip chip--sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Section>

        <Section id="salud" kicker="03" title="Trayectoria y enfoque para la Dirección de TI en salud">
          <ol className="path" data-reveal>
            {path.map((p, i) => (
              <li key={p.title} className={`path__step${p.target ? " path__step--target" : ""}`} style={{ "--i": i }}>
                <span className="path__years">{p.years}</span>
                <span className="path__dot" aria-hidden="true" />
                <span className="path__stage">{p.stage}</span>
                <strong className="path__title">{p.title}</strong>
                <span className="path__note">{p.note}</span>
              </li>
            ))}
          </ol>

          <p className="focus__lead" data-reveal>
            Cómo aportaría como Director de TI de una clínica: seis frentes de trabajo y un plan para los primeros 90 días.
          </p>
          <div className="focus">
            {healthFocus.map((f, i) => (
              <div className="focus__card spot tilt" key={f.title} data-reveal style={{ "--i": i % 3 }}>
                <span className="focus__num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
          <div className="plan" data-reveal>
            {plan90.map((p) => (
              <div className="plan__item" key={p.range}>
                <span className="plan__range">{p.range}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </Section>

        <Marquee items={competencies.flatMap((c) => c.items).slice(0, 40)} />

        <Section id="competencias" kicker="04" title="Competencias directivas & tecnológicas">
          <div className="skills">
            {competencies.map((c, i) => (
              <div className="skill spot tilt" key={c.area} data-reveal style={{ "--i": i % 4 }}>
                <h3>{c.area}</h3>
                <div className="skill__chips">
                  {c.items.map((it) => (
                    <span key={it} className="chip">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="experiencia" kicker="05" title="Experiencia profesional">
          <div className="timeline">
            {experience.map((job, i) => (
              <Job key={job.company} job={job} index={i} />
            ))}
          </div>
        </Section>

        <Section id="educacion" kicker="06" title="Educación & idiomas">
          <div className="edu">
            <div className="edu__list">
              {education.map((e, i) => (
                <div className="edu__item spot" key={e.school} data-reveal style={{ "--i": i }}>
                  <span className="edu__status">{e.status}</span>
                  <h3>{e.degree}</h3>
                  <p>{e.school}</p>
                </div>
              ))}
              <p className="edu__cont" data-reveal>
                <strong>Formación continua:</strong> {continuous}
              </p>
            </div>
            <div className="langs" data-reveal>
              <h3>Idiomas</h3>
              {languages.map((l) => (
                <div className="lang" key={l.name}>
                  <div className="lang__row">
                    <span>{l.name}</span>
                    <span className="lang__lvl">{l.level}</span>
                  </div>
                  <div className="lang__bar">
                    <span style={{ width: `${l.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="contacto" kicker="07" title="Conversemos">
          <div className="contact" data-reveal>
            <p className="contact__lead">
              Estrategia de negocio, datos y ejecución tecnológica en un mismo lenguaje. Si buscas liderazgo de TI para
              transformar tu organización, hablemos.
            </p>
            <div className="contact__grid">
              <a href={`mailto:${profile.email}`} className="contact__card spot">
                <Icon d={ICONS.mail} />
                <span>Email</span>
                <strong>{profile.email}</strong>
              </a>
              <a href={profile.phoneHref} target="_blank" rel="noreferrer" className="contact__card spot">
                <Icon d={ICONS.phone} />
                <span>Teléfono / WhatsApp</span>
                <strong>{profile.phone}</strong>
              </a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="contact__card spot">
                <Icon d={ICONS.linkedin} />
                <span>LinkedIn</span>
                <strong>/in/jmc-business</strong>
              </a>
              <div className="contact__card spot">
                <Icon d={ICONS.pin} />
                <span>Ubicación</span>
                <strong>{profile.location}</strong>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} James Diaz Lopez</span>
        <span>Construido con React & Three.js</span>
      </footer>
    </>
  );
}

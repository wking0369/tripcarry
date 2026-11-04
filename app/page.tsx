import ApplyForm from './ApplyForm';

const NUMBERS = [
  { value: '~140K', label: 'Instagram followers on @simonsquibb.kr, started from zero in February 2025' },
  { value: '17.94M', label: 'views on the top Reel, with about 240K reactions' },
  { value: '12M', label: 'views in the best month' },
  { value: '~900', label: 'supporters in a KakaoTalk group for the Korean book promotion' },
];

const STEPS = [
  { title: 'Tell me what you want off your plate', text: 'Fill in the form below. We work out by email where I can help most. No video call needed.' },
  { title: 'Run Korea together for one month', text: 'I handle translation, subtitles, captions and posting in your voice. Repeat tasks become AI tools.' },
  { title: 'Decide what happens next', text: 'If it fits, I become your monthly partner. If it doesn’t, we stop there.' },
];

export default function Home() {
  return (
    <main className="site">
      <section className="site-hero">
        <p className="site-who">Hyunwook Park, who runs Simon Squibb’s Korean Instagram</p>
        <h1>Keep making content. I’ll take you to Korea.</h1>
        <a className="site-cta" href="#apply">Apply for the pilot</a>
      </section>

      <section className="site-proof">
        <h2>What it looked like for Simon Squibb</h2>
        <dl>
          {NUMBERS.map((n) => (
            <div key={n.value}>
              <dt>{n.value}</dt>
              <dd>{n.label}</dd>
            </div>
          ))}
        </dl>
        <p className="site-note">Account insights as of November 2, 2026. Simon’s HQ team edits the original videos. I handle the Korean localization and account operations.</p>
      </section>

      <section className="site-steps">
        <h2>One month, US$500</h2>
        <ol>
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="site-note">I’m taking two creators for now. Selling your products is not included.</p>
      </section>

      <section className="site-apply" id="apply">
        <div>
          <h2>Tell me about your account</h2>
          <p>I’ll reply by email. Based in Beijing, working in Korean, English and Chinese.</p>
        </div>
        <ApplyForm />
      </section>

      <footer className="site-foot">
        <a href="mailto:wking0369@gmail.com">wking0369@gmail.com</a>
      </footer>
    </main>
  );
}

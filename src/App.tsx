import './App.css'

// ── Hex background ──────────────────────────────────────────────────────────
const HEX_SIZE = 50
const HEX_W = HEX_SIZE * Math.sqrt(3)
const HEX_H = HEX_SIZE * 2
const VB_W = 2200
const VB_H = 1400
const COLS = Math.ceil(VB_W / HEX_W) + 2
const ROWS = Math.ceil(VB_H / (HEX_H * 0.75)) + 2

function hexPoints(cx: number, cy: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${(cx + HEX_SIZE * Math.cos(angle)).toFixed(1)},${(cy + HEX_SIZE * Math.sin(angle)).toFixed(1)}`
  }).join(' ')
}

const HEX_GRID = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS
  const row = Math.floor(i / COLS)
  return {
    id: `h${col}-${row}`,
    points: hexPoints(col * HEX_W + (row % 2 ? HEX_W / 2 : 0), row * HEX_H * 0.75),
    delay: `${(Math.random() * 12).toFixed(1)}s`,
    duration: `${(6 + Math.random() * 8).toFixed(1)}s`,
    gold: Math.random() < 0.04,
  }
})

function HexBackground() {
  return (
    <svg
      className="hex-bg"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {HEX_GRID.map((cell) => (
        <polygon
          key={cell.id}
          points={cell.points}
          className={`hex-cell${cell.gold ? ' hex-cell--gold' : ''}`}
          style={{ animationDelay: cell.delay, animationDuration: cell.duration }}
        />
      ))}
    </svg>
  )
}

const LINKS = {
  ios: 'https://apps.apple.com/us/app/habit-beast-monster-trainer/id6760268226',
  android: 'https://play.google.com/store/apps/details?id=com.socialsin.habitbeast',
  androidTesting: 'https://play.google.com/apps/testing/com.socialsin.habitbeast',
  betaCommunity: 'https://groups.google.com/g/habit-beast-beta-testers',
  discord: 'https://discord.gg/4mQYnGkYw',
}

const SCREENSHOTS = [
  { src: '/v3o1o0.png', alt: 'Character stats and habit dashboard' },
  { src: '/playStoreMonsterRecord.png', alt: 'Habit history and progress tracking' },
  { src: '/playStoreLeaderboardScreen.png', alt: 'Leaderboard competition' },
]

const FEATURES = [
  {
    label: 'You Are the Doctor',
    title: 'Train Your Monster',
    description:
      'Pick one of six lovably out-of-shape creatures — then name it, dress it, and drag it into shape through daily habits. Your monster is hopeless without you.',
  },
  {
    label: 'Arsenal',
    title: 'Habits Earn Battle Moves',
    description:
      'Every completed habit drops a combat move into your arsenal. Build a loadout from 242 possible moves and challenge rivals. Lose a ranked battle and those moves are consumed — go earn them back.',
  },
  {
    label: '50+ Habits',
    title: 'Six Stats. Real Stakes.',
    description:
      'Train across Exercise, Health, Clean, Community, Creativity, and Mental. Over 50 habits with five tier levels each — harder tiers unlock more powerful combat moves.',
  },
]

export default function App() {
  return (
    <div className="app">
      <HexBackground />
      <header className="site-header">
        <span className="company-name">Social Sin LLC</span>
        <nav className="header-nav" aria-label="Download links">
          <a href={LINKS.ios} className="header-link" target="_blank" rel="noopener noreferrer">
            <AppleIcon size={14} />
            <span>App Store</span>
          </a>
          <a href={LINKS.android} className="header-link" target="_blank" rel="noopener noreferrer">
            <AndroidIcon size={14} />
            <span>Google Play</span>
          </a>
          <a href={LINKS.discord} className="header-link header-link--discord" target="_blank" rel="noopener noreferrer">
            <DiscordIcon size={14} />
            <span>Discord</span>
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <p className="hero-eyebrow">Available Now</p>
          <h1 className="game-title">
            HABIT
            <br />
            BEAST
          </h1>
          <p className="tagline">Doctor! Train the monster. Challenge your rivals.</p>
          <div className="hero-cta">
            <a
              href={LINKS.ios}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AppleIcon />
              Download on iOS
            </a>
            <a
              href={LINKS.android}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AndroidIcon />
              Google Play
            </a>
          </div>
        </div>
      </section>

      <section className="screenshots-section">
        <div className="screenshots">
          {SCREENSHOTS.map((s, i) => (
            <div
              key={s.src}
              className={`screenshot-frame${i === 1 ? ' screenshot-frame--center' : ''}`}
            >
              <img src={s.src} alt={s.alt} loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </section>

      <section className="lab-quote-section">
        <div className="lab-quote-card">
          <span className="lab-card-label">LAB NOTES</span>
          <img src="/lab-assistant.png" alt="Lab Assistant" className="lab-assistant-img" loading="lazy" decoding="async" />
          <blockquote className="lab-quote-text">
            <p>
              "Vizout your daily work, ze monster languishes, dahling&hellip; and your rivals? Zey do
              not rest. Ve cannot have zis!"
            </p>
          </blockquote>
        </div>
      </section>

      <section className="features-section">
        <div className="features-inner">
          {FEATURES.map((f) => (
            <div key={f.label} className="feature-card">
              <span className="feature-label">{f.label}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="download-section">
        <h2 className="section-title">Get the Game</h2>
        <p className="section-sub">
          Habit Beast is still being actively developed. Join the community and help shape the game.
        </p>
        <div className="download-cards">
          <div className="dl-card">
            <div className="dl-card-icon">
              <AppleIcon size={32} />
            </div>
            <h3>iOS</h3>
            <a
              href={LINKS.ios}
              className="btn btn-primary full"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download on the App Store
            </a>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">
              <AndroidIcon size={32} />
            </div>
            <h3>Android</h3>
            <a
              href={LINKS.android}
              className="btn btn-primary full"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get on Google Play
            </a>
            <a
              href={LINKS.androidTesting}
              className="btn btn-outline full"
              target="_blank"
              rel="noopener noreferrer"
            >
              Become a Beta Tester
            </a>
            <a
              href={LINKS.betaCommunity}
              className="btn btn-ghost full"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Beta Community
            </a>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">
              <DiscordIcon size={32} />
            </div>
            <h3>Community</h3>
            <a
              href={LINKS.discord}
              className="btn btn-primary full"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our Discord
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Social Sin LLC. All rights reserved.</p>
        <a
          href="https://mschneider247.github.io/socialsinllc-habitbeast/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>
      </footer>
    </div>
  )
}

function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function AndroidIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341c-.551 0-.999-.449-.999-1s.448-.999.999-.999c.551 0 .999.448.999.999s-.448 1-.999 1m-11.046 0c-.551 0-.999-.449-.999-1s.448-.999.999-.999c.551 0 .999.448.999.999s-.448 1-.999 1m11.405-6.02l1.997-3.459a.416.416 0 0 0-.152-.568.416.416 0 0 0-.568.152l-2.022 3.503C15.59 8.244 13.853 7.851 12 7.851s-3.59.393-5.137 1.099L4.841 5.447a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.568l1.997 3.459C3.655 10.568 2.335 12.547 2 14.891h20c-.335-2.344-1.655-4.323-4.118-5.57" />
    </svg>
  )
}

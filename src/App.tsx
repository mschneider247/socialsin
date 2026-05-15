import './App.css'

const LINKS = {
  ios: 'https://apps.apple.com/us/app/habit-beast-monster-trainer/id6760268226',
  android: 'https://play.google.com/store/apps/details?id=com.socialsin.habitbeast',
  androidTesting: 'https://play.google.com/apps/testing/com.socialsin.habitbeast',
  betaCommunity: 'https://groups.google.com/g/habit-beast-beta-testers',
}

const SCREENSHOTS = [
  { src: '/v3o1o0.png', alt: 'Character stats and habit dashboard' },
  { src: '/playStoreMonsterRecord.png', alt: 'Habit history and progress tracking' },
  { src: '/playStoreLeaderboardScreen.png', alt: 'Leaderboard competition' },
]

const FEATURES = [
  {
    label: 'RPG',
    title: 'Level Up Your Beast',
    description:
      'Every habit you build earns XP across six stat categories — Exercise, Health, Clean, Community, Creativity, and Mental. Watch your character evolve as you grow.',
  },
  {
    label: 'Streaks',
    title: 'Chase Your Streaks',
    description:
      'Daily streaks fuel your character\'s power. Stay consistent, rack up days, and climb habit-specific leaderboards against friends and rivals.',
  },
  {
    label: 'Insights',
    title: 'Track Everything',
    description:
      'Log meals and macros, monitor weight trends, and visualize months of habit completions at a glance. Real data for real progress.',
  },
]

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <span className="company-name">Social Sin LLC</span>
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
          <p className="tagline">Build real habits. Level up your life.</p>
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
              <img src={s.src} alt={s.alt} />
            </div>
          ))}
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
          Habit Beast is in beta. Join the community and help shape the game.
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
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Social Sin LLC. All rights reserved.</p>
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

function AndroidIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341c-.551 0-.999-.449-.999-1s.448-.999.999-.999c.551 0 .999.448.999.999s-.448 1-.999 1m-11.046 0c-.551 0-.999-.449-.999-1s.448-.999.999-.999c.551 0 .999.448.999.999s-.448 1-.999 1m11.405-6.02l1.997-3.459a.416.416 0 0 0-.152-.568.416.416 0 0 0-.568.152l-2.022 3.503C15.59 8.244 13.853 7.851 12 7.851s-3.59.393-5.137 1.099L4.841 5.447a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.568l1.997 3.459C3.655 10.568 2.335 12.547 2 14.891h20c-.335-2.344-1.655-4.323-4.118-5.57" />
    </svg>
  )
}

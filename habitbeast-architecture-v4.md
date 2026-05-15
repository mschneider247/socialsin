# HabitBeast — Technical Architecture

**Version:** 8.0 (File: `habitbeast-architecture-v4.md` — filename preserved for link compatibility)
**Updated:** May 2026
**Author:** Michael / Social Sin LLC
**App Version:** 2.9.2 — Live on Android & iOS (internal testing)
**Subscription status:** ✅ SHIPPED in v2.9.2 — RevenueCat fully integrated, both platforms configured, webhook live, all existing users grandfathered as Founders
**Next milestone:** v3.0.0 — Public freemium launch

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Philosophy & Tone](#design-philosophy--tone)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Battle System](#battle-system)
6. [Social System](#social-system)
7. [Data Architecture](#data-architecture)
8. [Backend Cloud Functions](#backend-cloud-functions)
9. [Security Rules](#security-rules)
10. [User Flows](#user-flows)
11. [UI/UX Design](#uiux-design)
12. [Battle Configuration](#battle-configuration)
13. [Monetization](#monetization)
14. [Freemium Architecture — v3.0.0](#freemium-architecture--v300)
15. [Security Audit — v3.0.0 Prerequisites](#security-audit--v300-prerequisites)
16. [iOS Build — Xcode 26 + Firebase 12.8.0 Compatibility Fixes](#ios-build--xcode-26--firebase-1280-compatibility-fixes)
17. [v3.0 Release Readiness — Pre-Launch Audit](#v30-release-readiness--pre-launch-audit-april-2026)
18. [Roadmap](#roadmap)
19. [Store Submission Checklist](#store-submission-checklist)
20. [Habit Quick Completion Streamlining](#habit-quick-completion-streamlining)
21. [Wear OS Integration — Phase W-1](#wear-os-integration--phase-w-1)
22. [watchOS Integration — Phase W-2](#watchos-integration--phase-w-2)

---

## Executive Summary

HabitBeast is a **competitive habit-tracking mobile game** where players are mad scientists training monsters through daily habits. Monsters battle each other using **battleActions** earned from habit completion, creating a unique blend of personal development and strategic PvP combat.

**Core loop:** Complete habits → earn battle moves → build a loadout → challenge opponents → win or rebuild.

**Stakes:** Ranked battles consume your battle moves when you lose. You have to complete more habits to rebuild your arsenal. Friendly battles are free practice.

---

## Design Philosophy & Tone

> **Required reading for any developer or AI contributor.** Every feature, every copy line, every UX decision must pass through these principles.

### This Is a Game, Not a Productivity App

HabitBeast lives and breathes as a **game first**. When in doubt: *does this feel like a game, or does it feel like a spreadsheet?* If a feature could ship in a generic wellness app unchanged, it needs another pass.

### The Monster's Perspective

The player is **"Doctor"** — a mad scientist. The monster is theirs — they named it. All copy should give agency to the monster:

- Tier names reference the monster directly: `"Brush {{monsterName}}'s face bones!"`
- Progress belongs to the monster, not the player: `"{{monsterName}} enters ze flow state!"` — not "You started writing"
- Monster = protagonist; Doctor = enabler

### The Lab Assistant Voice

Habit descriptions and instructional copy are narrated by a **wise, old Eastern European female lab assistant** — authoritative but warm, slightly dramatic, with a heavy accent rendered phonetically.

**Phonetic conventions:**
- "Ze" / "Zis" / "Zere" / "Zen" (The / This / There / Then → Z)
- "Vater" / "Vind" / "Valk" (W → V for Germanic flavor)
- "Dahling" as a term of endearment
- Occasional dramatic ellipsis: `"...it is a disgrace!"`

**Example:**
> "Vizout vater, ze {{monsterName}} becomes very... crunchy. Ve cannot have zis! Hydration is ze top priority, dahling!"

### Monster Design Language

The 6 base monsters are **lovably out-of-shape creatures who desperately need help**. The humor comes from their incompetence, not their menace.

| Monster | Species | Personality |
|---------|---------|-------------|
| Franky | Fat lazy Frankenstein | Barely moves, loves naps |
| Howler | Pudgy werewolf | Huffs walking up stairs |
| Wrapps | Skinny mummy | Forgets to eat, falls apart |
| Stumbles | Clumsy zombie | Trips over everything |
| Murk | Couch-potato swamp creature | Smells like a lake |
| Iggy | Sleepy one-eyed cyclops | Cannot stay awake |

Monster species names (Franky, Howler, etc.) are **labels only**. Players choose their own name during onboarding. Copy uses `{{monsterName}}` (their chosen name) everywhere.

### Template Token System

Tier names and habit descriptions use `{{monsterName}}` as a placeholder, substituted at render time:

```typescript
import { formatHabitText } from 'src/utils/habitNames.ts';
formatHabitText("Brush {{monsterName}}'s face bones!", user.monster.name)
// → "Brush Grimdalf's face bones!"
```

### Copy Style Guide

| Context | Style | Example |
|---------|-------|---------|
| Tier names | Dynamic, monster-centric, dramatic | `"{{monsterName}}'s core of iron!"` |
| Habit descriptions | Lab assistant narration, character voice | `"Ze plank does not lie, dahling!"` |
| UI headers | Terse game-speak, ALL CAPS | `"TIER PROGRESSION"`, `"BATTLE TRAINING"` |
| Points/stats | Terse and numeric | `"+2 pts"`, `"Tier 3"` |
| Battle copy | Dramatic, combat-flavored | Punchy, evocative, short |

### What to Avoid

- **Productivity app language:** "Track your habits," "Build consistency," "Stay on target"
- **Generic wellness tone:** "Great job!", "You're doing amazing!", "Keep it up!"
- **Boring tier names:** If a tier name could belong in a fitness app unchanged, rewrite it.

---

## Technology Stack

### Frontend
- **Framework:** React Native 0.83.1 (iOS & Android)
- **Language:** TypeScript
- **Navigation:** `@react-navigation/stack` for all navigators; `NativeStackNavigationProp` for typing
- **State:** React Context (`AuthContext`) for auth/user; local `useState`/`useEffect` + custom hooks for Firestore subscriptions
- **Storage:** AsyncStorage for local preferences (e.g., circle style, unit preference)
- **Path aliases:** `@components/*`, `@screens/*`, `@services/*`, `@utils/*`, `@types`, `@constants/*`, `@assets/*`
- **GPU rendering:** `@shopify/react-native-skia` v2.5.3 — GPU-accelerated 2D canvas; used exclusively for particle effects (no CSS/RN animations). Requires `react-native-reanimated` (already installed); does NOT need `@shopify/react-native-worklets-core` in v2.x.

### Backend
- **Platform:** Firebase (project: `habitbeast-3f09d`)
  - **Auth:** Firebase Auth (email/password)
  - **Database:** Firestore (real-time NoSQL)
  - **Cloud Functions:** Firebase Cloud Functions v2 (TypeScript) — `functions/src/`
  - **Analytics:** Firebase Analytics
- **Android package:** `com.socialsin.habitbeast`

### Key Files
| Area | File |
|------|------|
| Types | `src/types/index.ts` |
| Auth | `src/services/auth/AuthService.ts`, `src/contexts/AuthContext.tsx` |
| Habits | `src/services/habits/HabitService.ts` |
| Macros | `src/services/macro/MacroService.ts` |
| Food | `src/services/food/FoodService.ts` |
| Battle | `src/services/battle/BattleService.ts` |
| User | `src/services/user/UserService.ts` |
| Monsters | `src/constants/monsters.ts` (`MONSTERS`, `MONSTER_IMAGES`, `getMonsterImage`) |
| Leveling | `src/constants/leveling.ts` (XP curve config + helpers) |
| Habit catalog | `src/constants/habitCatalog.ts` |
| Battle actions | `src/constants/battleActions.ts` (`BATTLE_ACTIONS`, `ACTION_ID_TO_NUMBER`) |
| Theme | `src/constants/theme.ts` (`COLORS`, `FONT_SIZES`, `SPACING`, `RADIUS`, `BATTLE_COLORS`) |
| Cloud functions | `functions/src/index.ts`, `functions/src/battleEngine.ts`, `functions/src/notifications.ts` |
| Auto-monsters | `src/constants/autoMonsters.ts` (client config), `functions/src/autoMonsterService.ts` (CF helpers) |
| Navigation ref | `src/navigation/navigationRef.ts` (global ref for CF-triggered navigation from notification taps) |
| Profile navigator | `src/navigation/ProfileNavigator.tsx` (stack: ProfileMain → MonsterRecord) |
| Sleep overlay | `src/components/common/SleepModeOverlay.tsx` (wired into `RootNavigator` at `AuthenticatedAppShell` level) |
| Rivals hook | `src/hooks/useTopLeaderboardStats.ts` — streak-ranked top 2 habits + leaderboard rivals |
| Weekly macros hook | `src/hooks/useWeeklyMacroLogs.ts` — weekly macro log subscription |
| Weekly insights | `src/screens/food/WeeklyInsightsScreen.tsx` — weekly macro/food trends |
| Notification banner | `src/components/notifications/NotificationBanner.tsx` (animated slide-in, steampunk styled, auto-dismisses 4s) |
| Error boundary | `src/components/common/ErrorBoundary.tsx` |
| Lab assistant bubble | `src/components/common/LabAssistantBubble.tsx` |
| Quick food log | `src/components/food/QuickFoodLogModal.tsx` |
| Profile | `src/screens/profile/ProfileScreen.tsx`, `src/screens/profile/ClosetScreen.tsx`, `src/screens/profile/MonsterRecordScreen.tsx` |
| Heatmap component | `src/components/game/HabitHeatmap.tsx` (`HabitHeatmap`, `HeatmapEntry` — 52×7 GitHub-style grid, tier-based opacity, tap-to-inspect tooltip) |
| Haptics utility | `src/utils/haptics.ts` — centralised haptic patterns: `tap` (light, chip selection), `pulse` (medium, timer/button), `success` (double burst, habit complete), `levelUp` (triple burst, level-up), `warning` (destructive actions). All `ReactNativeHapticFeedback` calls go through here. |
| Habit timer | `src/components/game/HabitTimer.tsx` — in-modal stopwatch for timed habits. Uses `offsetRef + startTimestampRef + Date.now()` anchoring for accurate elapsed time through background. `AppState` listener recalculates on app resume. Shows START → STOP → "USE X min/sec" flow. |
| Brain swap modal | `src/components/profile/MonsterBrainSwapModal.tsx` — allows switching the active monster species while preserving name, level, clothing, and all progress. 2×3 species grid; lab assistant voice; confirms via Alert before calling `UserService.switchMonsterAvatar()`. |
| Battle screens | `src/screens/battle/BattleChallengeScreen.tsx`, `src/screens/battle/BattlePrepScreen.tsx`, `src/screens/battle/BattleResultScreen.tsx`, `src/screens/battle/BattleReplayScreen.tsx` |
| Leaderboard | `src/screens/leaderboard/LeaderboardScreen.tsx` |
| Create custom habit | `src/screens/habits/CreateCustomHabitScreen.tsx` |
| Seed scripts | `functions/src/seedFirestore.ts` (initial seed), `functions/src/seedBattleConfig.ts` (one-time) |
| Seed data | `seed-data/` (battleConfig.json, habitCatalog.json, battleActions.json, initialFoods.json) |

### Hooks
| Hook | Purpose |
|------|---------|
| `useHabits` | Real-time active habits + today's completion logs. Always call as `useHabits(user?.userId)`. |
| `useDailyMacros` | Real-time today's macro totals |
| `useTodayFoodLogs` | Real-time food logs by meal; also returns `todayWeightEntry: MacroLog \| null` |
| `useRecentFoods` | Last N unique foods logged by user |
| `useCircleStyle` | AsyncStorage pref for circle style (`'steam'` / `'chem'`); broadcasts changes to all mounted screens |
| `useTheme` | Returns active color palette (`COLORS` or `COLORS_CHEM`) based on circle style; cast as `typeof COLORS` to avoid TS literal-type mismatches |
| `useUnitPreference` | AsyncStorage pref for `'standard'` / `'metric'`; same broadcast pattern as `useCircleStyle` |
| `useActiveChallenges` | Real-time active battle challenges (`pending` / `ready_both`); filters client-side for stale expired docs |
| `useSleepStatus` | Reads night_routine habit settings, returns `{ isAsleep }` — re-checks every 60s |
| `useNotifications` | Requests FCM permission, saves token, shows in-app banner on foreground messages, routes taps to correct screen |
| `useTopLeaderboardStats` | Scores user's active habits by current streak; picks top 2 (preferring different habits); fetches leaderboard rivals for each. Only active when `leaderboardOptIn=true`. Filters out custom habits. Returns `TopStatEntry[]` with rival monster name, id, parts, rank, and streak value. |
| `useWeeklyMacroLogs` | Real-time weekly macro log data for insights screen |

---

## Core Features

### 1. Auth & Onboarding

1. Email/password registration
2. Select base monster (2-column grid, 6 types)
3. Name your monster (2–20 characters, required)
4. Username is hardcoded to **"Doctor"** for all users (story element — no input)
5. Set daily reset time (vertical spinner, stored as UTC, e.g. `"07:00"`)
6. Select initial habits (max 4 at start)

**Auth flow:** `RootNavigator` conditionally renders `AuthNavigator` → `OnboardingNavigator` → `MainNavigator` based on `user` and `user.onboardingComplete`.

### 2. Habit System

#### Structure

Each habit in the catalog defines:

```typescript
interface HabitDefinition {
  habitType: string;
  name: string;
  category: HabitCategory; // 'exercise' | 'generalHealth' | 'cleanliness' | 'community' | 'creativity' | 'mentalHealth'
  description: string;
  inputType: 'boolean' | 'duration' | 'reps' | 'distance' | 'volume' | 'pages' | 'exercises';
  unit: string; // 'seconds', 'minutes', 'oz', 'reps', 'miles', 'pages', etc.
  tiers: HabitTier[];
}

interface HabitTier {
  tierLevel: number; // 1–5
  name: string;
  pointsAwarded: number; // 1, 2, 3, 5, 8
  battleActionGranted: string; // actionId (string)
  unlockRequirements: {
    userLevel: number;
    completionCount: number;
    minValue: number; // 0 = any positive value accepted
    otherHabits?: {
      tierLevel: number;
      matchMode: 'category' | 'specific';
      categories?: HabitCategory[];
      habitTypes?: string[];
    } | null;
  };
}
```

- **Non-boolean habits** require a recorded value on each completion. Values are validated against `minValue`. Exception: `'exercises'` input type is treated like `'boolean'` for validation; exercise data is stored in `HabitLog.metrics`.
- **Cross-habit prerequisites:** `otherHabits` enforces natural skill progression. Checked in `HabitService.unlockNextTier()`.

#### Habit Catalog

| Habit | Category | Input | T1 action | T2 action | T3+ |
|-------|----------|-------|-----------|-----------|-----|
| Meals | generalHealth | boolean | morning_energy | snack_power | midday_surge (T3), full_feast (T4); all 5 meals (BREAKFAST/ELEVENSES/LUNCH/AFTERNOON TEA/DINNER) at every tier |
| Water | generalHealth | volume (oz) | spit_water (64oz) | shoot_water (72oz) | water_laser T3, water_bazooka T4 (128oz/1gal), water_death_cannon T5 (160oz; requires exercise T4+) |
| Cold Shower | generalHealth | duration (s) | chill_touch | cold_snap (60s) | arctic_blast T3 (90s), absolute_zero T4 (120s) |
| Sauna | generalHealth | duration (min) | steam_burst | heat_wave (20min) | scalding_rush T3 (30min), volcanic_surge T4 (45min); DoT actions |
| Avoidance | generalHealth | boolean (user-named) | — | — | User names it (`rawName`, display = "No {rawName}"). Modes: `daily` or `tally` (first tap earns point; subsequent taps = free personal tracking). |
| Music | creativity | duration (min) | — | — | 4 tiers (15/30/45/60 min) |
| Planks | exercise | duration (s) | steady_stance | core_strike (120s) | fortress_core T3 (180s), iron_core T4 (240s) |
| Walking | exercise | duration/distance/steps | quick_jab | steady_march (20min) | relentless_march T3 |
| Running | exercise | duration/distance | speed_dash | speed_blitz (20min) | sprint_fury T3, marathon_drive T4 |
| Teeth | cleanliness | boolean | clean_slate | polished_guard | triple_cleanse T3, pristine_fortress T4 |
| Social Presence (`social_post`) | community | reps (posts) | social_spark | viral_wave (3 posts) | featured_reel T3 (requires any non-community T1+) |
| Writing | creativity | duration (min) | creative_spark | focused_mind (20min) | masterstroke T3 (30min) |
| Dead Hang | exercise | duration (s) | hanging_grip | iron_grip (60s) | apex_grip T3 (90s) |
| Stretching | exercise | duration (min) | flex_wave | limber_strike | serpent_flow T3 |
| Night Time Routine | cleanliness | boolean | rest_protocol | sleep_debt T2 (debuff) | nightmare_protocol T3 |
| Drawing / Art | creativity | boolean | creative_burst | inspired_strike T2 | the_masterpiece T3 |
| Call Family | community | boolean | support_network | family_bond T2 | ancestral_strength T3 |
| Biking | exercise | duration/distance | pedal_push | cycle_surge | iron_wheels T3 (shieldPiercing, bonus action) |
| Reading | creativity | duration (min) | page_turn (bonus action) | deep_lore (20min) | book_mastery T3 (30min, skips opponent turn) |
| Gym Rat | exercise | exercises | iron_will (bonus action) | muscle_surge (combos with iron_will) | beast_mode T3 (debuff), legendary_pump T4 (heal + bonus) |
| Meditation | mentalHealth | duration (min) | — | — | 4 tiers |
| Gardening | mentalHealth | duration/boolean | — | — | — |
| Time w/ Pets | mentalHealth | duration/boolean | — | — | — |
| Tinkering | mentalHealth | duration (min) | — | — | — |

**Phase H-1 Additions (26 new habits):** `W` = weekly frequency

| Habit | Category | Freq | Input |
|-------|----------|------|-------|
| Make Bed (`make_bed`) | cleanliness | daily | boolean |
| Clean Space (`clean_space`) | cleanliness | W | reps (rooms) |
| Dishes (`dishes`) | cleanliness | W | boolean |
| Laundry (`laundry`) | cleanliness | W | boolean |
| Trash (`trash`) | cleanliness | daily | boolean |
| Yard Work (`yard_work`) | cleanliness | W | duration (min) |
| Declutter (`declutter`) | cleanliness | W | boolean |
| Text a Friend (`text_friend`) | community | daily | boolean |
| Leave a Review (`leave_review`) | community | daily | boolean |
| Help Someone (`help_someone`) | community | daily | boolean |
| Show Up (`show_up`) | community | W | boolean |
| Date Night (`date_night`) | community | W | boolean |
| Cook for Others (`cook_others`) | community | daily | boolean |
| Tai Chi (`tai_chi`) | generalHealth | daily | duration (min) |
| Vitamins (`vitamins`) | generalHealth | daily | boolean |
| Outdoor Time (`outdoor_time`) | generalHealth | daily | duration (min) |
| Yoga (`yoga`) | exercise | daily | duration (min) |
| Jump Rope (`jump_rope`) | exercise | daily | duration (min) |
| Swimming (`swimming`) | exercise | W | duration (min) |
| Hiking (`hiking`) | exercise | W | duration (min) |
| Gratitude (`gratitude`) | mentalHealth | daily | boolean |
| Therapy (`therapy`) | mentalHealth | W | boolean |
| Photography (`photography`) | creativity | daily | boolean |
| Journaling (`journaling`) | creativity | daily | duration (min) |
| Learn a Language (`learn_language`) | creativity | daily | duration (min) |
| Meal Prep (`meal_prep`) | creativity | daily | duration (min) |

#### Habit Limits

```
Level 0–4:   max 4 active habits
Level 5–9:   max 6 active habits
Level 10–14: max 15 active habits
Level 15–19: max 20 active habits
Level 20+:   max 25 active habits
```

#### Habit Priority System

Users rank habits 1–10+. Higher priority habits contribute more to combat stats:
- Rank 1: 1.5× stat contribution
- Rank 2: 1.3×
- Rank 3: 1.2×
- Rank 4–10: 1.1× (Level 10+ only)
- Rank 11+: 1.0× (no bonus)

#### Habit-Specific Settings

Some habits store extra configuration in `UserHabit.settings`:

| Habit | Setting keys | Notes |
|-------|-------------|-------|
| water | `servingSize`, `servingUnit`, `dailyGoal` | Serving default 8oz; daily goal default 64oz — editable in HabitDetailScreen → WATER GOALS card |
| meals | `displayMode`, `weightTracking` | `displayMode`: `'macros'` / `'favorites'` / `'simple'`. `weightTracking: true` = Scientific mode (TDEE, calorie range, morning weight entry). |
| walking / running | `trackingMode` | `'duration' \| 'distance' \| 'steps' \| 'all'` |
| night_routine | `sleepStartHour` (0–23), `sleepDurationHours` (1–12) | Drives app-wide sleep mode UI |
| reading | `completedBooks` (array of `{title, completedAt}`), `currentBook` (string) | Book title pre-populates on subsequent sessions; finished books shown in BOOKSHELF card |
| gym_rat | `restDaysPerWeek` (0–4) | Rest day count derived from `habitLogs.metrics.isRestDay` queries. Exercises stored as `{name, sets: [{reps, weight}]}[]` in `metrics.exercises`. |
| social_presence | — | Completion stores `metrics.platformPosts: [{platform, count}]`. Platforms (order in UI): Instagram, TikTok, YouTube, X, Reddit, LinkedIn, Facebook, Threads, Bluesky, Farcaster, Substack, Twitch, Pinterest, Medium. |
| avoidance | `avoidanceName`, `mode` (`'daily' \| 'tally'`) | `rawName` stored; display = `"No {rawName}"` (fallback: "Avoid Zis"). |

**Biking tracking:** Mode (Time / Distance / All) is chosen per session in the completion modal — `trackingMode` is **not** persisted to `settings`.

**Night Time Routine — Sleep Mode:** When `night_routine` is active and the current local time falls within the configured sleep window, the app enters sleep mode: a semi-transparent grey overlay desaturates all screens and a rotating lab-assistant banner appears. The overlay is `pointerEvents: 'none'` — all interaction remains normal. Implemented via `useSleepStatus` hook + `SleepModeOverlay` component at the `AuthenticatedAppShell` level.

**Meals — Scientific Mode:** When `mealsHabit.settings.weightTracking === true`, the meals habit collects a `BodyProfile` (age, height in cm, weight in lbs, goal weight, activity level) and computes a TDEE-based calorie range via Mifflin-St Jeor. Morning weight is logged inline in `HabitQuickCompleteModal` as a `MacroLog` with `isWeightEntry: true`. A weight sparkline is shown on `MonsterRecordScreen`.

#### Custom Habits (Doctor's Lab)

- `isCustom: boolean` on `UserHabit`; `habitType: 'custom_{habitId}'`; `customDefinition: CustomHabitDefinition` stored inline
- `buildDefinitionFromCustomHabit()` synthesizes `HabitDefinition` at runtime
- Custom limit = `max(1, floor(habitLimit/4))`
- Leaderboard uses `'__custom__'` sentinel per category
- LAB_COLOR = `'#8B5CF6'` across all custom habit UI

**Weekly Custom Habits:** `CustomHabitDefinition.frequency?: 'daily' | 'weekly'`. When `frequency === 'weekly'`:
- `createCustomHabit()` sets `scheduledDays` on `UserHabit` (exactly 1 day, chosen in creation UI)
- `buildDefinitionFromCustomHabit()` uses `CUSTOM_BATTLE_ACTIONS_WEEKLY` (actions #213–#242) instead of `CUSTOM_BATTLE_ACTIONS` (#48–#72, #90–#94), and sets `frequency: 'weekly'` + `weeklyConfig: {defaultDaysPerWeek: 1}` on the synthesized `HabitDefinition`
- Points per tier for weekly: [2, 3, 4, 6, 10] vs daily [1, 2, 3, 5, 8]
- TRAINING SCHEDULE card in `HabitDetailScreen` already handles weekly custom habits (reads `habit.scheduledDays`, defaults `maxDays: 1` when no `catalogEntry`)
- `CreateCustomHabitScreen` has a DAILY / WEEKLY toggle + `WeeklyDayPicker` shown when weekly selected; `mentalHealth` category also added to the category picker

#### Completion Reset

Habits use an **`isCompleted: boolean`** field on `UserHabit`. `HabitService.completeHabit()` sets it to `true`. The `processHabitResets` cloud function runs hourly and resets `isCompleted` to `false` for each user whose `dailyResetTime` (UTC hour) matches the current hour. UI reads this flag directly — no date-based log queries for completion state.

**Habit change cooldown:** `lastHabitChangeDate?: string` on User (ISO date). `HabitService.deactivateHabit` and `deleteHabit` check + set it — max 1 deactivate/delete per 24h. Error message starts with `'COOLDOWN:'` prefix so UI can distinguish.

**addHabitFromDefinition reactivation:** Calls `reactivateHabit()` if existing habit is inactive (fixes silent no-op when re-adding a deactivated habit).

**Pause (formerly Deactivate):** All user-facing strings say "Pause" / "PAUSE ZE HABIT?" — internal method names (`deactivateHabit`, `reactivateHabit`) unchanged.

**Habit progress reset:** `HabitService.resetHabit(userId, habitId)` — wipes `currentTier`, `tierProgress`, `currentStreak`, `longestStreak`, `lastCompletedDate`, and `isCompleted` but keeps all `habitLogs`. Freely repeatable (no cooldown). Accessible via a "RESET PROGRESS" button on `HabitDetailScreen`. Confirmation Alert uses lab-assistant voice.

**Quick-select chips:** `HabitQuickCompleteModal` shows 3 value chips for numeric habits. `HabitService.getRecentCompletionValues(userId, habitId, count)` queries `habitLogs` ordered by `completedAt` desc and deduplicates values. Chips merge up to 3 history values (newest-first) with `DEFAULT_QUICK_VALUES` fallbacks — always produces exactly 3 chips. Tapping a chip calls `haptics.tap()` and sets the input value. Timer-type habits also show an inline `HabitTimer` component.

**Streak reminder notifications:** `UserHabit.lastReminderSentDate?: string` tracks the last date a reminder was sent per habit. The `checkhabitreminders` Cloud Function (hourly) fires at `(resetHour + 6) % 24` UTC per user, finds active habits with `lastCompletedDate` ≥ 2 days ago, skips same-day sends, and dispatches a 2-day or 5-day escalation FCM push. Batch-writes `lastReminderSentDate` to all reminded habits.

### 3. Leveling & Points

**Points per tier completion:** Tier 1 = 1pt, T2 = 2pt, T3 = 3pt, T4 = 5pt, T5 = 8pt

Points are awarded **client-side** in `HabitService.completeHabit()` for immediate feedback.

**Level progression (compound growth, configured in `src/constants/leveling.ts`):**

```typescript
LEVELING_CONFIG = {
  baseXP: 5,
  tiers: [
    { maxLevel: 10, growthRate: 0.50 },
    { maxLevel: 20, growthRate: 0.25 },
    { maxLevel: 30, growthRate: 0.15 },
    { maxLevel: Infinity, growthRate: 0.05 },
  ]
}
```

| Level | XP for Level | Cumulative |
|-------|-------------|------------|
| 1 | 5 | 5 |
| 5 | 27 | 70 |
| 10 | 210 | 616 |
| 20 | 1,963 | 9,374 |
| 30 | 7,941 | 55,204 |

**Helpers:** `xpRequiredForLevel(level)`, `cumulativeXPForLevel(level)`, `getLevelProgress(cumulativePoints)` in `src/constants/leveling.ts`.

### 4. Monster Avatar System

8 base monsters (PNG assets in `src/assets/monsters/`): Franky (1), Howler (2), Wrapps (3), Stumbles (4), Murk (5), Iggy (6), Biggs (7), Entsy (8). Layered clothing system with a flexible slot map stored in Firestore under `monster.parts`. Base monster PNGs contain **no mouth** — mouths are a separate layer driven by gameplay state.

```typescript
// ClothingSlot is the source of truth — add new slots here as the game grows
type ClothingSlot = 'hat' | 'body' | 'gloves' | 'pants' | 'shoes' | 'bottom';

type MouthExpression = 'excited' | 'happy' | 'okay' | 'sad' | 'upset';

interface MonsterAvatar {
  monsterId: string;
  name?: string;
  parts: Partial<Record<ClothingSlot, string | null>>; // new slots write dynamically; no migration needed
  lastUpdated: Timestamp;
  thumbnailUrl?: string;        // Firebase Storage URL for rendered portrait snapshot
  mouthExpression?: MouthExpression; // persisted expression for leaderboard/other-player display
}
```

**Clothing catalog** (`src/constants/clothing.ts`):
- `CLOTHING_CATALOG` — level-gated items:
  - redCowboyHat (hat) lvl 1
  - pinkPants (pants) lvl 2
  - greenSash (body) lvl 3
  - baseballCap (hat) lvl 4
  - bellBottoms (pants) lvl 5
  - purpleVest (body) lvl 7
  - redKicks (shoes) lvl 9
- `BATTLE_REWARD_CATALOG` — items won from ranked matches (blueSkateboard)
- `MONSTER_SIZE_GROUP` — maps monster IDs to `'Big' | 'Small'` for size-specific asset variants
- `CLOTHING_IMAGES` — asset map: `Big/`, `Small/`, `Bottom/` (bottom-layer items, no size variant)
- `CLOTHING_SLOT_ORDER` — render order for top layers: `['pants', 'shoes', 'body', 'gloves', 'hat']`

**Rendering** (`src/components/monster/MonsterAvatar.tsx`):
- Display shape: **rounded square** (`borderRadius = container * 0.18`)
- Bottom slot renders **under** the monster image (first in JSX, lower z-index)
- Top slots render as absolute overlays above the monster image in `CLOTHING_SLOT_ORDER`
- `getClothingImage(monsterId, itemId, slot)` — uses `Bottom/` folder for `slot === 'bottom'`, size-specific folder otherwise

**Closet screen** (`src/screens/profile/ClosetScreen.tsx`):
- Shows owned items → locked upcoming level items → battle reward items
- `UserService.equipItem(uid, slot, itemId)` writes `monster.parts.${slot}` — works for any slot

**Brain swap** (`MonsterBrainSwapModal`): `UserService.switchMonsterAvatar(userId, newMonsterId)` updates `monster.monsterId`. Clothing automatically remaps because `getClothingImage(monsterId, itemId, slot)` routes to `Big/` or `Small/` using the new monster's size group — no clothing migration needed. Accessible from `ProfileScreen` via a "🧠 BRAIN SWAP" button.

#### Monster Portrait Thumbnail System

A low-resolution snapshot of each user's fully-dressed monster, stored in Firebase Storage and referenced everywhere a visual monster identity is needed.

**Capture flow:**
1. User changes clothing in `ClosetScreen` → `equipItem` writes to Firestore → `AuthContext` subscription updates `user.monster.parts`
2. `ClosetScreen` watches `user.monster.parts` via a stringified key effect — sets `isDirty = true` and starts a **5-minute debounce timer**
3. If the user leaves the screen before the timer fires, the **navigation `blur` listener** cancels the timer and calls `captureAndSave()` immediately
4. `captureAndSave()` uses `react-native-view-shot` to render `MonsterAvatarDisplay` at 120×120px JPEG
5. Image is uploaded to Firebase Storage at `monster-thumbnails/{userId}.jpg` via `UserService.saveMonsterThumbnail()`
6. Download URL is written back to `user.monster.thumbnailUrl` in Firestore

**Propagation to leaderboard:** The hourly `updatedetailedleaderboards` Cloud Function reads `thumbnailUrl` and writes it into each `CategoryHabitLeaderboardEntry`. No extra Firestore reads per leaderboard row.

**Usage:**
| Location | Behavior |
|---|---|
| `LeaderboardScreen` — global & friend rows | Shows thumbnail; falls back to small `MonsterAvatarDisplay` |
| `BattleChallengeScreen`, `BattlePrepScreen`, `BattleResultScreen` | Opponent/both thumbnails |
| `ActiveChallengeCard` | Opponent thumbnail in active challenge list |

#### Monster Mouth Expression System

Every `MonsterAvatarDisplay` always renders a mouth layer between the base monster image and the clothing overlays. All mouth PNGs are 600×800px and pixel-perfect aligned with the base monster.

**Assets:**
- `src/assets/monsters/Big/Mouths/{excited,happy,okay,sad,upset}.png` — Big group (ids 1,2,5,7)
- `src/assets/monsters/Small/Mouths/{excited,happy,okay,sad,upset}.png` — Small group (ids 3,4,6,8)
- `getMouthImage(monsterId, expression)` in `src/constants/monsters.ts` resolves the correct size group

**Base expression** (computed from habit completion, "due today" only):
- Weekly habits only count when `scheduledDays` includes today's day-of-week
- `upset` — 0 completed this cycle AND no habit has `lastCompletedDate === yesterday` (skipped an entire day)
- `sad` — > 0% and < 25% completed
- `okay` — ≥ 25% and < 50%
- `happy` — ≥ 50% and < 100%
- `excited` — 100% complete

**Temp expression** (2-minute in-memory override, does NOT persist):

| Trigger | Expression |
|---|---|
| Ranked battle win | `excited` |
| Friendly battle win | `happy` |
| Ranked battle loss | `upset` |
| Friendly battle loss | `sad` |
| Level-up detected | `excited` |

**Architecture:**
- `MoodEventContext` (`src/contexts/MoodEventContext.tsx`) — stores temp event with `expiresAt`; single `setTimeout` auto-clears; no polling
- `useMouthExpression(habits, today)` (`src/hooks/useMouthExpression.ts`) — returns `{ expression, base }`. Use `expression` for rendering (includes temp override), `base` for Firestore writes (raw habit-computed value only)
- `HomeScreen` computes the expression, detects level-up via `prevLevelRef`, writes `baseMouthExpression` to `monster.mouthExpression` on the Firestore user doc when it changes
- `BattleResultScreen` calls `setMoodEvent()` after loading challenge result
- `ClosetScreen` watches `user.monster.mouthExpression` in its ViewShot recapture deps — thumbnail regenerates on big-cycle expression changes alongside clothing changes
- `updatedetailedleaderboards` CF writes `mouthExpression` into each `CategoryHabitLeaderboardEntry`
- **Default:** component renders `'upset'` when no `mouthExpression` prop is passed (unknown users default to upset)

### 5. Standard / Metric Unit System

**Hook:** `src/hooks/useUnitPreference.ts` — `UnitPreference = 'standard' | 'metric'`, AsyncStorage key `@habitbeast/unitPreference`. Module-level state + listener set; changing the preference updates all mounted screens instantly.

**Conversions:** `src/utils/units.ts` — all internal storage in canonical standard units (oz, miles, lbs); display layer converts for metric.

| Measurement | Standard | Metric | Conversion |
|---|---|---|---|
| Water volume | oz | L (2 dp) | 1 oz = 0.029574 L |
| Exercise distance | miles | km (2 dp) | 1 mile = 1.60934 km |
| Gym weight | lbs | kg (1 dp) | 1 lb = 0.453592 kg |

Macros (kcal, g) are universal — no conversion.

**Toggle:** Profile screen → UNITS card — `⚖ STANDARD` / `⚗ METRIC`.

### 6. Macro, Food & Water Tracking

#### Water

- Daily goal stored at `waterHabit.settings.dailyGoal` (default 64oz) — **not** on the User doc
- Serving size configurable at `UserHabit.settings.servingSize` (default 8oz); both editable in HabitDetailScreen → WATER GOALS card
- HomeScreen `+{servingSize}oz` button and HabitDetailScreen "Log Water" both call `MacroService.addWater()`
- Auto-complete: HomeScreen watches `macroTotals.water >= waterHabit.settings.dailyGoal` and calls `HabitService.completeHabit()` when crossed
- Macro bars appear only when relevant habits are active (food macros: `meals` habit; water bar: `water` habit)

#### Meal Goals

- `User.mealGoals: MealGoals` — per-meal macro targets: `breakfast?`, `snacks?`, `lunch?`, `dinner?` (each a `FoodMacros` object)
- Daily totals computed at runtime by summing per-meal goals via `getTotalGoalForKeys`
- `UserService.updateBodyProfile()` computes TDEE → stores `mealGoals.calorieRange {min,max}` AND per-meal macro goals (breakfast 25%, snacks 20%, lunch 30%, dinner 25%)

#### Food Library & Logging

**Architecture:** Food picker is a modal stack on top of the main tabs:
```typescript
(navigation as any).navigate('FoodFlow', { screen: 'FoodPicker', params: { defaultMeal: 'breakfast' } })
```

**Screens:** `FoodPickerScreen` → `FoodServingScreen` → `AddFoodScreen` | `AdminFoodReviewScreen` | `WeeklyInsightsScreen`

**Library sources:**
- **Global library** (`/foodLibrary/{foodId}`): submitted by any user, requires admin approval (`status: 'pending' | 'approved' | 'rejected'`)
- **Personal library** (`/users/{uid}/personalFoods/{foodId}`): private, no approval needed
- **Ban flag:** `user.canSubmitToFoodLibrary` (default true). Admins can set `false` to revoke global submission rights.

**Meals habit display modes** (`mealsHabit.settings.displayMode`):
- `'macros'` (default): Full macro progress bars for all unlocked meal slots
- `'favorites'`: Horizontal quick-pick row (`FavoriteFoodsRow`) of hearted foods
- `'simple'`: Per-meal checkboxes (`MealCheckboxRow`). Tapping unchecked meal calls `MacroService.addMealCheckIn()` (creates `MacroLog` with `isEmpty: true`)

**Favorites system:** `User.favoriteFoodIds: Array<{foodId, source}>`. Heart/unfavorite via `UserService.toggleFavorite()` (uses `arrayUnion`/`arrayRemove`).

**Meals habit auto-complete:**
- Macros mode: auto-completes when any food is logged for a tracked meal today
- Simple mode: auto-completes when all `MEALS_FOR_TIER[mealsTier]` meals each have ≥1 log (food or isEmpty)

**Seed foods:** 42 total in `seed-data/initialFoods.json` and production `foodLibrary`.

---

## Battle System

### Core Concept

Every habit completion earns a **battleAction** — a combat move. Before a battle, each player arranges their actions into a **loadout** (ordered sequence). At the scheduled time, the battle runs automatically — no live input required.

**Stakes:**
- **Ranked:** Used actions are consumed from your pool on battle completion (win or lose). Must re-earn them.
- **Friendly:** Actions are preserved. Free practice.

### BattleAction Structure

```typescript
interface BattleAction {
  battleActionNumber: number; // Unique integer ID
  name: string;
  description: string;
  flavorText: string;

  type: 'attack' | 'defense' | 'buff' | 'heal' | 'special';
  actionPointCost: number;  // 0.5, 1, 1.5, 2, 2.5, 3...
  speedRating: number;      // 0–100; higher = acts first

  // Effects (only defined fields apply)
  damage?: number;
  healing?: number;
  shieldAmount?: number;

  // Special mechanics
  grantsBonusAction?: boolean;
  skipOpponentTurn?: boolean;
  comboWith?: number[];
  comboMultiplier?: number;
  critBonus?: number;           // % crit chance buff for N of active player's turns
  critBonusTurns?: number;
  damageBuff?: number;          // multiplier on next damaging action (stacks ×=, consumed on use)

  // OT mechanics
  dotDamage?: number; dotTurns?: number;
  hotHealing?: number; hotTurns?: number;
  selfDotDamage?: number; selfDotTurns?: number;
  vampiricAmount?: number;
  shieldPiercing?: boolean;
  debuffAccuracy?: number; debuffAccuracyTurns?: number;
  debuffDamage?: number; debuffDamageTurns?: number;

  scalesWithStat?: keyof CombatStats;
  statScaling?: number;
}
```

**Full action list:** `seed-data/battleActions.json` and `src/constants/battleActions.ts` (242 actions, numbers 1–242).

- #1–#47: standard habits (meals, water, cold shower, planks, etc.)
- #48–#72: Doctor's Lab daily custom (exercise/generalHealth/cleanliness/community/creativity, T1–T5 each)
- #73–#101: extended habits (sleep, mental health category, avoidance, etc.)
- #102–#117: extended tier upgrades (cold_shower T3/T4, running T3/T4, etc.)
- #118–#212: new habits batch (cleanliness, community, generalHealth, exercise, mentalHealth, creativity)
- #213–#242: Doctor's Lab **weekly** custom (all 6 categories × 5 tiers, 2× power vs daily equivalents)

**Seed scripts:** `seed-data/seed-battle-actions.js` and `seed-data/seed-habit-catalog.js` push JSON files to Firestore. Idempotent append scripts (`append-*.js`) update the JSON files before seeding. To regenerate `battleActions.json` from the TypeScript source of truth after editing `battleActions.ts`, run `node seed-data/generate-battle-actions-json.js`, then re-seed with `node seed-data/seed-battle-actions.js`.

**damageBuff mechanic (updated):** `damageBuff` is **permanent** — once applied it lasts the rest of the battle (never consumed). Stacks multiply (`×=`). It applies to `damage`, `dotDamage`, and `vampiricAmount`. All damage values round **up** (ceil). This means even a 1-damage action × 1.25 buff = 2 damage effective.

**Tier damage caps (T1 review complete, T2+ TODO):** T1 daily actions are capped at 2 max damage; T1 weekly actions at 3 max damage. Each tier up doubles: T2 daily 4 / weekly 6, T3 daily 8 / weekly 12, T4 daily 16 / weekly 24, T5 daily 32 / weekly 48. **T2–T5 actions have had their damage caps verified but their effect mechanics (DoT variety, damageBuff distribution, vampiric coverage) have NOT yet been reviewed for alignment with the T1 philosophy. A full T2–T5 mechanic review pass is needed — apply the same principle: boring flat-damage-only actions should be enriched with DoT, damageBuff, or vampiric effects appropriate to their tier power level.**

### Combat Stats

```typescript
interface CombatStats {
  power: number;        // From exercise habits
  endurance: number;    // From generalHealth habits
  precision: number;    // From cleanliness habits
  synergy: number;      // From community habits
  adaptability: number; // From creativity habits
}
```

- `precision` (attacker): adds to base accuracy (85%) and crit chance
- `precision` (defender): reduces incoming damage
- `synergy`: boosts combo damage bonus

Recalculated by `onHabitComplete` cloud function after every habit completion.

### BattleAction Pool

```
Max pool size = Math.max(4, Math.min(20, level × 2))
```

- Pool is a map of `{ [actionId: string]: count }` plus an ordered `battleActionQueue[]` (oldest-first)
- When a habit is completed, the awarded action is appended to the queue
- If pool is at capacity, the **oldest action is evicted** (FIFO)
- Users can manually discard actions via the Battle Arsenal screen

**Pool mutation ownership — do not violate:**
| Operation | Owner |
|-----------|-------|
| Award action on habit complete | `onhabitcomplete` cloud function only |
| Consume actions after ranked battle | `updateUserAfterRankedBattle` (battleEngine CF) only |
| Manual discard | `BattleService.discardAction()` client |
| Purge over-capacity | `BattleService.purgeOldestToCapacity()` client |

`BattleResultScreen` calls `consumeLoadoutActions()` only to set an idempotency flag — it does **not** touch pool counts directly. Duplicating pool decrements client-side drives counts negative and breaks the arsenal.

### Battle Challenge Lifecycle

```
pending → ready_both → completed
        ↓           ↓
      expired     cancelled
```

- **`pending`**: Challenger sent with loadout locked. Opponent has 24 hours to respond.
- **`ready_both`**: Opponent accepted and locked loadout — battle executes immediately via Firestore trigger.
- **`completed`**: Battle resolved.
- **`expired`**: Opponent didn't respond within 24 hours.
- **`cancelled`**: Challenger withdrew before opponent responded (only valid in `pending` state).

**Challenger locks loadout at creation.** `challengerLoadout` is set when the challenge document is first written.

**Opponent accepts + locks in one action.** `opponentLoadout` is written and `status` transitions to `ready_both` atomically. The Firestore trigger fires and executes the battle.

**Ranked cooldown.** After a ranked battle, those two players cannot challenge each other in ranked mode again for 12 hours. Tracked via `rankedCooldowns: { [opponentUserId: string]: Timestamp }` on each User doc.

**Loadout limits:**
```typescript
const scaledMax = Math.min(Math.max(4, Math.floor(level * 0.5)), 10);
maxLoadoutSize = Math.min(totalPoolSize, scaledMax);
```

New players (level 0–7) can bring all 4 pool actions into battle.

### Battle Execution (Cloud Function)

When a challenge document transitions to `ready_both`, the `onbattleready` trigger fires and immediately calls `BattleEngine.executeBattle()`. `processBattles` (hourly) is a safety-net for any `ready_both` battles the trigger missed.

**Execution status lifecycle:** `pending → ready_both → executing → completed`. `executeBattle()` atomically claims the battle via a Firestore transaction (`ready_both → executing`) to prevent double-processing.

**Simulation loop:**
1. Each player starts with HP = `level × baseHPMultiplier` (minimum 1), shield pool = 0
2. Each turn: compare speed ratings — higher goes first (challenger wins ties)
3. **Pre-action tick phase:** Process DoT ticks (on opponent), HoT ticks (on self), self-DoT ticks (berserker). Ticks fire **every turn** (both the active player's turn and the opponent's turn). If active player's HP reaches 0 from a pre-action tick → `death` win
4. Execute action: apply damage (shields absorb first), healing, check combos, apply special mechanics, push new DoT/HoT effects
5. Loop while either player has actions remaining
6. End when any player's HP reaches 0, or both loadouts exhausted

**Special mechanics:**
- `grantsBonusAction`: After this action, player uses their **next** action before opponent gets a turn
- `skipOpponentTurn`: Opponent's next action is skipped
- `comboWith`: If previous action (by same player) is in this array, damage × `comboMultiplier`
- **DoT/HoT:** DoT ticks on opponent's turns; HoT ticks on caster's turns (no HP cap — over-heal intentional). Self-DoT bypasses caster's own shield.
- **Vampiric:** Steals fixed HP from opponent (absorbed by their shield first), adds to caster HP.
- **Shield pierce:** Actions tagged `shieldPiercing: true` bypass shield pool entirely.
- **Debuffs:** `DebuffEntry[]` per-player; tick on debuffed player's own turns. Accuracy/damage reduction fields on `BattleAction`.
- **critBonus:** Buff action adds `critBonus` (% as decimal) for `critBonusTurns` of the active player's turns. Stacks additively. Passed as `critBonusPercent` to `executeAction`.
- **damageBuff:** Permanent multiplier buff — once applied, lasts the entire battle. Stacks multiply (`×=`). Applies to `damage`, `dotDamage`, and `vampiricAmount`. All damage values round **up** (ceil).
- **Over-heal barrier:** HP above `maxHP` acts as a disposable damage buffer (drains before shield, then real HP). Over-heal HP bar turns **gold** (`#B8860B`) and pulses.
- **Crit DoT:** When a crit hit applies a DoT, tick damage is boosted ×1.5.
- **HoT + attack synergy:** If attacker has ≥1 active HoT when resolving an attack, +1 bonus damage.

**Win conditions (priority order):**
1. **Death** — HP hits 0 from damage or DoT tick → opponent wins (`winCondition: 'death'`)
2. **Knockout** — loadouts exhausted, both alive → higher total (HP + shield) wins (`winCondition: 'knockout'`)
3. **Draw** — loadouts exhausted and both players have equal HP+shield → `winCondition: 'draw'`

### ELO Rating (Ranked Only)

```typescript
const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));
const change = Math.round(kFactor * (won ? (1 - expected) : (0 - expected)));
```

K-factor configured in `battleConfig/settings.ratingKFactor` (default 32).

**Draw:** Both players receive a flat +5 ELO. Pass `isDraw: true` to `calculateRatingChanges()`.

**Rank thresholds:** bronze (<1000), silver (1000+), gold (1200+), platinum (1400+), diamond (1600+)

### XP Rewards (All Battles)

- **Ranked winner:** `max(1, preGameLevel)` XP
- **Ranked loser:** +1 XP
- **Friendly winner:** +1 XP
- **Friendly loser:** +0.5 XP
- **Draw (either type):** +1 XP to both players

XP stored via `FieldValue.increment` on `user.cumulativePoints`. Shown on `BattleResultScreen`.

### Challenge Limits

| | Ranked | Friendly |
|--|--------|---------|
| Max per day | 2 | Unlimited |
| Max active | 1 | 3 |
| Level bracket (below 10) | ±3 | n/a |
| Level bracket (below 20) | ±6 | n/a |
| Level bracket (below 30) | ±10 | n/a |
| Level bracket (30+) | ±100 (open) | n/a |
| Requires friendship | No | Yes |
| Friendly limit per 12h | — | Max 5 per player; server-enforced in `onbattlechallengecreated`; rejected with `rejectionReason: 'friendly_limit'` |

**After battle (ranked):** Actions consumed from pool; ELO updated; `rankedCooldowns[opponentId]` set to `completedAt + 12h` on both user docs.
**After battle (friendly):** Win/loss/draw counts updated; actions preserved.
**After battle (draw):** `winner` field = `''`; ELO +5 to both; XP +1 to both; ranked draw still consumes loadout actions.

### Battle Replay UI Layout

`BattleReplayScreen` header shows two monster avatars with HP/name info:
- **Avatar placement:** Challenger avatar on far left; opponent avatar on far right. Names and HP bars sit **between** the two avatars in the center. (Previous layout had `flexDirection: 'row-reverse'` on the right side — corrected to `'row'` with `textAlign: 'left'`.)
- **Particle overlay:** `BattleParticleOverlay` is `position: absolute` over the header, sized to `headerHeight`. Canvas triggers on the same frame as the sound effect (`useEffect` watching `currentIndex`).

---

## Social System

### Friend Connections (`/friendships/{friendshipId}`)

Document ID: `[uid1, uid2].sort().join('_')` — deterministic, prevents duplicates.

```typescript
interface Friendship {
  friendshipId: string;
  userIds: [string, string];
  status: 'pending' | 'accepted' | 'declined';
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: Timestamp;
  acceptedAt?: Timestamp;
}
```

**Add friend flow:** Sender enters email → `FriendService.sendFriendRequest()` → queries users by email → creates `pending` doc → `onfriendshipcreated` CF sends FCM → recipient accepts/declines.

**Anti-enumeration:** `sendFriendRequest` always returns silently. UI always shows the same toast regardless of whether the target email was found.

### Leaderboard Screen

**File:** `src/screens/leaderboard/LeaderboardScreen.tsx`

**Layout:** Two-row grid of category buttons + full-width RIVALS & FRIENDS row:
```
Row 1: [ Exercise ] [ Gen Health ] [ Cleanliness ]
Row 2: [ Community ] [ Creativity ] [ Mental Health ]
Row 3: [ ⚔ RIVALS & FRIENDS (full width) ]
```

**Metric sub-tabs (non-Friends):** Streak | Tier | Days | Level

- **Streak**: current active streak for that habit
- **Tier**: highest tier reached
- **Days**: unique calendar days habit was completed (from actual `habitLogs` — not a running counter)
- **Level**: all monsters with any habit in the category, ranked by overall `currentLevel`

**Per-habit-type sections**: user's own habits appear first. Own entry highlighted with gold border.

**PlayerProfileModal** (`src/components/leaderboard/PlayerProfileModal.tsx`): tap any non-self row → shows avatar, level, ranked W/L (friends tab), battles fought vs you (live Firestore query), EXIT + REPORT buttons. FIGHT! is full-width CTA. REPORT is small text link below monster name. Bot profiles show "TRAINING BOT" title, "⚗ ZE LABORATORY BOT" flavor tag, "CHALLENGE (FRIENDLY)" button, and no REPORT link.

### Services

| Service | File | Purpose |
|---------|------|---------|
| `FriendService` | `src/services/social/FriendService.ts` | Send/accept/decline requests, list friends |
| `LeaderboardService` | `src/services/leaderboard/LeaderboardService.ts` | Fetch per-habit-type leaderboard docs, manage categoryIndex cache |
| `ReportService` | `src/services/social/ReportService.ts` | Player reporting, battle history between two users |

### Content Moderation

**Profanity filter:** `bad-words` v4 (named export `Filter`, NOT default import). File: `src/utils/profanityFilter.ts`.

Two-layer system:
1. **`bad-words` `Filter`** — word-boundary-aware English profanity detection
2. **`BANNED_SEQUENCES`** — hand-curated substrings. Input normalised through `normaliseLeet()` (maps `0→o`, `1→i`, `3→e`, `4→a`, `5→s`, `@→a`, `$→s`, strips spaces)

**Public API:**

| Function | Returns | Use |
|---|---|---|
| `checkMonsterName(name)` | `{ isClean, reason? }` | Full check with lab-assistant error message |
| `isNameClean(name)` | `boolean` | Quick boolean guard |
| `safeDisplayName(name)` | `string` | Returns name or `[REDACTED]` |

**Integration points:**
- **Sign-up:** `signUpSchema.monsterName` has `.test('no-profanity')` Yup validator
- **Leaderboard render:** `safeDisplayName()` applied to every monster name in `LeaderboardRow` and `FriendRow`
- **Profile rename:** `checkMonsterName()` called before `UserService.setMonsterName()`

**Monster rename:** "✎ RENAME BEAST" modal on Profile screen (no cooldown). Calls `UserService.setMonsterName(uid, name)` → updates `monster.name` and `monster.lastUpdated`.

### Auto-Monster System

Ten bot accounts live in the `users` collection with `isAutoMonster: true`. They are real user docs treated identically by the battle engine — no special-casing in `BattleEngine.ts`.

**Bot roster:**

| Bot ID | Name | Level | Monster |
|--------|------|-------|---------|
| `auto_gurplins` | Gurplins | 0 | Murk |
| `auto_twigsworth` | Twigsworth | 1 | Wrapps |
| `auto_dronk` | Dronk | 2 | Stumbles |
| `auto_flabbius` | Flabbius | 3 | Franky |
| `auto_raspo` | Raspo | 4 | Howler |
| `auto_snugg` | Snugg | 5 | Iggy |
| `auto_slobworth` | Slobworth | 6 | Iggy |
| `auto_lurchwick` | Lurchwick | 7 | Stumbles |
| `auto_grimbold` | Grimbold | 8 | Murk |
| `auto_kronveld` | Kronveld | 9 | Franky |

**Rules:**
- Bots only do **friendly** battles (never ranked). Ranked challenges against a bot are rejected.
- Friendly battle limit (5 per 12h) is **bypassed** for bot opponents — the limit only applies to real-vs-real.
- `leaderboardOptIn: false` — bots never appear on leaderboard tabs.
- Players can challenge bots from their battle history. Bot profiles show "TRAINING BOT" title, "⚗ ZE LABORATORY BOT" tag, and "CHALLENGE (FRIENDLY)" CTA. No REPORT button.
- **Battle stats display:** `PlayerProfileModal` shows `battleStats.friendly` W/L for bots (not ranked, which is always 0 since bots never do ranked battles).

**Loadouts:**
- Level 0–5: 4 random tier-1 actions (drawn from `TIER1_ACTION_IDS`, shuffled per challenge).
- Level 6+: 1 random tier-2 action + 3 random tier-1 actions.
- Pool is pre-populated on the bot user doc with 2 copies of each eligible action. Friendly battles never consume pool actions.

**Challenge delivery (`scheduledAutoChallenges` collection):**
```
{
  targetUserId  : string     // real player to challenge
  autoMonsterId : string     // bot ID (e.g. 'auto_twigsworth')
  level         : number
  scheduledFor  : Timestamp  // random time in player's ±6h reset window
  status        : 'pending' | 'sent'
  reason        : 'initial' | 'periodic'
}
```
- `onusercreated` → schedules level-0 challenge for every new signup.
- `onuserupdate` → schedules matching-level challenge on level-up (levels 1–9).
- `processautomonsters` (every 30 min) → fires due docs, creates `battleChallenges`, sends FCM.
- Periodic re-challenges fire every **24h** while player stays at the bot's level (within ±6h of player's reset window).

**Config:** `src/constants/autoMonsters.ts` (client); `functions/src/autoMonsterService.ts` (CF helpers).

### Player Reporting

**Firestore schema:** `/reports/{reportedUserId}`

```
{
  reportedUserId : string
  reportCount    : number
  reporterIds    : string[]   // arrayUnion — each user counted once
  lastReportedAt : Timestamp
}
```

`ReportService.reportUser()` returns `'reported'` or `'duplicate'`. Moderation is manual (Firebase Console). No automated action on report thresholds.

`ReportService.getBattlesBetween(a, b)` fires two parallel queries on `battleChallenges` (challenger=A/opponent=B and challenger=B/opponent=A), returns total count.

---

## Data Architecture

### Firestore Collections

#### `/users/{userId}`
```typescript
interface User {
  userId: string;
  email: string;
  username: string;           // Always "Doctor" (story element)
  createdAt: Timestamp;

  subscriptionStatus: 'active' | 'cancelled' | 'trial';
  subscriptionTier: number;
  isAdmin?: boolean;

  monster: MonsterAvatar;
  currentLevel: number;
  cumulativePoints: number;
  categoryPoints: {
    exercise: number; generalHealth: number; cleanliness: number;
    community: number; creativity: number; mentalHealth: number;
  };
  combatStats: CombatStats;

  battleActionPool: { [actionId: string]: number };
  battleActionQueue: string[];  // Ordered, oldest first
  totalPoolSize: number;
  maxPoolSize: number;          // Math.max(4, Math.min(20, level × 2))

  battleStats: {
    ranked: { wins: number; losses: number; rating: number; rank: string };
    friendly: { wins: number; losses: number };
    totalBattles: number;
    lastBattleAt?: Timestamp;
  };

  badges: { badgeId: string; earnedAt: Timestamp; isDisplayed: boolean }[];
  displayedBadges: string[];

  dailyResetTime: string;       // UTC, e.g. "07:00"
  timezone: string;             // IANA, e.g. "America/New_York"
  onboardingComplete: boolean;
  leaderboardOptIn: boolean;
  lastDailyBonusDate?: string;  // YYYY-MM-DD, prevents double daily bonus

  mealGoals?: MealGoals;
  favoriteFoodIds?: Array<{foodId: string; source: 'global' | 'personal'}>;
  canSubmitToFoodLibrary?: boolean;
  notificationSettings: NotificationSettings;
  rankedCooldowns?: { [opponentUserId: string]: Timestamp };

  bodyProfile?: BodyProfile;    // Scientific mode only
  lastHabitChangeDate?: string; // ISO date, enforces 24h change cooldown

  // Auto-monster bot fields (only set on the 10 bot accounts)
  isAutoMonster?: boolean;      // True → bot account; never appears on leaderboard
  autoMonsterLevel?: number;    // Fixed level this bot operates at (never changes)
}

interface BodyProfile {
  age: number;
  height: number;               // cm (canonical); display converts to ft/in for standard users
  currentWeight: number;        // lbs (canonical)
  goalWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weightGoal: 'gain' | 'lose' | 'maintain';
  updatedAt: Timestamp;
}
```

#### `/users/{userId}/habits/{habitId}`
```typescript
interface UserHabit {
  habitId: string;
  habitType: string;
  category: HabitCategory;
  currentTier: number;          // 1–5

  tierProgress: {
    [tierLevel: number]: {
      completionCount: number;
      battleActionUnlocked: string;
      bestPerformance?: number;
      unlockedAt?: Timestamp;
    };
  };

  isActive: boolean;
  isCompleted: boolean;         // Set true by completeHabit(); reset by processHabitResets CF
  isCustom?: boolean;
  customDefinition?: CustomHabitDefinition;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;    // YYYY-MM-DD (UTC)
  totalCompletionDays?: number; // best-effort counter (authoritative: habitLogs)
  lastCountedDate?: string;     // date when totalCompletionDays was last incremented
  settings?: Record<string, any>;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `/users/{userId}/habitLogs/{logId}`
```typescript
interface HabitLog {
  logId: string;
  habitId: string;
  habitType: string;
  category: HabitCategory;
  tierLevel: number;
  date: string;                 // YYYY-MM-DD (local device time)
  completedAt: Timestamp;
  pointsAwarded: number;
  battleActionAwarded: string;
  value?: number;
  unit?: string;
  metrics: Record<string, any>;
}
```

#### `/users/{userId}/macroLogs/{logId}`
```typescript
interface MacroLog {
  logId: string;
  date: string;                 // YYYY-MM-DD (UTC)
  loggedAt: Timestamp;
  meal: MealType;               // 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner'
  foodId?: string;
  foodSource?: 'global' | 'personal';
  foodName: string;
  servings: number;
  macros: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  isWater?: boolean;
  waterOz?: number;
  isEmpty?: boolean;
  isWeightEntry?: boolean;
  weightLbs?: number;
}
```

#### `/battleChallenges/{challengeId}`
```typescript
interface BattleChallenge {
  challengeId: string;
  challenger: string;
  opponent: string;
  status: 'pending' | 'ready_both' | 'completed' | 'cancelled' | 'expired';
  type: 'ranked' | 'friendly';
  levelBracket: number;
  createdAt: Timestamp;
  expiresAt: Timestamp;         // createdAt + 24h
  challengerLoadout: { battleActions: string[]; lockedAt: Timestamp };
  opponentLoadout: { battleActions: string[]; lockedAt?: Timestamp };
  battleLog?: {
    turns: BattleTurn[];
    finalStats: {
      challengerHP: number; opponentHP: number;
      challengerAPRemaining: number; opponentAPRemaining: number;
      challengerMaxHP: number; opponentMaxHP: number;
      challengerFinalShield: number; opponentFinalShield: number;
    };
  };
  winner?: string;              // empty string '' on draw
  winCondition?: 'death' | 'knockout' | 'draw' | 'forfeit';
  rejectionReason?: 'friendly_limit';
  completedAt?: Timestamp;
  ratingChanges?: { challenger: number; opponent: number };
}
```

#### Other Collections
- `/battleActions/{battleActionNumber}` — action definitions (see `BattleAction` interface)
- `/battleConfig/settings` — tunable battle config (see [Battle Configuration](#battle-configuration))
- `/foodLibrary/{foodId}` — global approved foods (`status: 'pending' | 'approved' | 'rejected'`)
- `/users/{uid}/personalFoods/{foodId}` — same shape as `FoodLibraryItem` minus `status`/`approvedBy`
- `/habitCatalog/{habitType}` — habit definitions (read from local `HABIT_CATALOG` first, Firestore as fallback)
- `/friendships/{friendshipId}` — friend connections
- `/reports/{reportedUserId}` — player reports
- `/badges/{badgeId}` — badge definitions
- `/globalLeaderboard/{metricType}` — leaderboard docs (see below)
- `/scheduledAutoChallenges/{docId}` — pending auto-monster challenge deliveries (see Auto-Monster System)
- `/battleSummaries/{docId}` — condensed archive of completed battles older than 14 days (no turn data)

#### Leaderboard Documents (`/globalLeaderboard/`)

Updated hourly by `updatedetailedleaderboards`. Top 50 entries per document.

**Per-habit-type ranking docs:** `/globalLeaderboard/cat_{category}_{habitType}_{metric}`

Document shape:
```typescript
{
  metricType: 'streak' | 'tier' | 'days' | 'level',
  category: HabitCategory,
  habitType: string,     // '_all' for LEVEL aggregate view
  habitName: string,
  lastUpdated: Timestamp,
  rankings: {
    rank: number; userId: string; monsterName: string;
    monsterId: string; level: number; value: number;
    thumbnailUrl?: string;
  }[]
}
```

**LEVEL metric**: uses sentinel `habitType: '_all'` — one doc per category: `cat_{category}__all_level`.

**Category index:** `/globalLeaderboard/categoryIndex` — maps category → habitTypes with actual user data. Client uses this for dynamic discovery; adding new habits to `HABIT_CATALOG` is sufficient.

---

## Backend Cloud Functions

All functions in `functions/src/index.ts` (scheduled + triggers) and `functions/src/battleEngine.ts`.

### Scheduled Functions (All Hourly)

#### `processHabitResets`
- For each user whose `dailyResetTime` (UTC hour) matches the current hour:
  - Resets `isCompleted = false` on all active habits
  - Checks habitLog for yesterday → increments/resets `currentStreak`, updates `longestStreak` and `lastCompletedDate`
- Points, level-ups, and battleAction awards happen **client-side** in `HabitService.completeHabit()` — not here

#### `processBattles`
Safety-net: queries `battleChallenges` where `status == 'ready_both'` (or `executing`), executes any missed by `onbattleready` trigger.

#### `cleanupExpiredChallenges`
- **Pass 1:** Marks `pending` challenges past `expiresAt` → `expired` (24h window).
- **Pass 2:** Archives `completed` `battleChallenges` older than 14 days to `/battleSummaries` (condensed — no `battleLog.turns`), then deletes all `battleChallenges` older than 14 days regardless of status. Runs in batches of 499 ops.

#### `updatedetailedleaderboards`
- Paginates all opted-in users in batches of 500
- Fetches active habits + all `habitLogs` per user in parallel (50 concurrent users)
- Computes 4 metrics per active habit: `streak`, `tier`, `days` (from `habitLogs` `Set<date>`), `level`
- Writes `/globalLeaderboard/cat_{category}_{habitType}_{metric}` (top 50) and `/globalLeaderboard/categoryIndex`

#### `updateGlobalLeaderboards`
Queries top 100 opted-in users by `cumulativePoints`; writes `globalLeaderboard/cumulativePoints` and per-category docs.

#### `updateFriendGroupLeaderboards`
Aggregates member stats for each `friendGroups` document.

#### `sendhabitreminders`
At each user's `reminderHour = (resetHour + 12) % 24`: if no habit logs in last 12h, sends **"DOCTOR. ZE HABITS."** FCM nudge.

#### `sendmorningreminders`
Sends morning motivational FCM nudge at the start of each user's habit day (around reset time). Encourages the player to begin their daily habits.

#### `sendlastcallreminders`
Sends a last-call FCM nudge near the end of each user's habit day (approaching next reset). Alerts the player that time is running out to complete habits before the daily reset.

#### `checkhabitreminders`
At each user's `(resetHour + 6) % 24` UTC: finds active habits with `lastCompletedDate` ≥ 2 days ago, skips if `lastReminderSentDate` is already today, sends a 2-day nudge or 5-day escalation FCM push, then batch-writes `lastReminderSentDate` to all reminded habit docs. `UserHabit.lastReminderSentDate?: string` tracks per-habit send date.

### Trigger Functions

#### `onHabitComplete` (on `habitLogs` document created)
Runs inside a **Firestore transaction**:
- Updates `tierProgress[tierLevel].completionCount`
- Increments `totalCompletionDays` + sets `lastCountedDate` (once per calendar day)
- Awards battleAction to pool (with FIFO overflow eviction)
- Recalculates `combatStats`

#### `checkAndAwardBadges` (on `habitLogs` document created)
Awards streak badges (7, 30, 100 days), level badges (10, 20, 30), battle win badges (1, 10, 50, 100), ELO rank badges.

#### `onbattleready` (on `battleChallenges` document updated)
Fires on `before.status !== 'ready_both'` AND `after.status === 'ready_both'` transition. Immediately calls `BattleEngine.executeBattle(challengeId)`.

#### `onbattlechallengecreated` (on `battleChallenges` document created)
- **Auto-monster fast-accept:** If `opponent.isAutoMonster === true` → immediately writes `opponentLoadout` (random tier-appropriate loadout) and sets `status: 'ready_both'`, bypassing the friendly-limit check. Ranked challenges against bots are rejected with `rejectionReason: 'automonster_no_ranked'`.
- **Friendly limit check (real players):** If `type === 'friendly'` and either player has ≥5 completed friendly battles in last 12h → sets `status: 'rejected'`, `rejectionReason: 'friendly_limit'`
- Sends FCM challenge notification to opponent: **"ZE CHALLENGE ARRIVES!"**

#### `onbattlecompleted` (on `battleChallenges` document updated)
- Sends winner/loser FCM notifications with rating delta
- **Ranked only:** writes `rankedCooldowns[opponentId] = completedAt + 12h` on both user docs (skipped if either party is an auto-monster bot)

#### `onfriendshipcreated` (on `friendships` document created)
Sends FCM notification: **"ZE DOCTOR REQUESTS ALLIANCE!"** to recipient.

#### `onusercreated` (on `users` document created)
When a new (non-bot) user doc is created, schedules an initial auto-monster challenge from the level-0 bot (Gurplins) into `scheduledAutoChallenges`.

#### `onuserupdate` (on `users` document updated)
When `currentLevel` changes to a value that has a matching auto-monster (1, 2, 3, 4, 5, 6, 7, 8, 9), schedules a new auto-monster challenge for the player from the matching bot. Only fires if no challenge from that bot is already pending.

### Auto-Monster Scheduled Function

#### `processautomonsters` (every 30 minutes)
- Queries `scheduledAutoChallenges` where `scheduledFor <= now` and `status == 'pending'`
- For each due doc: creates a `battleChallenges` document (bot as challenger with pre-set loadout, player as opponent), sends **"ZE TRAINING BOT CHALLENGES YOU!"** FCM notification, marks the scheduled doc `status: 'sent'`
- Schedules the next periodic re-challenge (48h out) if the player is still at the bot's level

### HTTP Admin Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `seedautomonsters` | POST | Creates (or idempotently updates) all 10 bot user docs in Firestore (levels 0–9). |
| `migrateexistingusers` | POST | Retroactively schedules auto-challenges for existing players who pre-date the system |
| `cleanupbadselfchallenges` | POST | One-shot: deletes any `scheduledAutoChallenges` where `targetUserId === autoMonsterId` (self-challenge cleanup) |

### Seed Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `seedFirestore.ts` | `npm run seed` from `functions/` | Initial seed: battleConfig, habitCatalog, battleActions, foodLibrary |
| `seedBattleConfig.ts` | `npx ts-node src/seedBattleConfig.ts` from `functions/` | One-time: writes `battleConfig/settings` |

Both require `GOOGLE_APPLICATION_CREDENTIALS` env var pointing to a service account key.

---

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    function canSubmitFood() {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userData.canSubmitToFoodLibrary != false;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);

      match /habits/{habitId}     { allow read, write: if isOwner(userId); }
      match /habitLogs/{logId}    { allow read, write: if isOwner(userId); }
      match /macroLogs/{logId}    { allow read, write: if isOwner(userId); }
      match /personalFoods/{foodId} { allow read, write: if isOwner(userId); }
      match /battleHistory/{battleId} {
        allow read: if isOwner(userId);
        allow write: if false; // Cloud Functions only
      }
    }

    match /battleChallenges/{challengeId} {
      allow read: if isAuthenticated() &&
                    (request.auth.uid == resource.data.challenger ||
                     request.auth.uid == resource.data.opponent);
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.challenger;
      allow update: if isAuthenticated() &&
                      (request.auth.uid == resource.data.challenger ||
                       request.auth.uid == resource.data.opponent);
      allow delete: if isAuthenticated() && request.auth.uid == resource.data.challenger &&
                      resource.data.status == 'pending';
    }

    match /battleActions/{actionId}   { allow read: if isAuthenticated(); allow write: if isAdmin(); }
    match /battleConfig/{doc}         { allow read: if isAuthenticated(); allow write: if isAdmin(); }
    match /habitCatalog/{habitType}   { allow read: if isAuthenticated(); allow write: if isAdmin(); }
    match /monsterParts/{partId}      { allow read: if isAuthenticated(); allow write: if isAdmin(); }
    match /badges/{badgeId}           { allow read: if isAuthenticated(); allow write: if isAdmin(); }

    match /foodLibrary/{foodId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && canSubmitFood() &&
                      request.resource.data.status == 'pending' &&
                      request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && (isOwner(resource.data.createdBy) || isAdmin());
      allow delete: if isAdmin();
    }

    match /friendships/{friendshipId} {
      allow read: if isAuthenticated() && request.auth.uid in resource.data.userIds;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.requestedBy &&
                      request.resource.data.userIds.size() == 2;
      allow update, delete: if isAuthenticated() && request.auth.uid in resource.data.userIds;
    }

    match /friendGroups/{groupId} {
      allow read: if isAuthenticated() && request.auth.uid in resource.data.memberIds;
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.createdBy &&
                      request.resource.data.memberIds.size() > 0 &&
                      request.resource.data.memberIds.size() <= 5;
      allow update: if isAuthenticated() && request.auth.uid in resource.data.memberIds &&
                      request.resource.data.memberIds.size() > 0 &&
                      request.resource.data.memberIds.size() <= 5;
      allow delete: if isAuthenticated() && request.auth.uid == resource.data.createdBy;
    }

    match /globalLeaderboard/{metricType} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

---

## User Flows

### Onboarding
1. Download → create account (email/password) — free, no payment required at install
2. Select monster species (2-column grid of 8)
3. Name your monster
4. Set reset time (vertical spinner, shows local time, stores UTC)
5. Select initial habits (max 4)
6. Select habit priorities (P1/P2/P3 podium)
7. Land on HomeScreen
8. **Paywall triggers at level 5 → 6 transition** (see [Freemium Architecture](#freemium-architecture--v300))

### Daily Loop
1. Open app → HomeScreen shows monster, category circles, macro bars
2. Tap category circle → `CategorySummaryModal` → tap habit → `HabitDetailScreen`
3. Complete habit (boolean tap OR metric input)
4. Points awarded → level updated → battleAction added to pool

### Battle Flow
1. Battle tab → `BattleHubScreen` → tap **+ FIND OPPONENT** → select opponent → `BattleChallengeScreen`
2. Choose battle type, build and lock loadout, tap **SEND CHALLENGE** (challenge created with `challengerLoadout` set)
3. Opponent receives FCM notification → opens `BattleHubScreen` → taps **RESPOND** → `BattlePrepScreen`
4. Opponent taps **ACCEPT & FIGHT** — atomically writes `opponentLoadout` and sets `status: 'ready_both'`
5. `onbattleready` trigger fires → battle executes server-side within seconds
6. Both players receive FCM result notifications → `BattleResultScreen`

### Food Logging
1. Tap `+ LOG FOOD` on HomeScreen
2. `FoodPickerScreen` → search library, select meal
3. `FoodServingScreen` → adjust servings → log
4. Macros appear on HomeScreen bars; meals habit auto-completes

---

## UI/UX Design

### Color Palette (Steampunk)
- **Primary (brass):** `#B8860B`
- **Background (iron):** `#1C1A14`
- **Text (parchment):** `#D4C9A8`
- **Success:** Neon green `#39FF14`
- **Warning:** Amber `#FFBF00`
- **Error:** Red `#FF073A`

### Category Colors
- **Exercise:** Ember orange `#E8612C`
- **General Health:** Emerald green `#3DAA6B`
- **Cleanliness:** Steel blue `#4A9FD4`
- **Community:** Alchemical violet `#9B5ED4`
- **Creativity:** Canary gold `#E8C84A`
- **Mental Health:** Teal `#4DB6AC`

### Action Type Colors (Battle)
attack = red, defense = cyan, heal = green, buff = amber, special = magenta

### Fonts
- `FONTS.display = 'PlayfairDisplay-Bold'` for headers (bold serif)
- Assets: `src/assets/fonts/PlayfairDisplay-Bold.ttf`
- Setup: `react-native.config.js` at root → `npx react-native-asset` → rebuild

### Audio System

**Library:** `react-native-audio-api` v0.11.7 (Software Mansion). TurboModule — compatible with RN 0.83.1 New Architecture / Bridgeless mode. Uses Web Audio API spec: `AudioContext`, `AudioBufferSourceNode`, `GainNode`.

**Module:** `src/utils/audio.ts` — single entry point, mirrors `src/utils/haptics.ts` pattern. No screen or component imports the library directly; all calls go through named `sfx.*` exports.

**iOS silent switch:** `AudioManager.setAudioSessionOptions({iosCategory: 'ambient'})` — respects hardware mute toggle.

**iOS pod install:** `react-native-audio-api` requires `cd ios && pod install` on a Mac before iOS builds.

**Mixer graph:**
```
BufferSourceNode → [optional per-sound GainNode] → sfxGain → masterGain → destination
```
- `masterGain.gain` = `0` (muted) or `masterVolume` (0–1)
- `sfxGain.gain` = `1.0` (reserved for future category-level control)

**Initialization:** `initAudio()` called once in `App.tsx` `useEffect` on mount. Decodes all assets in parallel via `decodeAudioData` — zero-latency playback thereafter. Non-fatal: audio failure silently degrades (app continues without sound).

**Persistence:** Mute state and master volume stored in AsyncStorage (`@habitbeast/audioMuted`, `@habitbeast/audioVolume`). Restored on next `initAudio()`.

**Mute toggle:** Profile screen → SOUND section → "MUTE ALL SOUNDS" switch. Calls `setAudioMuted(bool)`.

**Asset structure:**
```
src/assets/audio/
  ui/          tap_chip, tap_primary, tap_tab, modal_open, modal_close, error, warning,
               profanity_reject, lab_assistant
  gameplay/    habit_complete, tier_unlock, level_up, habit_pause, avoidance_tally,
               food_log, water_log, weight_log, new_action_earned, friend_added,
               challenge_received, challenge_sent, sleep_enter, clothing_equip,
               monster_rename, brain_swap, monster_welcome, monster_grumble,
               monster_question, steam_hiss, bubbles_popping, sweep
  battle/      attack_base, crit_hit, shield_apply, heal_apply, dot_tick,
               battle_victory, battle_defeat, battle_draw
```

**Sound → source file mapping (selected highlights):**
| Sound | File |
|---|---|
| `tap_chip` | `short_gearClick.mp3` |
| `tap_primary` | `short_latchingUpward.mp3` |
| `error` | `short_trumpetTrillDownturn.mp3` |
| `warning` | `long_lionWarning.mp3` |
| `profanity_reject` | `short_scaredMonsterYell.mp3` |
| `habit_complete` | `short_gearFinishing.mp3` |
| `tier_unlock` | `long_trumpetUpbeat.mp3` |
| `level_up` | `long_trumpetDifficultVictory.mp3` |
| `water_log` | `long_waterGlassJug.mp3` |
| `lab_assistant` | `long_excuseMeFemaleThroatClear.mp3` |
| `clothing_equip` | `short_closetDoor.mp3` |
| `habit_pause` | `short_gateClosing.mp3` |
| `brain_swap` | `long_steamBlast.mp3` |
| `battle_defeat` | `long_multiToneFart.mp3` |
| `battle_draw` | `long_burpQuestion.mp3` |

**Where audio is wired:**
| Screen / Component | Trigger | Sound |
|---|---|---|
| `HabitCard` | chip tap | `sfx.tapChip()` |
| `HabitQuickCompleteModal` | validation error | `sfx.error()` |
| `HabitQuickCompleteModal` | water habit complete | `sfx.waterLog()` |
| `HabitQuickCompleteModal` | habit complete | `sfx.habitComplete()` |
| `HabitQuickCompleteModal` | weight logged | `sfx.weightLog()` |
| `HomeScreen` | level up | `sfx.levelUp()` |
| `FoodServingScreen` | food logged | `sfx.foodLog()` |
| `HabitDetailScreen` | delete / pause / reset confirm | `sfx.warning()` |
| `HabitDetailScreen` | pause confirmed | `sfx.habitPause()` |
| `BattleReplayScreen` | per-turn playback | `sfx.battleAction(type, isCrit)` or `sfx.battle.dotTick()` |
| `BattleResultScreen` | outcome revealed | `sfx.battle.victory/defeat/draw()` |
| `SleepModeOverlay` | overlay mounts | `sfx.sleepEnter()` |
| `ClosetScreen` | item equipped | `sfx.clothingEquip()` |
| `ProfileScreen` | profanity filter fail | `sfx.profanityReject()` |
| `ProfileScreen` | monster renamed | `sfx.monsterRename()` |
| `ProfileScreen` | brain swap confirmed | `sfx.brainSwap()` |
| `ProfileScreen` | delete account tap | `sfx.warning()` |
| `AddFriendModal` | friend request sent | `sfx.friendAdded()` |

### Particle System

GPU-accelerated particle effects via `@shopify/react-native-skia`. All particle math runs on the UI thread (zero JS frame budget consumed during animation).

**Architecture pattern:**
```
useSharedValue(time) ← useFrameCallback (UI-thread clock)
     ↓
useDerivedValue → computes SkPath (all particles as addCircle calls = 1 draw call per color)
     ↓
<Canvas pointerEvents="none"><Path path={sharedValue} /></Canvas>
```

**Files:** `src/components/particles/`
| File | Purpose |
|------|---------|
| `themeParticles.ts` | `ParticleTheme` type + `STEAM_THEME`/`CHEM_THEME` palettes + `getParticleTheme()` |
| `HomeParticleOverlay.tsx` | XP burst, ambient monster orbit, category orbital rings, all-complete celebration |
| `BattleParticleOverlay.tsx` | Per-turn battle effects between monster avatars (attack/heal/defense/buff/special) |
| `ResultParticleOverlay.tsx` | Full-screen victory/defeat/draw effects on BattleResultScreen |
| `index.ts` | Barrel exports for all overlays + layout types |

**Theme colors (both palettes):**
- Steam: spark=`#FFD700` brass, secondary=`#CD853F` copper, ambient=`#B8860B`, glow=`#FFA500`
- Chem: spark=`#00FF88` acid green, secondary=`#00C8FF` cyan, ambient=`#7FFF00`, glow=`#00FF88`
- Action type colors are shared: attack=`#FF4422`, heal=`#44DD88`, defense=`#00C8FF`, buff=`#E8C84A`, special=`#CC44FF`

**HomeScreen effects:**
- **XP burst** — 18 particles from XP bar center, 1.4s one-shot, triggered by `xpBurstKey` prop increment on habit completion
- **Ambient** — 10 particles slow-orbiting monster center, continuous loop, 25% opacity
- **Category orbital** — 8 particles orbiting each completed category circle, plays 15s then fades; static Skia concentric-ring glow persists for completed categories
- **All-complete celebration** — 60-particle upward fountain, 4.2s, fires when all 6 categories complete for the day
- Category positions measured via `measureInWindow()` → passed as `categoryLayouts: Partial<Record<string, HomeLayoutPoint>>`

**BattleReplayScreen effects:**
- Canvas sized to `headerHeight` only (measured from `hpSection`) — overlays monster area, not action log
- Effect fires in same `useEffect` that advances `currentIndex` (same timing as sound)
- Per-action-type effects: attack/dot = spark projectile + impact shockwave ring; heal = rising orbs from target; defense = 3 expanding rings; buff = sparkle orbit; special = magenta beam + impact burst
- `actorIsLeft` flag reverses `fromX`/`toX` so effects always travel in the right direction

**BattleResultScreen effects:**
- Full-screen `Canvas style={StyleSheet.absoluteFill}` over the result ScrollView
- victory: 55-particle looping fountain (3.2s loop) from screen center + 30-particle confetti rain from top (4s loop)
- defeat: 45 falling red embers with flicker effect (3.6s loop), dual-pass red + grey
- draw: split teal (left half) + purple (right half) radial burst from center, 28 particles each, 2.8s loop

**Performance notes:**
- Single `Path` per color group — all particles in one draw call (do not render individual `<Circle>` per particle)
- `useDerivedValue` runs on UI thread — no JS bridge crossing during animation
- Target: 2020+ Android (Snapdragon 865+) / iOS (A14+). Keep particle counts ≤ 60 per path for sustained 60fps.
- `pointerEvents="none"` on all Canvas overlays — never block touch

### Dynamic Theming
`useTheme()` returns active palette (`COLORS` or `COLORS_CHEM`) based on circle style. All themed screens use `useMemo(() => makeStyles(colors), [colors])` — never module-level `StyleSheet.create`. Cast `as unknown as typeof COLORS` avoids TS literal-type mismatches.

**Circle style toggle:** Profile → "STEAM LAB" / "CHEM LAB". AsyncStorage key `@habitbeast/circleStyle`, type `'steam' | 'chem'` (old `'gauge'`/`'jar'` values auto-migrate).

### Navigation Structure

```
RootNavigator
├── AuthNavigator (Login, SignUp, ForgotPassword)
├── OnboardingNavigator (Welcome, ResetTime, HabitSelection, OnboardingComplete)
└── AuthenticatedAppShell (AppStack)
    ├── MainTabs (BottomTabNavigator)
    │   ├── Home (HomeScreen)          ← default landing after login/onboarding
    │   ├── Habits (HabitsNavigator: HabitsList → HabitDetail → AddHabit → CreateCustomHabit)
    │   ├── Battle (BattleNavigator: BattleHub → BattleArsenal → BattleChallenge → BattlePrep → BattleResult → BattleReplay)
    │   ├── Leaderboard (LeaderboardScreen)
    │   └── Profile (ProfileNavigator: ProfileMain → MonsterRecord)
    ├── FoodFlow (Modal — FoodNavigator: FoodPicker → FoodServing → AddFood)
    └── AdminFoodReview (Modal)
```

### HomeScreen Layout
```
┌─────────────────────────────────────┐
│  MonsterName           Lvl 12       │
│  [Badge][Badge][Badge]              │
├─────────────────────────────────────┤
│  ○ Exercise   🦖   ○ GenHealth      │
│  ○ Cleanliness     ○ Community      │
│  ○ Creativity      ○ MentalHealth   │
├─────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓░ Water: 60oz/64oz        │
│  ▓▓▓▓▓▓▓▓░░ Calories: 450/500       │
│  ▓▓▓▓▓▓▓░░░ Protein: 12g/15g        │
│                                     │
│  [+ LOG FOOD]                       │
│                                     │
│  TODAY'S HABITS                     │
│  [Planks][Walk][Biking][Gym]        │
│  [✓Read][Water]                     │
└─────────────────────────────────────┘
│  [Home] [Habits] [Battle] [Me]      │
```

**Habit Chips:** Active habits render as compact chips, 4 per row, flexWrap. Tapping opens `HabitQuickCompleteModal` (`src/components/game/HabitQuickCompleteModal.tsx`) — bottom-sheet with full per-habit completion logic (boolean, numeric, biking tabs, reading book tracking, gym sets builder, social platform picker, avoidance tally, meals weight entry). Numeric habits show 3 quick-select value chips (recent history + sensible defaults). Timer-eligible habits (walking, running, planks, dead_hang, stretching, meditation, music, art_time, any custom duration habit) show an inline `HabitTimer` stopwatch.

**Level-up overlay (HomeScreen):** When a level-up is detected the overlay captures a stats snapshot at trigger time — `levelUpStats: { level, totalXP, battleWins, longestStreak, habitDays, activeHabits }` — and displays it alongside the new level number. Snapshot is frozen at capture so the overlay stays stable even if the Firestore subscription fires mid-animation. `haptics.levelUp()` fires on level-up.

**Rivals panel (HomeScreen):** Rendered below the macro bars. Powered by `useTopLeaderboardStats` — shows the user's top 2 habits by current streak, each with a rival from the leaderboard (player immediately ahead or behind). Displays rival's monster name, their streak value, and the gap. Only visible when `leaderboardOptIn=true` and the user has active habits. Currently ranks habits by **streak only** (other metrics removed in v1.4.2).

**MonsterRecordScreen (`src/screens/profile/MonsterRecordScreen.tsx`):** Character sheet with monster header, combat stat bars, battle record, per-habit heatmaps (`HabitHeatmap` — 52×7 GitHub-style grid, tier-based opacity), weight sparkline (scientific mode), share via `react-native-view-shot`. Entry points: Profile → MONSTER RECORD button, or tap monster avatar on HomeScreen.

---

## Battle Configuration

**Firestore document:** `battleConfig/settings`

```json
{
  "version": "1.0.0",
  "baseHPMultiplier": 1,
  "baseAPMultiplier": 1,
  "poolSizeMultiplier": 2,
  "loadoutSizeMultiplier": 0.5,
  "loadoutCap": 10,
  "statScaling": {
    "power": 0.5, "endurance": 0.3, "precision": 0.4,
    "synergy": 0.3, "adaptability": 0.2
  },
  "precisionAccuracyBonus": 1,
  "precisionCritBonus": 1,
  "defenseMultiplier": 2,
  "enduranceAPReduction": 0,
  "synergyComboBonus": 0.1,
  "criticalHitMultiplier": 1.5,
  "ratingKFactor": 32,
  "ranked": {
    "maxPerDay": 2, "maxActive": 1,
    "levelBracketRange": 100,
    "levelBracketRangeBelow10": 3,
    "levelBracketRangeBelow20": 6,
    "levelBracketRangeBelowThirty": 10
  },
  "friendly": { "maxPerDay": -1, "maxActive": 3, "requireFriendship": true }
}
```

**Resource formulas (Level 10 example):**
| Resource | Formula | L10 value |
|----------|---------|-----------|
| HP | `level × baseHPMultiplier` | 10 HP |
| Max pool | `level × poolSizeMultiplier` | 20 actions |
| Max loadout | `min(level × loadoutSizeMultiplier, loadoutCap)` | 5 actions |

The `battleEngine.ts` uses default values for all fields if the Firestore document is missing.

---

## Monetization

> ✅ **SHIPPED in v2.9.2 (May 2026)** — RevenueCat fully integrated. Both platforms configured. Webhook live. All existing users grandfathered as Founders.

### Model — Freemium

HabitBeast is a **free download with a level-9 cap**. Players experience the full game loop up to level 9 at no cost. The paywall triggers when the player would advance to level 10.

**Free tier (levels 0–9):**
- Full onboarding and all 6 habit categories
- Up to 6 active habits
- Friendly battles only
- Food & water logging
- Clothing items unlocked at levels 1–9
- Leaderboard participation

**Beast Mode (level 10+) — unlocks everything:**
- Unlimited level progression
- Ranked battles + ELO rating
- Unlimited active habits (level-scaled)
- Doctor's Lab custom habits
- Scientific mode / TDEE body profile
- All future clothing and cosmetics

### Pricing

| Plan | Price | Notes |
|---|---|---|
| Monthly Beast | $4.99/mo | — |
| Yearly Beast | $49.99/yr (~$4.17/mo) | ~17% discount vs monthly |
| Founding Beast | $149.99 one-time | Permanent lifetime access |

No free trial. Levels 0–9 are free forever.

### IAP Stack — RevenueCat ✅ LIVE

**Library:** `react-native-purchases` v10 + `react-native-purchases-ui`

**RC Project:** `proj13885e72` — "Habit Beast: Monster Trainer"

**Entitlement ID:** `Habit Beast: Monster Trainer Pro`

**Apps configured:**
- HabitBeast Android (`com.socialsin.habitbeast`) — service account credentials, Google Play API verified ✅
- HabitBeast iOS (`com.socialsin.habitbeast`) — p8 key uploaded ✅

**Products (RC Offering: "Dr. Frankenschtein" — default):**
| Package | Android | iOS |
|---|---|---|
| Monthly (`$rc_monthly`) | `beast_mode:monthly-beast` | `monthly_sub` |
| Yearly (`$rc_annual`) | `beast_mode:yearly-beast` | `yearly_sub` |
| Lifetime (`$rc_lifetime`) | `founding_beast` | `founding_beast` |

**Webhook:** `onrevenuecat` CF — receives all RC events, validated via `REVENUECAT_WEBHOOK_SECRET` ✅

**SDK keys:** `RC_IOS_API_KEY` (`appl_...`) and `RC_ANDROID_API_KEY` (`goog_...`) in `src/constants/subscription.ts`

RevenueCat handles:
- App Store + Play Store receipt validation
- Entitlement management
- Subscription lifecycle webhooks → Firestore `subscriptionStatus` updates
- Cross-platform restore purchases

### Subscription Status on User Doc

`User.subscriptionStatus` values:
- `'free'` — default for new signups
- `'active'` — paying subscriber (monthly or yearly)
- `'grace'` — subscription lapsed, 7-day grace window before downgrade
- `'founder'` — lifetime Founding Beast purchase OR manually grandfathered (permanent, never expires)

`subscriptionStatus` is written **only by the `onrevenuecat` webhook CF** — never by the client. `subscriptionOverride: true` protects founders from any RC event overwriting their status.

### Existing User Migration (v2.9.2 — COMPLETE ✅)

All 31 accounts existing before v2.9.2 received `subscriptionStatus: 'founder'` + `subscriptionOverride: true` via the `grantfounderaccess` HTTP CF (deployed May 2026, ran once).

**To grandfather future users:** POST to `grantfounderaccess` with `{"userIds": ["uid1", ...]}` or `{"all": true}`.

### `useSubscription` Hook

`src/hooks/useSubscription.ts` — derives subscription state from Firestore `user` doc only (no SDK calls at render time):
- `hasFullAccess` — true for `active`, `founder`, `grace` (within window), or `subscriptionOverride`
- `isAtCap` — free user at or above `FREE_CAP_LEVEL` (9)
- `displayLevel` — capped at 9 for free users at cap
- `subscriptionStatus` — typed `'free' | 'active' | 'grace' | 'founder'`

### Profile Screen Subscription Card

Three states shown in Profile tab:
- `'founder'` → "★ FOUNDING BEAST" — lifetime copy, no manage button
- `'active'` → "✓ BEAST MODE" — MANAGE SUBSCRIPTION button → RC Customer Center
- `'grace'` → "⚠ GRACE PERIOD" — RENEW NOW button
- `'free'` → "FREE — LEVELS 1–9" — ⚗ UPGRADE BEAST button → RC paywall

---

## Freemium Architecture — v3.0.0

This section specifies the full implementation plan for the paywall system. All items here are **blocking for v3.0.0 release**.

### Entitlement Check Pattern

Every screen or action that requires Beast Tier checks `user.subscriptionStatus`:

```typescript
// src/utils/entitlement.ts
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'cancelled' | 'expired' | 'grandfathered';

export function isBeastTier(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trial' || status === 'cancelled' || status === 'grandfathered';
}

export const FREE_LEVEL_CAP = 5;

export function isAtFreeCap(level: number, status: SubscriptionStatus): boolean {
  return !isBeastTier(status) && level >= FREE_LEVEL_CAP;
}
```

### Paywall Trigger — Level Cap

The paywall fires when a habit completion would push the user from level 5 to level 6.

**Client-side gate (`HabitService.completeHabit`):**
```
if (isAtFreeCap(currentLevel, user.subscriptionStatus) && newLevel > FREE_LEVEL_CAP) {
  → do NOT write XP increment
  → emit PAYWALL_TRIGGERED event
  → navigate to PaywallScreen (via navigationRef)
  → still write the habitLog, award the battleAction, mark isCompleted — only XP is withheld
}
```

The habit completion itself is NOT blocked — the user gets the satisfaction and the action. Only level advancement is gated.

**Server-side gate (`onHabitComplete` CF):**
The CF must also check `subscriptionStatus` before writing `cumulativePoints`. See [Security Audit](#security-audit--v300-prerequisites) for why client-only gating is insufficient.

### Paywall Screen (`src/screens/paywall/PaywallScreen.tsx`)

- **Trigger:** Navigated to via `navigationRef` from any paywall event (level cap, ranked battle attempt, leaderboard opt-in attempt)
- **Design:** Full-screen modal over the game. Monster avatar prominent. Lab assistant voice: *"Dahling, ze monster has outgrown ze free laboratory. Zis... requires an upgrade."*
- **CTAs:** "START FREE TRIAL (7 DAYS)" (primary) + "SUBSCRIBE NOW" (secondary showing monthly/annual toggle)
- **Restore:** Small "Restore Purchases" text link
- **Dismiss:** X button returns to game (user stays at level 5 free)

### Paywall Trigger Points (all routes to `PaywallScreen`)

| Trigger | Context | Action if blocked |
|---|---|---|
| Level 5 → 6 XP threshold | `HabitService.completeHabit()` | Emit event; habit still completes; XP withheld |
| Ranked battle attempt | `BattleChallengeScreen` | Show paywall before battle creation |
| Leaderboard opt-in | `ProfileScreen` | Show paywall |
| Add 5th+ habit | `HabitService.addHabit()` (level 5+) | Show paywall |
| Doctor's Lab (custom habit) | `CreateCustomHabitScreen` | Show paywall |

### RevenueCat Integration

**Install:**
```bash
npm install react-native-purchases
cd ios && pod install
```

**Init (`App.tsx`):**
```typescript
import Purchases from 'react-native-purchases';
Purchases.configure({ apiKey: Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY });
```

**Entitlement check (real-time, replaces local `subscriptionStatus` for hard gates):**
```typescript
const { entitlements } = await Purchases.getCustomerInfo();
const hasBeastTier = entitlements.active['beast'] !== undefined;
```

**On purchase success:**
1. RevenueCat validates receipt with Apple/Google
2. RevenueCat fires webhook to our CF (`onrevenuecat` HTTP function)
3. CF writes `subscriptionStatus: 'active'` (or `'trial'`) to user doc
4. `AuthContext` subscription fires → UI updates instantly

**Webhook CF (`onrevenuecat` HTTP endpoint):**
```
POST /onrevenuecat
Body: RevenueCat webhook payload
→ validate HMAC signature
→ map event type to subscriptionStatus:
   INITIAL_PURCHASE / RENEWAL → 'active'
   TRIAL_STARTED → 'trial'
   TRIAL_CONVERTED → 'active'
   CANCELLATION (within period) → 'cancelled'
   EXPIRATION → 'expired'
   REFUND → 'expired'
→ write to /users/{userId}.subscriptionStatus via Admin SDK
```

### Firestore User Doc Changes for v3.0.0

| Field | Old value | New value | Notes |
|---|---|---|---|
| `subscriptionStatus` | `'active'` (hardcoded) | `'free'` (new users) / `'grandfathered'` (existing) | Written only by CF webhook |
| `subscriptionTier` | `1` (unused) | Removed or repurposed as `0=free, 1=monthly, 2=annual` | |
| `revenueCatUserId` | — | `string` | Set at first RC identify call; used for webhook user lookup |

### Migration Script — Grandfathered Users

One-time HTTP endpoint `POST /migrategrandfatheredusers`:
- Pages through all `users` documents (bots excluded)
- Sets `subscriptionStatus: 'grandfathered'` on any user where status is currently `'active'` or `'trial'` (legacy hardcoded values)
- Idempotent — safe to re-run (skips `'grandfathered'` users)
- Run once before v3.0.0 goes live on both stores

---

## Security Audit — v3.0.0 Prerequisites

These issues must be resolved before a monetized launch. An app where users can self-award XP to bypass a paywall will be exploited immediately.

### CRITICAL — Client-Side XP/Level Writes

**Severity:** Critical — breaks paywall integrity

**Issue:** `HabitService.completeHabit()` calls `increment(boostedPoints)` on `cumulativePoints` and `categoryPoints` directly from the client. The Firestore security rule `allow write: if isOwner(userId)` permits any authenticated user to write any value to their own doc, including `cumulativePoints: 9999` or `currentLevel: 99`.

A user with a rooted device or a network proxy (e.g. Charles Proxy) can intercept the SDK call and replay it with an arbitrary increment, advancing their level past the free cap for free.

**Required fix before v3.0.0:**
1. Remove `cumulativePoints` and `categoryPoints` increments from `HabitService.completeHabit()` — client stops writing these fields entirely.
2. Extend `onHabitComplete` Cloud Function (which already fires on `habitLogs` creation) to compute and write all XP/points. CF already receives the `habitType`, `tierLevel`, and `pointsAwarded` from the log doc.
3. The CF checks `subscriptionStatus` before writing XP that would advance past `FREE_LEVEL_CAP`.
4. Client still reads `user.cumulativePoints` and `user.currentLevel` for display — it just no longer writes them.
5. Add a Firestore rule that **denies writes** to `cumulativePoints`, `currentLevel`, `categoryPoints`, and `combatStats` from the client:

```javascript
match /users/{userId} {
  allow read: if isAuthenticated();
  allow update: if isOwner(userId) &&
    !('cumulativePoints' in request.resource.data.diff(resource.data).affectedKeys()) &&
    !('currentLevel' in request.resource.data.diff(resource.data).affectedKeys()) &&
    !('categoryPoints' in request.resource.data.diff(resource.data).affectedKeys()) &&
    !('combatStats' in request.resource.data.diff(resource.data).affectedKeys()) &&
    !('battleStats' in request.resource.data.diff(resource.data).affectedKeys()) &&
    !('subscriptionStatus' in request.resource.data.diff(resource.data).affectedKeys());
}
```

**Tradeoff:** Level-up detection (currently in `HomeScreen` via a `prevLevelRef` comparison) must shift to listening for CF-driven changes — the client just reacts to the new `currentLevel` arriving via the `AuthContext` subscription. Level-up animation timing may need a short delay.

### CRITICAL — subscriptionStatus Writable by Client

**Severity:** Critical — breaks paywall integrity

**Issue:** `subscriptionStatus` is on the user doc and `allow write: if isOwner(userId)` lets any user set `subscriptionStatus: 'active'` or `'grandfathered'` to bypass the paywall immediately.

**Required fix:** The Firestore rule above (blocking `subscriptionStatus` writes from client) covers this. Only the RevenueCat webhook CF (which uses Admin SDK, bypassing rules) should write this field.

### HIGH — BattleChallenge Update Rule Too Permissive

**Severity:** High — allows status/result manipulation

**Issue:**
```javascript
allow update: if isAuthenticated() &&
  (request.auth.uid == resource.data.challenger ||
   request.auth.uid == resource.data.opponent);
```
Any party can update **any field** on a `battleChallenges` doc. A user could set `winner` to themselves, flip `status` to `completed`, or write `ratingChanges` before the CF runs.

The battle engine CF runs via Admin SDK (bypasses rules) and overwrites these fields — so in practice the window for exploitation is tiny. But `status` manipulation could cause double-processing or CF skips.

**Required fix:** Restrict the update rule to the two legitimate client writes:
```javascript
allow update: if isAuthenticated() && (
  // Opponent accepting: write opponentLoadout + status only
  (request.auth.uid == resource.data.opponent &&
   resource.data.status == 'pending' &&
   request.resource.data.status == 'ready_both') ||
  // Challenger cancelling: status only, only from pending
  (request.auth.uid == resource.data.challenger &&
   resource.data.status == 'pending' &&
   request.resource.data.status == 'cancelled')
);
```

### MEDIUM — isAdmin() Rule Triggers Extra Document Reads

**Severity:** Medium — Firestore cost at scale

**Issue:** The `isAdmin()` helper does a `get()` call every time an admin-gated resource is read:
```javascript
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```
Food library reads (which everyone does) call `canSubmitFood()` which is similar. Each read hits Firestore.

**Required fix:** Use **Firebase Auth Custom Claims**. Set `isAdmin: true` as a custom claim via Admin SDK when granting admin. Rules become:
```javascript
function isAdmin() { return request.auth.token.isAdmin == true; }
```
No document read; claim is embedded in the auth token. Update the `UserService.setAdminClaim(uid)` helper (to be written) that calls Admin SDK `auth.setCustomUserClaims()`.

### MEDIUM — Leaderboard CF Scale Issue

**Severity:** Medium — will become a billing problem above ~5K MAU

**Issue:** `updatedetailedleaderboards` (hourly) paginates ALL opted-in users, then fetches ALL `habitLogs` per user to compute the `days` metric. At 10K users with 180 days of logs and 10 habits each: **18 million document reads per hour**.

**Required mitigations (before large-scale launch):**
1. Move the `days` counter to an **incrementing field** on `UserHabit` (`totalCompletionDays`) — already exists. Use this field instead of scanning `habitLogs`. The field is best-effort now; CF should maintain it authoritatively after this change.
2. Add a `leaderboardLastUpdated` timestamp on each user doc; only re-score users active in the last 48h.
3. Consider moving to Firestore triggers per habit completion (incremental updates) instead of full hourly scans.

### LOW — Friendship Update Permissiveness

**Severity:** Low

**Issue:** `allow update, delete: if isAuthenticated() && request.auth.uid in resource.data.userIds` lets either friend update any field — including `requestedBy`, `status` back to `pending`, or `requestedByEmail`.

**Required fix:** Restrict to the two legitimate updates:
```javascript
allow update: if isAuthenticated() && request.auth.uid in resource.data.userIds &&
  // Only allow accepting or declining — status transitions only
  request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'acceptedAt']);
```

### Pre-v3.0.0 Security Checklist

- [ ] XP/level writes moved from `HabitService.completeHabit()` to `onHabitComplete` CF
- [ ] Firestore rule blocking client writes to `cumulativePoints`, `currentLevel`, `categoryPoints`, `combatStats`, `battleStats`, `subscriptionStatus`
- [ ] `battleChallenges` update rule restricted to opponent-accept and challenger-cancel only
- [ ] RevenueCat webhook CF (`onrevenuecat`) deployed; HMAC signature validation in place
- [ ] `migrategrandfatheredusers` script run on production before launch
- [ ] `isAdmin()` rule migrated to Custom Claims (can be done post-launch but do before food library scales)
- [ ] PaywallScreen implemented and connected to all 5 trigger points

---

## iOS Build — Xcode 26 + Firebase 12.8.0 Compatibility Fixes

**Context:** v1.1.5 build 5 (first iOS App Store submission, March 2026). All fixes are encoded in the `post_install` hook in `ios/Podfile` and re-applied automatically on every `pod install`.

### Root Cause: `_DarwinFoundation1` Cascade

iOS 26 SDK: compiling UIKit **as a module** (`CLANG_ENABLE_MODULES=YES`) triggers:
```
_DarwinFoundation1 → CoreFoundation → Foundation → _Builtin_stdbool
```
A **textual** UIKit include (`CLANG_ENABLE_MODULES=NO`) is safe.

### Fix 1: Per-Pod Module Compilation Flags

**Problem:** React Native pods import `RCTBridgeModule.h` which imports UIKit. With `CLANG_ENABLE_MODULES=YES`, this triggers the cascade.

**Fix:** Post_install hook sets `CLANG_ENABLE_MODULES = NO` for all RN/RNFB pods, keeps it `YES` for Firebase/Google pods. Also sets `GCC_PRECOMPILE_PREFIX_HEADER = NO` for all pods.

### Fix 2: Firebase.h — Swift-Only Method Exposure

**Problem:** Firebase 12.8.0 moved ObjC-callable methods to Swift-only implementations in `*-Swift.h` headers. RNFB pods need them but importing `*-Swift.h` with `modules=ON` triggers UIKit cascade.

**Fix:** `ios/Pods/Firebase/CoreOnly/Sources/Firebase.h` — wrap Swift header imports in `#if !__has_feature(objc_modules)`:

```objc
#if __has_include(<FirebaseAuth/FirebaseAuth.h>)
  #import <FirebaseAuth/FirebaseAuth.h>
  #if __has_include("FirebaseAuth-umbrella.h")
    #if !__has_feature(objc_modules) && __has_include("FirebaseAuth-Swift.h")
      #import <UIKit/UIKit.h>   // textual include — safe with modules=OFF
      #import "FirebaseAuth-Swift.h"
    #endif
  #endif
#endif

#if !__has_feature(objc_modules) && __has_include("FirebaseFunctions-Swift.h")
  #import "FirebaseFunctions-Swift.h"
#endif
#if !__has_feature(objc_modules) && __has_include("FirebaseStorage-Swift.h")
  #import "FirebaseStorage-Swift.h"
#endif
```

### Fix 3: Swift Compatibility Header Search Paths

**Problem:** `*-Swift.h` files are generated at build time in a non-standard path:
```
${PODS_CONFIGURATION_BUILD_DIR}/<Target>/Swift Compatibility Header/<Target>-Swift.h
```

**Fix:** Post_install hook appends to `HEADER_SEARCH_PATHS` in all 16 RNFB xcconfigs:
```
"${PODS_CONFIGURATION_BUILD_DIR}/FirebaseAuth/Swift Compatibility Header"
"${PODS_CONFIGURATION_BUILD_DIR}/FirebaseFunctions/Swift Compatibility Header"
"${PODS_CONFIGURATION_BUILD_DIR}/FirebaseStorage/Swift Compatibility Header"
```

### Fix 4: Module Map Conflicts (Xcode 26 Explicit Module Scanner)

**Problem:** Duplicate module names (`ReactCommon`, `react_runtime`) across module maps. Two module maps in same directory both had `umbrella header` directives.

**Fix:** Rewrite conflicting module maps with unique names and plain `header`:

`React-RuntimeApple.modulemap`:
```
module React_RuntimeApple {
  header "React-RuntimeApple-umbrella.h"
  export *
}
```

`React-jsitooling.modulemap`:
```
module React_jsitooling {
  header "React-jsitooling-umbrella.h"
  export *
}
```

### Fix 5: FirebaseFirestoreInternal Linker Error

**Problem:** Firebase 12.8.0's podspec declares `weak_frameworks: FirebaseFirestoreInternal` but it's a static library, not a framework.

**Fix:** Post_install hook strips `-weak_framework "FirebaseFirestoreInternal"` from `Pods-habitBeast.{debug,release}.xcconfig`.

### Fix 6: Missing Framework Linker Flags

**Problem:** `react-native-reanimated` needs CoreMotion; `RNFBApp`/`RNFBStorage` need Photos — not declared in their podspecs.

**Fix:** Post_install hook appends to `OTHER_LDFLAGS` in `Pods-habitBeast.{debug,release}.xcconfig`:
```
-framework "CoreMotion" -framework "Photos"
```

### Fix 7: GoogleService-Info.plist Path

**Problem:** Xcode project reference had wrong path for `GoogleService-Info.plist`.

**Fix:** Updated `ios/habitBeast.xcodeproj/project.pbxproj`:
```
path = "habitBeast/GoogleService-Info.plist";
```

### Summary

| # | Issue | Fix |
|---|-------|-----|
| 1 | `_DarwinFoundation1` cascade | `CLANG_ENABLE_MODULES=NO` for RN/RNFB pods; `GCC_PRECOMPILE_PREFIX_HEADER=NO` all pods |
| 2 | Swift-only Firebase methods missing | Wrap `*-Swift.h` imports in `#if !__has_feature(objc_modules)` |
| 3 | `FirebaseAuth-Swift.h` not found | Add `Swift Compatibility Header` subdirs to `HEADER_SEARCH_PATHS` |
| 4 | Duplicate module names / umbrella conflict | Rename modules; use plain `header` not `umbrella header` |
| 5 | `FirebaseFirestoreInternal` linker error | Strip `-weak_framework "FirebaseFirestoreInternal"` |
| 6 | Undefined `CMMotionManager`, `PHAsset` | Add `-framework "CoreMotion" -framework "Photos"` |
| 7 | `GoogleService-Info.plist` not found | Correct path to `habitBeast/GoogleService-Info.plist` |

**v1.1.5 build 5 app store fixes (also applied):**
- iOS button display: `LinearGradient` used as `absoluteFillObject` background (text was invisible — button appeared as thin gold bar)
- `ReportService`: replaced `getDoc` read (blocked by `allow read: if isAdmin()` rule) with write-only pattern (try `updateDoc` → fallback `setDoc` on not-found)
- Added `ITSAppUsesNonExemptEncryption = false` to `Info.plist`

---

## v3.0 Release Readiness — Pre-Launch Audit (April 2026)

Full codebase audit completed before freemium launch. Issues ranked by severity. Work is organized into five phases (A–E). Phase A is complete; B–E are in progress.

### Phase A — Security & Rules ✅ DONE

| # | Issue | Fix |
|---|-------|-----|
| A1 | `scheduledAutoChallenges` collection had no Firestore rules — any authenticated user could forge auto-monster queue entries | Added `allow read, write: if false` — CF Admin SDK bypasses this rule; clients are blocked |
| A2 | `battleChallenges` read rule dereferenced `resource.data` without null guard — existence-check reads on non-existent docs would crash | Added `resource == null \|\|` guard to read rule |
| A3 | Friendly-battle rate-limit composite indexes — verified already present in `firestore.indexes.json` for `(type, status, challenger/opponent, completedAt)` | No change needed |

### Phase B — Backend Performance ✅ DONE

| # | Issue | Fix |
|---|-------|-----|
| B1 | `processhabitresets`: `db.collection('users').get()` — no pagination; will OOM/timeout at scale | Replaced with `for(;;)` cursor-paginated loop, 500 users/page; stops early if page < 500 |
| B2 | `updatedetailedleaderboards`: `habitLogs.get()` fetched **all logs ever** per user — at scale, millions of reads/hour | Removed `habitLogs` scan entirely; now reads `habit.totalCompletionDays` (already maintained atomically by `onhabitcomplete` CF) |
| B3 | `updatefriendgroupleaderboards`: one Firestore read per member per group | Replaced N individual `doc.get()` calls with `db.getAll(...refs)` — single batched RPC |
| B4 | `UserService.ts` TODO — combat stats used hardcoded scaling instead of `battleConfig` Firestore doc | Loads `battleConfig/settings` doc; merges `statScaling` from Firestore over local defaults (same pattern as battle engine CF) |

### Phase C — Eye System Refinement ✅ DONE

| # | Issue | Fix |
|---|-------|-----|
| C1 | Blink timer not restarting on expression change | `[shouldAnimate, expr]` dep array already correct; confirmed no drift |
| C2 | `openUp` phase not resetting on expression change | Phase effect now explicitly cancels `openUpTimerRef` and calls `setEyePhase(resolveEyeState(cfg.dominant, expr))` synchronously before scheduling next cycle |
| C3 | New eye types: `openWide`, `partialLeft`, `partialRight` | Added to `EyeState` type + `EYE_IMAGES` in `monsters.ts`; new `resolveEyeState()` function applies probabilistic selection on every phase transition — `openWide` 50% on excited / 20% on happy; `partialLeft`/`partialRight` 60% of all partial-phase transitions (random side) |
| C4 | Fart animation | Periodic sequence (3–7 min random interval) runs only on `enableFartAnimation` monsters. Sequence: `okay` mouth + `partialLeft` → `partialRight` × 2 → `closed` + `happy` mouth → fart frames 1–8 at 200 ms/frame → restore. All overrides clear on unmount. `enableFartAnimation` enabled on `HomeScreen` large avatar only. |

**Key files:** `src/components/monster/MonsterAvatar.tsx`, `src/constants/monsters.ts`, `src/assets/fart/` (8 frames), `src/assets/monsters/*/Eyes/*/` (7 states per monster)

### Phase D — App Polish ✅ DONE

| # | Issue | Resolution |
|---|-------|----------|
| D1 | `BattleHubScreen`: empty states shown during load | Already gated — skeleton loaders shown while `challengesLoading`/`historyLoading` |
| D2 | Silent `catch(() => {})` on priority dismissal in `HomeScreen` | Replaced with `console.warn` — background write, no user-facing toast needed |
| D3 | `handleDismissPriorityPrompt` / `handleGoToPriorities` missing `useCallback` | Already wrapped in `useCallback` with correct deps |
| D4 | `as any` navigation casts in `useNotifications.ts` (7 instances) and `MainNavigator.tsx` | `useNotifications.ts`: replaced with `CommonActions.navigate` dispatch; `MainNavigator.tsx`: explicit `'Home'`/`'Leaderboard'` cases |

### Phase E — Pre-release Hardening (IN PROGRESS — awaiting device/deploy)

- [x] `npm run build` — zero TypeScript errors ✅
- [x] Console output audit — zero `console.log` in app src; all `console.error`/`console.warn` are labeled catch-block errors with no PII ✅
- [x] Firestore rules review — all collections covered, null guards in place, catalog writes admin-only ✅
- [ ] `firebase deploy --only firestore` — push rules + indexes to production (**user action**)
- [ ] End-to-end smoke test on physical device: habit reset, leaderboard update, battle rate limiting, food submission (**user action**)
- [ ] Verify Crashlytics receiving data from physical device (**user action**)

---

## Roadmap

### Next — v3.0.0 Freemium Launch

**Target:** First monetized release. Free download, level-5 cap, `$4.99/mo` or `$34.99/yr` subscription to unlock full app.

**Blocking work (all items in [Security Audit](#security-audit--v300-prerequisites) checklist):**
1. Move XP/level writes from client (`HabitService`) to `onHabitComplete` CF
2. Add field-level Firestore rules blocking client writes to stat and subscription fields
3. Restrict `battleChallenges` update rule
4. RevenueCat integration + `onrevenuecat` webhook CF
5. `PaywallScreen` + entitlement check utility
6. `migrategrandfatheredusers` one-time script
7. Update signup to default `subscriptionStatus: 'free'`

**Optional (can ship without):**
- isAdmin Custom Claims migration
- Leaderboard incremental update optimization

### Completed — v3.0 Pre-Release Hardening (Phases A–C)

**Security (Phase A — deployed to production):**
- `scheduledAutoChallenges` Firestore rules added (`allow read, write: if false`) — previously unprotected, any authenticated user could forge auto-monster queue entries
- `battleChallenges` read rule null guard added — `resource == null` check prevents crash on existence-check reads against non-existent docs
- Friendly-battle rate-limit composite indexes verified present in `firestore.indexes.json`

**Backend performance (Phase B):**
- `processhabitresets`: replaced unbounded `db.collection('users').get()` with cursor-paginated `for(;;)` loop, 500 users/page — scales safely to any user base size
- `updatedetailedleaderboards`: removed full `habitLogs` scan (was millions of reads/hour at scale); now reads `habit.totalCompletionDays` maintained atomically by `onhabitcomplete` CF
- `updatefriendgroupleaderboards`: replaced N individual doc reads with `db.getAll(...refs)` — single batched RPC per group
- `UserService.calculateCombatStats`: resolved `// TODO` — now loads `statScaling` from `battleConfig/settings` Firestore doc, matching the battle engine CF

**Eye system (Phase C):**
- New eye states: `openWide` (wide-eyed surprise), `partialLeft`, `partialRight` (directional squints) — registered for all 8 monsters in `EYE_IMAGES`
- `resolveEyeState()` — probabilistic phase selection on every transition: `openWide` at 50%/20% for excited/happy; `partialLeft`/`partialRight` at 60% of all partial-phase moments (random side each visit)
- Phase cycling now explicitly cancels pending `openUp` timer and snaps to dominant on expression change — prevents rolled eyes persisting after mood shift
- Fart animation — periodic sequence (random 3–7 min) on main HomeScreen monster: `okay`+`partialLeft` → `partialRight` × 2 → `closed`+`happy` → 8 cloud frames at 200 ms/frame → restore. Full cleanup on unmount.
- `enableFartAnimation` prop on `MonsterAvatarDisplay` — opt-in, enabled only on HomeScreen large avatar

### Completed — v2.2.1 Polish & Bug Fixes

- Eye animation: separate PNG layer in MonsterAvatarDisplay with blink + mood-driven phase cycling
- Closet UI fix
- FriendService undefined bug fix
- Firestore rules update to allow friend requests

### Completed — Auto-Monster System (G-11, expanded H-2)

10 bot accounts (levels 0–9, covering every level) automatically challenge players at matching levels to improve engagement throughout the early and mid game. Bots live in the `users` collection, use the real battle engine, and are delivered via a `scheduledAutoChallenges` queue. Periodic re-challenge cadence is 24h. See [Auto-Monster System](#auto-monster-system) in Social System.

### Completed — Phase H-1: New Habits + Weekly System

26 new habits added across all 6 categories (see Phase H-1 table in habit catalog above). Weekly habit system introduced: `HabitDefinition.frequency?: 'daily' | 'weekly'`, `UserHabit.scheduledDays: number[]`, `HabitService.canCompleteHabit()` off-day guard, `processHabitResets` streak protection for non-scheduled days. 7-day reschedule cooldown (`lastScheduledDaysChangeDate`). `HabitCard` shows WEEKLY badge + off-day gray overlay. Weekly custom habits use `CUSTOM_BATTLE_ACTIONS_WEEKLY` (#213–#242) with 2× power.

BATTLE_ACTIONS total: **242**. `habitCatalog` total: **50 habits** (24 original + 26 Phase H-1).

### Completed — v1.4.2 Polish & Bug Fixes

- **Rivals panel streaks-only:** `useTopLeaderboardStats` now ranks habits by streak exclusively — multi-metric scoring removed for clarity.
- **Discipline stat fix:** `discipline` was excluded from `settings.statScaling` override path — now calculated correctly at all times.
- **Water/food reset bug fixed:** Race condition at midnight and at reset hour that could cause water and food logs to double-count or fail to reset resolved.
- **Battle engine tick fix:** DoT/HoT/self-DoT ticks now fire every turn (both active player's turn and opponent's turn), not just once per round.
- **Gear nav animation:** Animated transition added to the settings/gear navigation flow.
- **Habits prefill yesterday's data:** Quick-complete chips now prefill with yesterday's logged value as a default suggestion.
- **Tier unlock notification:** Banner notification dispatched when a habit tier unlock becomes available.
- **Multi-walk support:** Walking habit can now be completed multiple times per day (multi-log mode).
- **Clothing additions:** 4 new level-gated clothing items (baseballCap lvl 4, bellBottoms lvl 5, purpleVest lvl 7, redKicks lvl 9); `shoes` slot added.
- **Weight entry keyboard fix:** HomeScreen weight entry input no longer clips behind the software keyboard.

### Completed — Monster Mouth Expressions (G-10 partial)

- 8 base monster PNGs updated (mouths removed from base art)
- Mouth layer system: `Big/Mouths/` + `Small/Mouths/` assets, `getMouthImage()`, `MouthExpression` type
- `MoodEventContext` + `useMouthExpression` hook — base logic + 2-min temp overrides for battle/level-up
- `monster.mouthExpression` persisted on user doc; propagated to leaderboard CF entries; thumbnail recapture triggered on change

### Pending — Art Assets Integration (G-10 cont.)

**4 Battle Win Reward Items:** Add to `BATTLE_REWARD_CATALOG`. Awarded on ranked match win milestones.

**3 New Backgrounds:** Chem Lab, Steam Lab, Closet screen. Add to `src/assets/backgrounds/`. Integrate as selectable background via `user.backgroundId` or AsyncStorage.

**4 New Navigation Icons:** Replace tab bar icons for Habits, Battle, Leaderboard, Profile. Only the Monster/Home icon is currently satisfactory.

### Future Goals

**Gameplay Depth**
- Habit tier expansion — T3–T5 for currently shallow habits (many H-1 habits only have 2–3 tiers)
- Sleep habit — previous-night logging (duration, quality)
- Seasonal ranked ladders — reset ratings each season, special cosmetics for top finishers

**Social & Competitive**
- Friend groups — leaderboard groups (up to 5 members)

**Food & Nutrition**
- Photo food logging — camera → AI macro estimation
- Macro goal wizard — guided setup based on user goals (cut/maintain/bulk)

**Monetization & Growth (post-v3.0.0)**
- Referral system — free month for inviter + invitee on first subscribe
- Cosmetic shop — purchasable monster parts, victory animations (RevenueCat consumables)
- Annual plan promotional pricing — limited-time discounts to drive annual conversion
- Family plan (up to 5 users sharing one subscription)

**Platform Expansion**
- Watch platform support — see [Habit Quick Completion Streamlining](#habit-quick-completion-streamlining), [Wear OS Integration](#wear-os-integration--phase-w-1), and [watchOS Integration](#watchos-integration--phase-w-2) below

---

## Store Submission Checklist

### Google Play (Data Safety form)
- [ ] Declare **Device or other IDs** → FCM registration token collected and sent to Firebase
- [ ] Declare **App functionality** purpose for token collection
- [ ] Confirm data is not sold and is not used for tracking

### Apple App Store (Privacy Nutrition Label)
- [ ] Add **Device ID** under "Data Used to Track You" or "Data Linked to You" (FCM token)

### iOS Xcode Capabilities *(must be done on Mac)*
- [ ] Target → Signing & Capabilities → **+ Push Notifications**
- [ ] Target → Signing & Capabilities → **+ Background Modes** → check **Remote notifications**
- [ ] Run `cd ios && pod install` after adding capabilities

### Cloud Functions
- [ ] Verify `onbattlechallengecreated`, `onbattlecompleted`, `sendhabitreminders` deployed in Firebase Console
- [ ] Verify `processautomonsters`, `onusercreated`, `onuserupdate` deployed
- [ ] Run `POST /seedautomonsters` once per environment to create bot user docs

### v3.0.0 — Additional Checklist (IAP + Security)

**RevenueCat setup:**
- [ ] Create RevenueCat project at app.revenuecat.com; connect App Store + Play Store apps
- [ ] Create `"beast"` entitlement + `habitbeast_beast_monthly` + `habitbeast_beast_annual` products in RC
- [ ] Add RC API keys to `src/config/env.ts` (`RC_IOS_KEY`, `RC_ANDROID_KEY`)
- [ ] Set RevenueCat webhook URL to `https://us-central1-habitbeast-3f09d.cloudfunctions.net/onrevenuecat`
- [ ] Store RC webhook HMAC secret in Firebase Secret Manager; read in `onrevenuecat` CF

**App Store Connect:**
- [ ] Create `habitbeast_beast_monthly` subscription ($4.99/mo) under "Subscriptions"
- [ ] Create `habitbeast_beast_annual` subscription ($34.99/yr) under same group
- [ ] Add 7-day free trial offer on monthly product
- [ ] Update Privacy Nutrition Label: add **Purchases** under "Data Linked to You"
- [ ] Add "In-App Purchases" capability in Xcode project

**Google Play Console:**
- [ ] Create subscription products `habitbeast_beast_monthly` and `habitbeast_beast_annual`
- [ ] Add Real-time Developer Notifications topic in GCP → link to RevenueCat
- [ ] Update Data Safety: declare **Financial Info > Purchase history**

**Security (all from [Security Audit](#security-audit--v300-prerequisites)):**
- [ ] All 7 items on the Pre-v3.0.0 Security Checklist completed
- [ ] `migrategrandfatheredusers` run on production immediately before launch
- [ ] Confirm `subscriptionStatus` is `'free'` in `AuthService.createUserProfile()` (not `'active'`)

---

---

## Habit Quick Completion Streamlining

> **This is a prerequisite for both watch platform phases.** Watch screens are tiny and input is minimal — every habit completion flow must work with taps and simple +/− buttons before a watch interface can be built on top of it.

### Principle

Every habit type must have a **zero-keyboard completion path**. The current mobile UI already trends this direction (quick-select chips, boolean taps, timer stopwatch) but several flows still require free-text or complex input that would be unusable on a 40mm watch face.

### Required Work Per Habit Type

| Input Type | Current State | Required Change |
|---|---|---|
| **boolean** | Single tap — already watch-ready | None |
| **duration (timer)** | Inline stopwatch — already watch-ready | None |
| **duration (manual entry)** | Numeric keyboard + quick chips | Quick chips must be sufficient; no keyboard required |
| **volume (water)** | +{servingSize}oz button — already watch-ready | None |
| **reps** | Numeric keyboard + quick chips | +/− stepper with sensible default; chips as presets |
| **distance** | Numeric keyboard + quick chips | +/− stepper in 0.5-unit increments; chips as presets |
| **pages** | Numeric keyboard + quick chips | +/− stepper; chips as presets |
| **exercises (gym_rat)** | Full sets/reps builder | Watch: log as simple boolean ("did gym today"); full builder remains on phone |
| **meals** | Food picker modal (separate screen) | Watch: per-meal tap checkboxes only (simple mode); full food logging stays on phone |
| **weight entry (meals scientific)** | Numeric keyboard | Auto-populate yesterday's value; +/− buttons in 0.5lb increments; LOG button |
| **avoidance tally** | Single tap (already watch-ready) | None |
| **social_post (platform picker)** | Platform grid + count inputs | Watch: single tap logs "posted today"; detail entry stays on phone |

### Weight Entry Design (Specific)

The weight entry flow is the most data-entry-intensive habit input. To make it watch-compatible:

1. On open: pre-fill with yesterday's logged weight (or last known entry)
2. Display: large number, `−` button left, `+` button right, increment = 0.5 lbs (or 0.25 kg in metric)
3. Long-press +/− for fast scroll (1-unit jumps)
4. Single LOG button — no secondary confirmation
5. This same simplified UI should replace the current keyboard-first flow on mobile too (better UX regardless of watch)

### Watch-Readiness Checklist (Pre-Development Gate)

Before starting Phase W-1 (Wear OS), verify every active habit type has a zero-keyboard completion path on mobile. This is the acceptance criterion for watch readiness:

- [ ] All numeric inputs have +/− steppers with sensible defaults and increments
- [ ] Weight entry uses yesterday-prefill + stepper (no keyboard)
- [ ] Gym Rat: boolean fallback path exists (not just full builder)
- [ ] Meals: simple-mode per-meal tap works without entering the food picker
- [ ] Social Post: single-tap "logged today" path exists

---

## Wear OS Integration — Phase W-1

> **Status: Future.** Prerequisite: all items in the [Watch-Readiness Checklist](#watch-readiness-checklist-pre-development-gate) above are complete.

### Overview

A native Wear OS companion app installed alongside the main Android app. Allows users to log habits, tap water, and view today's progress directly from their wrist — without opening the phone.

### Architecture

**Platform:** Kotlin + Jetpack Compose for Wear OS. Added as a new `wear` module inside the existing `android/` project.

**Auth:** The phone app holds a valid Firebase Auth token. On app startup (and token refresh), the phone sends the current ID token to the watch via the **Wear Data Layer API** (`DataClient.putDataItem`). The watch caches it in `DataStore` and uses it for all Firestore REST calls. If no token is present, the watch shows "Open HabitBeast on your phone."

**Data access:** Firestore REST API (not the full Firebase SDK — smaller binary, works on Wear OS). All habit completions write directly to Firestore, triggering the same `onHabitComplete` Cloud Function as the phone. No custom backend changes required.

**Phone ↔ Watch sync:** Today's habits are synced to the watch as a serialized JSON payload via the Data Layer on app foreground and after each habit completion. The watch renders from this local cache — no live Firestore subscription on the watch itself.

### Scope (Phase W-1)

**Include:**
- Today's habit list (name, completion status, tier, category color)
- Tap to complete — boolean habits and timer habits (start/stop stopwatch)
- Water logging (tap to add one serving; current total shown)
- Avoidance tally (tap to record)
- Weight entry (yesterday-prefill + stepper, as described in streamlining section)
- Simple day progress summary tile (X of Y habits done)

**Exclude (phone only):**
- Food logging / food library search
- Gym Rat full sets builder
- Social post platform picker
- Battle system (view-only battle status notification is fine; no interaction)
- Leaderboard
- Settings / habit management

### Technical Components

| Component | Description |
|---|---|
| `wear/` Android module | New Gradle module alongside `app/`; shared `google-services.json` |
| `WearDataService.kt` (phone) | `WearableListenerService` — pushes habit data + auth token to watch on changes |
| `WearSyncReceiver.kt` (watch) | Receives Data Layer payloads; writes to local `DataStore` |
| Compose for Wear UI | `HabitListScreen`, `HabitCompleteScreen`, `WaterScreen`, `DaySummaryTile` |
| Firestore REST client | Kotlin `HttpURLConnection` + coroutine wrapper; reads cached token from `DataStore` |

### Distribution

Published as part of the same Google Play listing. Wear OS module auto-installs to paired watch when the phone app is installed.

---

## watchOS Integration — Phase W-2

> **Status: Future.** Prerequisite: Phase W-1 (Wear OS) shipped and validated. All items in the [Watch-Readiness Checklist](#watch-readiness-checklist-pre-development-gate) above complete.

### Overview

A native watchOS extension paired with the iOS app. Same scope as Phase W-1. watchOS is tackled second because it requires a Mac to build, involves a more complex bridging setup with React Native, and has additional App Store review overhead for watch apps.

### Architecture

**Platform:** Swift + SwiftUI. New watchOS Extension target added in Xcode alongside the existing `habitBeast` iOS target.

**Auth and data bridge:** watchOS cannot run the Firebase SDK. Two viable patterns:

1. **WatchConnectivity (preferred for Phase W-2):** iOS app holds the Firebase auth token. `WCSession` sends today's habit list and receives completion intents from the watch. The iOS app calls `HabitService` on behalf of the watch. The watch is a thin UI — no direct Firestore writes.

2. **Firebase REST (fallback):** Watch makes HTTP requests to Firestore REST API with a cached ID token. Token refreshed via `WCSession` when expired. More complex but lets the watch function when the phone is not nearby.

Phase W-2 will start with Pattern 1 (simpler, no token management on watch) and evaluate Pattern 2 if offline watch use becomes a user requirement.

**Native module bridge (iOS side):** A small React Native native module (`WatchBridgeModule`) exposes a method `sendHabitsToWatch()` that the JS layer calls after each habit completion and on app foreground. This keeps the bridge minimal — the RN app does not need to know about WatchConnectivity beyond triggering a sync.

### Scope (Phase W-2)

Identical to Phase W-1 scope. See [Wear OS — Scope](#scope-phase-w-1) above.

**Additional watchOS note:** A Complications API integration (watch face complication showing today's habit count) is a low-effort add-on once the core watch app is working.

### Technical Components

| Component | Description |
|---|---|
| `habitBeastWatch` Xcode target | watchOS Extension target in `ios/habitBeast.xcodeproj` |
| `WatchSessionManager.swift` (iOS) | `WCSessionDelegate` — sends habit data, receives completion messages |
| `WatchBridgeModule` (RN native module) | Thin Swift/ObjC bridge exposing `sendHabitsToWatch()` to JS |
| SwiftUI watch views | `HabitListView`, `CompleteHabitView`, `WaterView`, `DaySummaryView` |
| `HabitStore.swift` (watch) | Local state manager; receives `WCSession` messages; stores in `UserDefaults` |

### Distribution

watchOS Extension is bundled inside the main iOS `.ipa`. No separate App Store submission — the watch app appears automatically on Apple Watch when the phone app is installed. Requires the Xcode project to enable the watchOS capability and add the extension target to the build scheme.

---

*Document reflects codebase state as of March 2026. Update when making architectural changes — not as a development log.*

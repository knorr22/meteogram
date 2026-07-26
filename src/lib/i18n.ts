export type Lang = 'de' | 'en'

/**
 * Detect UI language. An explicit `?lang=de|en` query param wins (handy for
 * sharing / testing); otherwise it's the browser: German for any `de*` locale,
 * English for everything else.
 */
function detectLang(): Lang {
  const forced = new URLSearchParams(location.search).get('lang')?.toLowerCase()
  if (forced === 'de' || forced === 'en') return forced
  // Use the browser's PRIMARY preferred language only — a secondary German entry
  // on an otherwise-English browser should stay English.
  const primary = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase()
  return primary.startsWith('de') ? 'de' : 'en'
}

export const lang: Lang = detectLang()

/** BCP-47 locale used for Intl date formatting. */
export const locale = lang === 'de' ? 'de-DE' : 'en-US'

interface Strings {
  badge: string
  titleLine1: string
  titleLine2: string
  heroSub: string
  searchPlaceholder: string
  loading: string
  errorPrefix: string
  legendHigh: string
  legendLow: string
  legendBand: string
  hint: string
  empty: string
  footerPre: string
  footerPost: string
  today: string
  tipHigh: string
  tipLow: string
  tipPrecip: string
  precipTitle: string
  sourcesLabel: string
  sourcesAgree: (n: number) => string
}

const dict: Record<Lang, Strings> = {
  en: {
    badge: '14-day ensemble meteogram',
    titleLine1: 'Every model,',
    titleLine2: 'one forecast.',
    heroSub:
      'We pull the next two weeks from 12 official weather services, take the median, and show you exactly how much they disagree.',
    searchPlaceholder: 'Search a city…',
    loading: 'Gathering forecasts from every source…',
    errorPrefix: 'Failed to load forecast',
    legendHigh: 'High (median)',
    legendLow: 'Low (median)',
    legendBand: 'P10–P90 spread',
    hint: 'Hover or tap a day to see the model spread.',
    empty: 'Search for a city to build its 14-day ensemble meteogram.',
    footerPre: 'Data via',
    footerPost: '· median & P10–P90 computed across all sources.',
    today: 'Today',
    tipHigh: 'High',
    tipLow: 'Low',
    tipPrecip: 'Precip',
    precipTitle: 'Precipitation',
    sourcesLabel: 'official forecast sources',
    sourcesAgree: (n) => `${n} sources agree`,
  },
  de: {
    badge: '14-Tage-Ensemble-Meteogramm',
    titleLine1: 'Jedes Modell,',
    titleLine2: 'eine Vorhersage.',
    heroSub:
      'Wir laden die nächsten zwei Wochen von 12 offiziellen Wetterdiensten, bilden den Median und zeigen dir genau, wie stark sie sich uneinig sind.',
    searchPlaceholder: 'Stadt suchen…',
    loading: 'Vorhersagen aus allen Quellen werden gesammelt…',
    errorPrefix: 'Vorhersage konnte nicht geladen werden',
    legendHigh: 'Max (Median)',
    legendLow: 'Min (Median)',
    legendBand: 'P10–P90-Streuung',
    hint: 'Fahre über einen Tag oder tippe ihn an, um die Modellstreuung zu sehen.',
    empty: 'Suche eine Stadt für ihr 14-Tage-Ensemble-Meteogramm.',
    footerPre: 'Daten von',
    footerPost: '· Median & P10–P90 über alle Quellen berechnet.',
    today: 'Heute',
    tipHigh: 'Max',
    tipLow: 'Min',
    tipPrecip: 'Regen',
    precipTitle: 'Niederschlag',
    sourcesLabel: 'offizielle Vorhersagequellen',
    sourcesAgree: (n) => `${n} Quellen stimmen überein`,
  },
}

export const t: Strings = dict[lang]

// Reflect the chosen language on the document root for a11y / correct hyphenation.
if (typeof document !== 'undefined') document.documentElement.lang = lang

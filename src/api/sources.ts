import type { Source } from '../lib/types'

/**
 * Independent official forecast sources, each a numerical weather prediction
 * model run by a national/international meteorological service and exposed
 * through Open-Meteo's `models=` parameter. Add more here — the whole pipeline
 * (fetch, aggregate, legend) picks them up automatically.
 */
export const SOURCES: Source[] = [
  { id: 'ecmwf_ifs025', label: 'ECMWF IFS', org: 'ECMWF · Europe', flag: '🇪🇺' },
  { id: 'ecmwf_aifs025_single', label: 'ECMWF AIFS', org: 'ECMWF · AI model', flag: '🇪🇺' },
  { id: 'icon_seamless', label: 'ICON', org: 'DWD · Germany', flag: '🇩🇪' },
  { id: 'gfs_seamless', label: 'GFS', org: 'NOAA · USA', flag: '🇺🇸' },
  { id: 'gem_seamless', label: 'GEM', org: 'MSC · Canada', flag: '🇨🇦' },
  { id: 'meteofrance_seamless', label: 'ARPEGE', org: 'Météo-France', flag: '🇫🇷' },
  { id: 'ukmo_seamless', label: 'UM', org: 'UK Met Office', flag: '🇬🇧' },
  { id: 'jma_seamless', label: 'GSM', org: 'JMA · Japan', flag: '🇯🇵' },
  { id: 'bom_access_global', label: 'ACCESS-G', org: 'BOM · Australia', flag: '🇦🇺' },
  { id: 'cma_grapes_global', label: 'GRAPES', org: 'CMA · China', flag: '🇨🇳' },
  { id: 'knmi_seamless', label: 'HARMONIE', org: 'KNMI · Netherlands', flag: '🇳🇱' },
  { id: 'dmi_seamless', label: 'HARMONIE', org: 'DMI · Denmark', flag: '🇩🇰' },
  { id: 'metno_seamless', label: 'MEPS', org: 'MET Norway', flag: '🇳🇴' },
]

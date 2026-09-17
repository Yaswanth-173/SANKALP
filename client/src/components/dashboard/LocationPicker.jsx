import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { apiFetch } from '../../utils/api.js'
import { STATE_CITIES } from '../../data/indianCities.js'
import { LocationIcon, SearchIcon } from '../materials/materialIcons.jsx'
import { ChevronDownIcon } from './icons.jsx'
import Spinner from '../Spinner.jsx'

function LocationPicker() {
  const { user, setSession } = useAuth()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.entries(STATE_CITIES)
      .map(([state, cities]) => [state, q ? cities.filter((c) => c.toLowerCase().includes(q)) : cities])
      .filter(([, cities]) => cities.length > 0)
  }, [search])

  const handleSelect = async (city) => {
    setOpen(false)
    setSearch('')
    if (city === (user?.location || '')) return
    setSaving(true)
    try {
      const data = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: user?.fullName || '', phone: user?.phone || '', location: city }),
      })
      setSession(data.user)
    } catch {
      // Settings > Profile remains the fallback place to retry.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-ink/10 bg-navy-950/40 px-3.5 py-2.5 text-sm text-ink/70 transition-colors duration-200 hover:border-gold-500/30 hover:text-ink"
      >
        <LocationIcon className="h-4 w-4 shrink-0 text-gold-300" />
        <span className="flex-1 truncate text-left">{user?.location || 'Set your location'}</span>
        {saving ? (
          <Spinner className="h-3.5 w-3.5" />
        ) : (
          <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-ink/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 flex max-h-80 flex-col rounded-xl border border-ink/10 bg-navy-900 shadow-2xl">
            <div className="relative shrink-0 border-b border-ink/10 p-1.5">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or town…"
                className="w-full rounded-lg bg-navy-950/50 py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink/35"
              />
            </div>
            <div className="overflow-y-auto p-1.5">
              {filteredGroups.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-ink/40">No matches</p>
              )}
              {filteredGroups.map(([state, cities]) => (
                <div key={state}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink/35">{state}</p>
                  {cities.map((city) => (
                    <button
                      key={`${state}-${city}`}
                      type="button"
                      onClick={() => handleSelect(city)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                        city === user?.location ? 'bg-gold-500/10 text-gold-300' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LocationPicker

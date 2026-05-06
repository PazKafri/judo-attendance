import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#E24B4A','#639922']

const DEFAULT_GROUPS = [
  {id:1,name:"אשכול — א+",location:"אשכול",schedule:[],students:[]},
  {id:2,name:"אשכול — גן",location:"אשכול",schedule:[],students:[]},
  {id:3,name:"בן צבי — א+",location:"בן צבי",schedule:[],students:[]},
  {id:4,name:"באר יעקב — גן",location:"באר יעקב",schedule:[],students:[]},
  {id:5,name:"באר יעקב — א",location:"באר יעקב",schedule:[],students:[]},
  {id:6,name:"באר יעקב — ב׳-ג׳",location:"באר יעקב",schedule:[],students:[]},
  {id:7,name:"באר יעקב — נבחרת צעירה",location:"באר יעקב",schedule:[],students:[]},
  {id:8,name:"באר יעקב — נבחרת בוגרת",location:"באר יעקב",schedule:[],students:[]},
]

function migrate(state) {
  state.groups.forEach(g => {
    if (!g.schedule) {
      const days = g.days || []
      const time = g.time || ''
      g.schedule = days.map(d => ({ day: d, time }))
      delete g.days
      delete g.time
    }
  })
  return state
}

function loadLocalState() {
  try {
    const s = localStorage.getItem('judo_v1')
    if (s) return migrate(JSON.parse(s))
  } catch {}
  return { groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)), attendance: {}, nextId: 20 }
}

export function consecutiveAbsences(state, gid, sid) {
  const keys = Object.keys(state.attendance)
    .filter(k => k.startsWith(gid + '-')).sort().reverse()
  let streak = 0
  for (const k of keys) {
    const r = state.attendance[k]
    if (!r) break
    if (r[sid] === false) streak++
    else if (r[sid] === true) break
  }
  return streak
}

export function useStore(userId) {
  const [state, setState] = useState(loadLocalState)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  // Load from Supabase on mount
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase
      .from('app_data')
      .select('data')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data?.data) {
          const migrated = migrate(JSON.parse(JSON.stringify(data.data)))
          setState(migrated)
          localStorage.setItem('judo_v1', JSON.stringify(migrated))
        }
        setLoading(false)
      })
  }, [userId])

  // Save to localStorage on every change
  useEffect(() => {
    localStorage.setItem('judo_v1', JSON.stringify(state))
  }, [state])

  function saveToSupabase(newState) {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase
        .from('app_data')
        .upsert({ user_id: userId, data: newState, updated_at: new Date().toISOString() },
                 { onConflict: 'user_id' })
        .then()
    }, 600)
  }

  function update(fn) {
    setState(s => {
      const copy = JSON.parse(JSON.stringify(s))
      fn(copy)
      saveToSupabase(copy)
      return copy
    })
  }

  function importState(newState) {
    const migrated = migrate(JSON.parse(JSON.stringify(newState)))
    setState(migrated)
    saveToSupabase(migrated)
  }

  return { state, update, importState, COLORS, loading }
}

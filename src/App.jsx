import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useStore, consecutiveAbsences } from './useStore'
import HomeScreen from './screens/HomeScreen'
import GroupScreen from './screens/GroupScreen'
import AttendanceScreen from './screens/AttendanceScreen'
import AlertsScreen from './screens/AlertsScreen'
import StudentHistoryScreen from './screens/StudentHistoryScreen'
import SessionHistoryScreen from './screens/SessionHistoryScreen'
import BroadcastScreen from './screens/BroadcastScreen'
import LoginScreen from './screens/LoginScreen'
import './index.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:16, color:'#888'
    }}>
      <div style={{fontSize:40}}>🥋</div>
      <div style={{fontSize:14}}>טוען...</div>
    </div>
  )

  if (!user) return <LoginScreen />

  return <AppContent user={user} />
}

function AppContent({ user }) {
  const store = useStore(user.id)
  const [screen, setScreen] = useState('home')
  const [slideDir, setSlideDir] = useState('forward')
  const [currentGroupId, setCurrentGroupId] = useState(null)
  const [currentStudentId, setCurrentStudentId] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(null)
  const [tab, setTab] = useState('home')

  function go(newScreen, dir = 'forward') {
    setSlideDir(dir)
    setScreen(newScreen)
  }

  function openGroup(id) {
    setCurrentGroupId(id)
    go('group')
  }

  function openQuickAttendance(id) {
    setCurrentGroupId(id)
    setAttendanceDate(null)
    go('attendance')
  }

  function openStudentHistory(groupId, studentId) {
    setCurrentGroupId(groupId)
    setCurrentStudentId(studentId)
    go('studentHistory')
  }

  function openSessionHistory(groupId) {
    setCurrentGroupId(groupId)
    go('sessionHistory')
  }

  function openDateAttendance(dateStr) {
    setAttendanceDate(dateStr)
    go('attendanceFromHistory')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const currentGroup = store.state.groups.find(g => g.id === currentGroupId)
  const currentStudent = currentGroup?.students.find(s => s.id === currentStudentId)

  const alertCount = store.state.groups.reduce((total, gr) =>
    total + gr.students.filter(s =>
      !s.messageSent && consecutiveAbsences(store.state, gr.id, s.id) >= 3
    ).length, 0)

  const isMain = screen === 'home' || screen === 'alerts' || screen === 'broadcast'

  if (store.loading) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:16, color:'#888'
    }}>
      <div style={{fontSize:40}}>🥋</div>
      <div style={{fontSize:14}}>טוען נתונים...</div>
    </div>
  )

  return (
    <div style={{paddingTop: isMain ? 60 : 0}}>

      {/* ANIMATION 1 — screen slide wrapper (key forces remount on screen change) */}
      <div key={screen} className={slideDir === 'forward' ? 'screen-forward' : 'screen-back'}>

        {screen === 'home' && (
          <HomeScreen
            store={store}
            onOpenGroup={openGroup}
            onQuickAttendance={openQuickAttendance}
            onLogout={handleLogout}
          />
        )}

        {screen === 'alerts' && (
          <AlertsScreen store={store} />
        )}

        {screen === 'broadcast' && (
          <BroadcastScreen store={store} />
        )}

        {screen === 'group' && currentGroup && (
          <GroupScreen
            store={store}
            group={currentGroup}
            onBack={() => go('home', 'back')}
            onAttendance={() => { setAttendanceDate(null); go('attendance') }}
            onStudentHistory={(sid) => openStudentHistory(currentGroupId, sid)}
            onSessionHistory={() => openSessionHistory(currentGroupId)}
          />
        )}

        {screen === 'attendance' && currentGroup && (
          <AttendanceScreen
            store={store}
            group={currentGroup}
            initialDate={null}
            onBack={() => go('group', 'back')}
          />
        )}

        {(screen === 'attendanceFromHistory') && currentGroup && (
          <AttendanceScreen
            store={store}
            group={currentGroup}
            initialDate={attendanceDate}
            onBack={() => go('sessionHistory', 'back')}
          />
        )}

        {screen === 'sessionHistory' && currentGroup && (
          <SessionHistoryScreen
            store={store}
            group={currentGroup}
            onBack={() => go('group', 'back')}
            onOpenDate={openDateAttendance}
          />
        )}

        {screen === 'studentHistory' && currentGroup && currentStudent && (
          <StudentHistoryScreen
            store={store}
            group={currentGroup}
            student={currentStudent}
            onBack={() => go('group', 'back')}
          />
        )}

      </div>

      {isMain && (
        <div style={{
          position:'fixed', top:0, left:'50%', transform:'translateX(-50%)',
          width:'100%', maxWidth:480, display:'flex',
          borderBottom:'1px solid #e8e8e8', background:'#fff', zIndex:100,
          position:'fixed'
        }}>
          <button
            onClick={() => { setTab('home'); go('home') }}
            style={{
              flex:1, padding:'10px 0', background:'none', border:'none', cursor:'pointer',
              fontSize:13, color: tab==='home' ? '#1a73e8' : '#888',
              fontWeight: tab==='home' ? 600 : 400, fontFamily:'inherit'
            }}
          >🏠 קבוצות</button>

          <button
            onClick={() => { setTab('alerts'); go('alerts') }}
            style={{
              flex:1, padding:'10px 0', background:'none', border:'none', cursor:'pointer',
              fontSize:13, color: tab==='alerts' ? '#ea4335' : '#888',
              fontWeight: tab==='alerts' ? 600 : 400, fontFamily:'inherit',
              position:'relative'
            }}
          >
            🔔 התראות
            {/* ANIMATION 4 — pulsing alert badge */}
            {alertCount > 0 && (
              <span className="alert-badge-pulse" style={{
                position:'absolute', top:6, right:'25%',
                background:'#ea4335', color:'#fff', borderRadius:'50%',
                width:18, height:18, fontSize:11, fontWeight:700,
                alignItems:'center', justifyContent:'center'
              }}>{alertCount}</span>
            )}
          </button>

          <button
            onClick={() => { setTab('broadcast'); go('broadcast') }}
            style={{
              flex:1, padding:'10px 0', background:'none', border:'none', cursor:'pointer',
              fontSize:13, color: tab==='broadcast' ? '#1a73e8' : '#888',
              fontWeight: tab==='broadcast' ? 600 : 400, fontFamily:'inherit'
            }}
          >✉️ הודעות</button>

          {/* ANIMATION 5 — sliding tab underline */}
          <div
            className="tab-underline"
            style={{
              background: tab === 'alerts' ? '#ea4335' : '#1a73e8',
              right: tab === 'home' ? '0%' : tab === 'alerts' ? '33.33%' : '66.66%'
            }}
          />
        </div>
      )}
    </div>
  )
}

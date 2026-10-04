'use client'
import Link from 'next/link'
import {supabaseBrowser} from '@/lib/supabase'
export default function Nav(){const logout=async()=>{await supabaseBrowser().auth.signOut();location.href='/login'};return <div className="card row" style={{marginBottom:18}}><b>EduStreak</b><div className="nav"><Link href="/dashboard">Dashboard</Link><Link href="/plan-study">Plan Study</Link><Link href="/tracker">Tracker</Link><Link href="/leaderboard">Leaderboard</Link><button className="btn secondary" onClick={logout}>Logout</button></div></div>}

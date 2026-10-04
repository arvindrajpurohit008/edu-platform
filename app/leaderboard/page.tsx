import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'
import Nav from '@/components/Nav'
export default async function Leaderboard(){const c=await cookies();const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>c.getAll(),setAll:()=>{}}});const {data}=await s.from('leaderboard').select('*').limit(50);return <main className="container"><Nav/><h1 className="title">Leaderboard</h1><div className="card"><table className="table"><thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>XP</th></tr></thead><tbody>{(data||[]).map((x:any,i)=><tr key={x.id}><td>#{i+1}</td><td>{x.full_name}</td><td>{x.class_name}</td><td><b>{x.xp}</b></td></tr>)}</tbody></table></div></main>}

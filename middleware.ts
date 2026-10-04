import {createServerClient} from '@supabase/ssr'
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
export async function middleware(req:NextRequest){let res=NextResponse.next({request:req});const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll(){return req.cookies.getAll()},setAll(cookies){cookies.forEach(({name,value,options})=>res.cookies.set(name,value,options))}}});const {data:{user}}=await supabase.auth.getUser();if(!user&&req.nextUrl.pathname!='/login'&&!req.nextUrl.pathname.startsWith('/_next'))return NextResponse.redirect(new URL('/login',req.url));if(user&&req.nextUrl.pathname=='/login')return NextResponse.redirect(new URL('/dashboard',req.url));return res}
export const config={matcher:['/dashboard/:path*','/plan-study/:path*','/study/:path*','/tracker/:path*','/leaderboard/:path*','/login']}

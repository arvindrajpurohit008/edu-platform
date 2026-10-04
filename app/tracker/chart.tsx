'use client'
import {BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer} from 'recharts'
export default function TrackerChart({data}:{data:any[]}){return <div style={{width:'100%',height:360}}><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="minutes" name="Minutes watched"/><Bar dataKey="completed" name="Completed chapters"/><Bar dataKey="pending" name="Pending chapters"/></BarChart></ResponsiveContainer></div>}

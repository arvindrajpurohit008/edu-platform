# EduStreak — full-stack education website MVP

## Features
- Password login with Supabase Auth
- Student name/class dashboard
- 45-minute real playback-time daily streak
- Missed-day warning support in database
- XP: 1 point per 5 minutes of actual playback time
- Teacher → subject filtering
- YouTube lessons
- Notes PDF link per lesson
- Video completion tracking
- Subject/chapter/time analytics
- XP leaderboard
- Responsive UI

## 1. Create the database
Create a Supabase project, open SQL Editor, and run `supabase/schema.sql`.

## 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase URL, anon key, and service role key.

## 3. Install/run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## 4. Create student accounts
Use Supabase Dashboard → Authentication → Users to create email/password users. The trigger automatically creates a profile. Then edit `profiles.full_name` and `profiles.class_name` in Table Editor.

## 5. Add teachers/subjects
Insert teachers and subjects, then connect them in `teacher_subjects`.

## 6. Add videos
Insert rows into `videos`. `youtube_id` is the YouTube video ID (the part after `v=`). `duration_seconds` should be the video's duration in seconds. Put the notes PDF's public/signed URL in `notes_url`.

## Important production notes
The included heartbeat design is a functional MVP. A determined user can still fake client requests. For a high-stakes competitive system, move playback verification to a trusted service, store playback sessions, detect impossible jumps/seeks, rate-limit events, and use signed session tokens.

Also configure Supabase Storage for notes PDFs rather than exposing arbitrary URLs. Do not expose the Supabase service-role key to browser code.

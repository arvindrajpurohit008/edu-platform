"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: string;
  name: string;
  active: boolean;
};

type Subject = {
  id: string;
  name: string;
  class_name: string | null;
  active: boolean;
};

type Video = {
  id: string;
  title: string;
  youtube_id: string;
  chapter: string | null;
  duration_seconds: number;
  notes_url: string | null;
  order_no: number;
  active: boolean;
  subject_id: string | null;
  teacher_id: string | null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [tab, setTab] = useState<"teachers" | "subjects" | "videos">(
    "teachers"
  );

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  const [teacherName, setTeacherName] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [className, setClassName] = useState("");

  const [videoTitle, setVideoTitle] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [chapter, setChapter] = useState("");
  const [duration, setDuration] = useState("");
  const [notesUrl, setNotesUrl] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [orderNo, setOrderNo] = useState("1");

  useEffect(() => {
    checkOwner();
  }, []);

  async function checkOwner() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "owner") {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    setAuthorized(true);
    await loadData();
    setLoading(false);
  }

  async function loadData() {
    const [teachersRes, subjectsRes, videosRes] = await Promise.all([
      supabase.from("teachers").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
      supabase.from("videos").select("*").order("order_no"),
    ]);

    if (teachersRes.data) setTeachers(teachersRes.data);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (videosRes.data) setVideos(videosRes.data);
  }

  async function addTeacher() {
    if (!teacherName.trim()) return;

    const { error } = await supabase.from("teachers").insert({
      name: teacherName.trim(),
      active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTeacherName("");
    await loadData();
  }

  async function addSubject() {
    if (!subjectName.trim()) return;

    const { error } = await supabase.from("subjects").insert({
      name: subjectName.trim(),
      class_name: className.trim() || null,
      active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSubjectName("");
    setClassName("");
    await loadData();
  }

  async function addVideo() {
    if (!videoTitle.trim() || !youtubeId.trim()) {
      alert("Title and YouTube ID are required.");
      return;
    }

    const { error } = await supabase.from("videos").insert({
      title: videoTitle.trim(),
      youtube_id: youtubeId.trim(),
      chapter: chapter.trim() || null,
      duration_seconds: Number(duration) || 0,
      notes_url: notesUrl.trim() || null,
      subject_id: subjectId || null,
      teacher_id: teacherId || null,
      order_no: Number(orderNo) || 1,
      active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setVideoTitle("");
    setYoutubeId("");
    setChapter("");
    setDuration("");
    setNotesUrl("");
    setSubjectId("");
    setTeacherId("");
    setOrderNo("1");

    await loadData();
  }

  async function toggleTeacher(id: string, active: boolean) {
    const { error } = await supabase
      .from("teachers")
      .update({ active: !active })
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  async function toggleSubject(id: string, active: boolean) {
    const { error } = await supabase
      .from("subjects")
      .update({ active: !active })
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  async function toggleVideo(id: string, active: boolean) {
    const { error } = await supabase
      .from("videos")
      .update({ active: !active })
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  async function deleteTeacher(id: string) {
    if (!confirm("Delete this teacher?")) return;

    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject?")) return;

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  async function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return;

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id);

    if (error) alert(error.message);
    await loadData();
  }

  if (loading) {
    return (
      <main style={styles.center}>
        <h2>Loading Owner Panel...</h2>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={styles.center}>
        <h2>Access denied</h2>
        <p>Only the EduStreak owner can access this page.</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>EduStreak Owner Panel</h1>
          <p style={styles.subtitle}>
            Manage teachers, subjects and study videos.
          </p>
        </div>

        <button
          style={styles.logout}
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      <div style={styles.tabs}>
        <button
          style={tab === "teachers" ? styles.activeTab : styles.tab}
          onClick={() => setTab("teachers")}
        >
          Teachers
        </button>

        <button
          style={tab === "subjects" ? styles.activeTab : styles.tab}
          onClick={() => setTab("subjects")}
        >
          Subjects
        </button>

        <button
          style={tab === "videos" ? styles.activeTab : styles.tab}
          onClick={() => setTab("videos")}
        >
          Videos
        </button>
      </div>

      {tab === "teachers" && (
        <section>
          <div style={styles.card}>
            <h2>Add Teacher</h2>

            <input
              style={styles.input}
              placeholder="Teacher name"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />

            <button style={styles.primary} onClick={addTeacher}>
              Add Teacher
            </button>
          </div>

          <div style={styles.card}>
            <h2>Teachers</h2>

            {teachers.map((teacher) => (
              <div style={styles.row} key={teacher.id}>
                <div>
                  <strong>{teacher.name}</strong>
                  <div>
                    {teacher.active ? "Published" : "Hidden"}
                  </div>
                </div>

                <div>
                  <button
                    style={styles.small}
                    onClick={() =>
                      toggleTeacher(teacher.id, teacher.active)
                    }
                  >
                    {teacher.active ? "Hide" : "Publish"}
                  </button>

                  <button
                    style={styles.delete}
                    onClick={() => deleteTeacher(teacher.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "subjects" && (
        <section>
          <div style={styles.card}>
            <h2>Add Subject</h2>

            <input
              style={styles.input}
              placeholder="Subject name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Class e.g. 10"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />

            <button style={styles.primary} onClick={addSubject}>
              Add Subject
            </button>
          </div>

          <div style={styles.card}>
            <h2>Subjects</h2>

            {subjects.map((subject) => (
              <div style={styles.row} key={subject.id}>
                <div>
                  <strong>{subject.name}</strong>
                  <div>
                    Class {subject.class_name || "—"} ·{" "}
                    {subject.active ? "Published" : "Hidden"}
                  </div>
                </div>

                <div>
                  <button
                    style={styles.small}
                    onClick={() =>
                      toggleSubject(subject.id, subject.active)
                    }
                  >
                    {subject.active ? "Hide" : "Publish"}
                  </button>

                  <button
                    style={styles.delete}
                    onClick={() => deleteSubject(subject.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "videos" && (
        <section>
          <div style={styles.card}>
            <h2>Add Video</h2>

            <input
              style={styles.input}
              placeholder="Video title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="YouTube video ID"
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Chapter"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />

            <input
              style={styles.input}
              type="number"
              placeholder="Duration in seconds"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Notes PDF URL"
              value={notesUrl}
              onChange={(e) => setNotesUrl(e.target.value)}
            />

            <select
              style={styles.input}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select subject</option>
              {subjects
                .filter((s) => s.active)
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
            </select>

            <select
              style={styles.input}
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Select teacher</option>
              {teachers
                .filter((t) => t.active)
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
            </select>

            <input
              style={styles.input}
              type="number"
              placeholder="Order number"
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
            />

            <button style={styles.primary} onClick={addVideo}>
              Add Video
            </button>
          </div>

          <div style={styles.card}>
            <h2>Videos</h2>

            {videos.map((video) => (
              <div style={styles.row} key={video.id}>
                <div>
                  <strong>{video.title}</strong>
                  <div>
                    Chapter: {video.chapter || "—"} ·{" "}
                    {video.active ? "Published" : "Hidden"}
                  </div>
                </div>

                <div>
                  <button
                    style={styles.small}
                    onClick={() =>
                      toggleVideo(video.id, video.active)
                    }
                  >
                    {video.active ? "Hide" : "Publish"}
                  </button>

                  <button
                    style={styles.delete}
                    onClick={() => deleteVideo(video.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f5f7fb",
    color: "#111827",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
  },
  subtitle: {
    color: "#6b7280",
  },
  logout: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    background: "white",
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
  },
  tab: {
    padding: "12px 20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },
  activeTab: {
    padding: "12px 20px",
    border: "1px solid #111827",
    borderRadius: "8px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  card: {
    background: "white",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },
  input: {
    display: "block",
    width: "100%",
    maxWidth: "600px",
    padding: "12px",
    marginBottom: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
  },
  primary: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "16px 0",
    borderBottom: "1px solid #eee",
  },
  small: {
    padding: "8px 12px",
    marginRight: "8px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "white",
    cursor: "pointer",
  },
  delete: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
  },
};

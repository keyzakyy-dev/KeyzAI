-- KeyzAI schema v3: riwayat PRD per akun Google. Seluruh objek project disimpan
-- utuh sebagai JSON (sama seperti conversations) supaya semua tahap + jawaban
-- selamat saat sinkron antar perangkat.

CREATE TABLE IF NOT EXISTS prd_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  project_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_prd_projects_user
  ON prd_projects(user_id, updated_at DESC);

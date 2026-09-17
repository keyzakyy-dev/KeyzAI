-- KeyzAI schema v2: preferensi akun (JSON) untuk tiap user.
-- Dipakai GET/PUT /api/preferences: default model, lebar sidebar default,
-- dan nama tampilan kustom (display_name disimpan di kolom name users).
ALTER TABLE users ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}';
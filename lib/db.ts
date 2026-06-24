import Database from 'better-sqlite3'
import path from 'path'
import { randomUUID } from 'crypto'

const DB_PATH = path.join(process.cwd(), 'shard-ai.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name  TEXT,
        image TEXT
      );
      CREATE TABLE IF NOT EXISTS report_history (
        id            TEXT PRIMARY KEY,
        user_email    TEXT NOT NULL REFERENCES users(email),
        report_title  TEXT NOT NULL,
        created_at    TEXT NOT NULL,
        snapshot_data TEXT NOT NULL
      );
    `)
  }
  return _db
}

export function upsertUser(
  email: string,
  name?: string | null,
  image?: string | null,
) {
  getDb()
    .prepare(`
      INSERT INTO users (email, name, image) VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET name = excluded.name, image = excluded.image
    `)
    .run(email, name ?? null, image ?? null)
}

export interface ReportRecord {
  id:            string
  user_email:    string
  report_title:  string
  created_at:    string
  snapshot_data: string
}

export type ReportListItem = Omit<ReportRecord, 'snapshot_data'>

export function insertReport(
  userEmail:    string,
  reportTitle:  string,
  snapshotData: string,
): string {
  const id = randomUUID()
  getDb()
    .prepare(`
      INSERT INTO report_history (id, user_email, report_title, created_at, snapshot_data)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(id, userEmail, reportTitle, new Date().toISOString(), snapshotData)
  return id
}

export function getUserReports(userEmail: string): ReportListItem[] {
  return getDb()
    .prepare(`
      SELECT id, user_email, report_title, created_at
      FROM report_history
      WHERE user_email = ?
      ORDER BY created_at DESC
    `)
    .all(userEmail) as ReportListItem[]
}

export function getReportById(
  id:        string,
  userEmail: string,
): ReportRecord | undefined {
  return getDb()
    .prepare(`
      SELECT * FROM report_history
      WHERE id = ? AND user_email = ?
    `)
    .get(id, userEmail) as ReportRecord | undefined
}

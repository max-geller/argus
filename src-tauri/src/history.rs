use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupHistoryEntry {
    pub id: Option<i64>,
    pub timestamp: String,
    pub snapshot_id: String,
    pub source: String, // "manual" or "scheduled"
    pub total_size: u64,
    pub files_count: u64,
    pub data_added: u64,
    pub duration: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryStats {
    pub total_backups: u64,
    pub total_data_backed_up: u64,
    pub average_duration: f64,
    pub size_over_time: Vec<SizeDataPoint>,
    pub backups_per_week: Vec<WeeklyCount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizeDataPoint {
    pub date: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeeklyCount {
    pub week: String,
    pub count: u64,
}

fn get_db_path() -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .map_err(|_| "Could not determine HOME directory".to_string())?;

    let db_dir = PathBuf::from(home).join(".local/share/argus");

    // Ensure directory exists
    std::fs::create_dir_all(&db_dir)
        .map_err(|e| format!("Failed to create database directory: {}", e))?;

    Ok(db_dir.join("backup-history.db"))
}

fn get_connection() -> Result<Connection, String> {
    let db_path = get_db_path()?;
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Initialize schema if needed
    conn.execute(
        "CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            snapshot_id TEXT NOT NULL,
            source TEXT NOT NULL,
            total_size INTEGER NOT NULL,
            files_count INTEGER NOT NULL,
            data_added INTEGER NOT NULL,
            duration REAL NOT NULL
        )",
        [],
    ).map_err(|e| format!("Failed to create table: {}", e))?;

    // Create index for faster queries
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_timestamp ON backup_history(timestamp)",
        [],
    ).map_err(|e| format!("Failed to create index: {}", e))?;

    Ok(conn)
}

#[tauri::command]
pub fn history_record_backup(entry: BackupHistoryEntry) -> Result<i64, String> {
    let conn = get_connection()?;

    conn.execute(
        "INSERT INTO backup_history (timestamp, snapshot_id, source, total_size, files_count, data_added, duration)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            entry.timestamp,
            entry.snapshot_id,
            entry.source,
            entry.total_size,
            entry.files_count,
            entry.data_added,
            entry.duration
        ],
    ).map_err(|e| format!("Failed to insert entry: {}", e))?;

    let id = conn.last_insert_rowid();
    println!("✓ Recorded backup history entry {}", id);
    Ok(id)
}

#[tauri::command]
pub fn history_get_entries(limit: u32) -> Result<Vec<BackupHistoryEntry>, String> {
    let conn = get_connection()?;

    let mut stmt = conn.prepare(
        "SELECT id, timestamp, snapshot_id, source, total_size, files_count, data_added, duration
         FROM backup_history
         ORDER BY timestamp DESC
         LIMIT ?1"
    ).map_err(|e| format!("Failed to prepare query: {}", e))?;

    let entries = stmt.query_map([limit], |row| {
        Ok(BackupHistoryEntry {
            id: Some(row.get(0)?),
            timestamp: row.get(1)?,
            snapshot_id: row.get(2)?,
            source: row.get(3)?,
            total_size: row.get(4)?,
            files_count: row.get(5)?,
            data_added: row.get(6)?,
            duration: row.get(7)?,
        })
    }).map_err(|e| format!("Failed to query entries: {}", e))?;

    let result: Vec<BackupHistoryEntry> = entries
        .filter_map(|e| e.ok())
        .collect();

    println!("✓ Retrieved {} history entries", result.len());
    Ok(result)
}

#[tauri::command]
pub fn history_get_stats(days: u32) -> Result<HistoryStats, String> {
    let conn = get_connection()?;

    // Total backups and data
    let (total_backups, total_data, avg_duration): (u64, u64, f64) = conn.query_row(
        "SELECT COUNT(*), COALESCE(SUM(data_added), 0), COALESCE(AVG(duration), 0.0)
         FROM backup_history
         WHERE timestamp >= datetime('now', ?1)",
        [format!("-{} days", days)],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).unwrap_or((0, 0, 0.0));

    // Size over time (daily)
    let mut size_stmt = conn.prepare(
        "SELECT date(timestamp) as d, MAX(total_size) as size
         FROM backup_history
         WHERE timestamp >= datetime('now', ?1)
         GROUP BY d
         ORDER BY d ASC"
    ).map_err(|e| format!("Failed to prepare size query: {}", e))?;

    let size_points: Vec<SizeDataPoint> = size_stmt.query_map([format!("-{} days", days)], |row| {
        Ok(SizeDataPoint {
            date: row.get(0)?,
            size: row.get(1)?,
        })
    }).map_err(|e| format!("Failed to query size data: {}", e))?
    .filter_map(|r| r.ok())
    .collect();

    // Backups per week
    let mut week_stmt = conn.prepare(
        "SELECT strftime('%Y-W%W', timestamp) as week, COUNT(*) as count
         FROM backup_history
         WHERE timestamp >= datetime('now', ?1)
         GROUP BY week
         ORDER BY week ASC"
    ).map_err(|e| format!("Failed to prepare weekly query: {}", e))?;

    let weekly: Vec<WeeklyCount> = week_stmt.query_map([format!("-{} days", days)], |row| {
        Ok(WeeklyCount {
            week: row.get(0)?,
            count: row.get(1)?,
        })
    }).map_err(|e| format!("Failed to query weekly data: {}", e))?
    .filter_map(|r| r.ok())
    .collect();

    println!("✓ Generated stats for last {} days", days);
    Ok(HistoryStats {
        total_backups,
        total_data_backed_up: total_data,
        average_duration: avg_duration,
        size_over_time: size_points,
        backups_per_week: weekly,
    })
}

#[tauri::command]
pub fn history_delete_old(days: u32) -> Result<u64, String> {
    let conn = get_connection()?;

    let deleted = conn.execute(
        "DELETE FROM backup_history WHERE timestamp < datetime('now', ?1)",
        [format!("-{} days", days)],
    ).map_err(|e| format!("Failed to delete old entries: {}", e))?;

    println!("✓ Deleted {} old history entries", deleted);
    Ok(deleted as u64)
}

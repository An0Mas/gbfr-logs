use anyhow::Result;
use log::info;
use rusqlite::{Connection, OpenFlags};
use rusqlite_migration::{Migrations, M};
use std::{
    env, fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

pub mod logs;

const APP_DATA_DIR_NAME: &str = "com.an0mas.gbfr-logs";
const DB_FILE_NAME: &str = "logs.db";

#[derive(Debug)]
pub struct DatabaseImportSummary {
    pub source_path: PathBuf,
    pub destination_path: PathBuf,
    pub backup_path: Option<PathBuf>,
}

/// Setup database and run migrations.
pub fn setup_db() -> Result<()> {
    let database_path = database_path()?;
    info!("Setting up the database, opening {:?}..", database_path);

    let mut conn = Connection::open(database_path)?;

    conn.pragma_update(None, "journal_mode", "WAL")?;

    let migrations = Migrations::new(vec![
        M::up(
            r#"CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            time INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            data BLOB NOT NULL
        )"#,
        ),
        M::up("ALTER TABLE logs ADD COLUMN version INTEGER NOT NULL DEFAULT 0"),
        M::up("ALTER TABLE logs ADD COLUMN primary_target INTEGER"),
        M::up("ALTER TABLE logs ADD COLUMN p1_name TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p1_type TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p2_name TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p2_type TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p3_name TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p3_type TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p4_name TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN p4_type TEXT"),
        M::up("ALTER TABLE logs ADD COLUMN quest_id INTEGER"),
        M::up("ALTER TABLE logs ADD COLUMN quest_elapsed_time INTEGER"),
        M::up("ALTER TABLE logs ADD COLUMN quest_completed BOOLEAN"),
    ]);

    info!("Database found, running migrations..");

    migrations.to_latest(&mut conn)?;

    Ok(())
}

/// Connect to database.
pub fn connect_to_db() -> Result<Connection> {
    let conn = Connection::open(database_path()?)?;
    conn.pragma_update(None, "journal_mode", "WAL")?;

    Ok(conn)
}

pub fn database_path() -> Result<PathBuf> {
    let dir = app_data_dir()?;
    fs::create_dir_all(&dir)?;
    Ok(dir.join(DB_FILE_NAME))
}

pub fn original_database_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Some(program_files) = env::var_os("ProgramFiles") {
        candidates.push(
            PathBuf::from(program_files)
                .join("GBFR Logs")
                .join(DB_FILE_NAME),
        );
    }

    if let Some(program_files_x86) = env::var_os("ProgramFiles(x86)") {
        candidates.push(
            PathBuf::from(program_files_x86)
                .join("GBFR Logs")
                .join(DB_FILE_NAME),
        );
    }

    if let Some(app_data) = env::var_os("APPDATA") {
        let app_data = PathBuf::from(app_data);
        candidates.push(app_data.join("com.false").join(DB_FILE_NAME));
        candidates.push(app_data.join("gbfr-logs").join(DB_FILE_NAME));
    }

    candidates
        .into_iter()
        .filter(|candidate| candidate.exists())
        .collect()
}

pub fn import_first_original_database() -> Result<DatabaseImportSummary> {
    for candidate in original_database_candidates() {
        if !is_current_database(&candidate)? {
            return import_database_from_path(&candidate);
        }
    }

    anyhow::bail!("Could not find an original GBFR Logs database. Select logs.db manually instead.")
}

pub fn import_database_from_path(source_path: &Path) -> Result<DatabaseImportSummary> {
    let source_path = source_path.canonicalize()?;

    if is_current_database(&source_path)? {
        anyhow::bail!("The selected database is already the An0Mas database.")
    }

    let source_conn = Connection::open_with_flags(&source_path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    source_conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'logs'",
        [],
        |_| Ok(()),
    )?;

    let destination_path = database_path()?;
    let destination_dir = destination_path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Database path has no parent directory"))?;
    fs::create_dir_all(destination_dir)?;

    let timestamp = timestamp_suffix();
    let temp_path = destination_dir.join(format!("logs.import-{timestamp}.db"));
    if temp_path.exists() {
        fs::remove_file(&temp_path)?;
    }

    let temp_path_string = temp_path.to_string_lossy().to_string();
    source_conn.execute("VACUUM main INTO ?", rusqlite::params![temp_path_string])?;

    let backup_path = backup_existing_database(&destination_path, &timestamp)?;

    if let Err(error) = fs::rename(&temp_path, &destination_path) {
        if let Some(backup_path) = &backup_path {
            let _ = fs::rename(backup_path, &destination_path);
        }

        anyhow::bail!(error);
    }

    setup_db()?;

    Ok(DatabaseImportSummary {
        source_path,
        destination_path,
        backup_path,
    })
}

fn app_data_dir() -> Result<PathBuf> {
    let app_data = env::var_os("APPDATA").ok_or_else(|| anyhow::anyhow!("APPDATA is not set"))?;
    Ok(PathBuf::from(app_data).join(APP_DATA_DIR_NAME))
}

fn backup_existing_database(destination_path: &Path, timestamp: &str) -> Result<Option<PathBuf>> {
    if !destination_path.exists() {
        return Ok(None);
    }

    let backup_path = destination_path.with_file_name(format!("logs.backup-{timestamp}.db"));

    if let Ok(conn) = Connection::open(destination_path) {
        let _ = conn.execute_batch("PRAGMA wal_checkpoint(FULL);");
    }

    fs::rename(destination_path, &backup_path)?;

    for suffix in ["wal", "shm"] {
        let sidecar_path = PathBuf::from(format!("{}-{suffix}", destination_path.display()));
        if sidecar_path.exists() {
            let sidecar_backup_path = PathBuf::from(format!("{}-{suffix}", backup_path.display()));
            fs::rename(sidecar_path, sidecar_backup_path)?;
        }
    }

    Ok(Some(backup_path))
}

fn is_current_database(path: &Path) -> Result<bool> {
    let database_path = database_path()?;

    if !database_path.exists() || !path.exists() {
        return Ok(false);
    }

    Ok(path.canonicalize()? == database_path.canonicalize()?)
}

fn timestamp_suffix() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();

    seconds.to_string()
}

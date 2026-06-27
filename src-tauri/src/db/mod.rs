use anyhow::Result;
use log::info;
use rusqlite::{Connection, OpenFlags};
use rusqlite_migration::{Migrations, M};
use std::{
    env,
    ffi::OsString,
    fs,
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

#[derive(Debug)]
pub struct DatabaseExportSummary {
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
    validate_logs_database(&source_conn)?;

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

pub fn export_database_to_first_original() -> Result<DatabaseExportSummary> {
    for candidate in original_database_candidates() {
        if !is_current_database(&candidate)? {
            return export_database_to_path(&candidate);
        }
    }

    anyhow::bail!("Could not find an original GBFR Logs database to export to.")
}

pub fn export_database_to_path(destination_path: &Path) -> Result<DatabaseExportSummary> {
    let source_path = database_path()?;
    let destination_path = destination_path.to_path_buf();

    if !source_path.exists() {
        anyhow::bail!("The An0Mas logs database does not exist yet.")
    }

    let source_path = source_path.canonicalize()?;
    let canonical_destination_path = destination_path.canonicalize()?;

    if source_path == canonical_destination_path {
        anyhow::bail!("The export destination is already the An0Mas database.")
    }

    let source_conn = Connection::open_with_flags(&source_path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    validate_logs_database(&source_conn)?;

    let destination_dir = destination_path
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Database path has no parent directory"))?;

    let timestamp = timestamp_suffix();
    let temp_path = destination_dir.join(format!("logs.export-{timestamp}.db"));
    if temp_path.exists() {
        fs::remove_file(&temp_path)?;
    }

    let temp_path_string = temp_path.to_string_lossy().to_string();
    source_conn.execute("VACUUM main INTO ?", rusqlite::params![temp_path_string])?;

    let temp_conn = Connection::open_with_flags(&temp_path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    validate_logs_database(&temp_conn)?;
    drop(temp_conn);

    let backup_path = backup_existing_database(&destination_path, &timestamp)?;

    if let Err(error) = fs::rename(&temp_path, &destination_path) {
        if let Some(backup_path) = &backup_path {
            let _ = restore_database_backup(backup_path, &destination_path);
        }

        anyhow::bail!(error);
    }

    Ok(DatabaseExportSummary {
        source_path,
        destination_path,
        backup_path,
    })
}

fn app_data_dir() -> Result<PathBuf> {
    let app_data = env::var_os("APPDATA").ok_or_else(|| anyhow::anyhow!("APPDATA is not set"))?;
    Ok(PathBuf::from(app_data).join(APP_DATA_DIR_NAME))
}

fn validate_logs_database(conn: &Connection) -> Result<()> {
    conn.query_row(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'logs'",
        [],
        |_| Ok(()),
    )?;

    Ok(())
}

fn backup_existing_database(destination_path: &Path, timestamp: &str) -> Result<Option<PathBuf>> {
    if !destination_path.exists() {
        return Ok(None);
    }

    let backup_path = destination_path.with_file_name(format!("logs.backup-{timestamp}.db"));

    fs::rename(destination_path, &backup_path)?;
    let mut moved_sidecars = Vec::new();

    for suffix in ["wal", "shm"] {
        let sidecar_path = sqlite_sidecar_path(destination_path, suffix);
        if sidecar_path.exists() {
            let sidecar_backup_path = sqlite_sidecar_path(&backup_path, suffix);
            if let Err(error) = fs::rename(&sidecar_path, &sidecar_backup_path) {
                for (sidecar_backup_path, sidecar_path) in moved_sidecars.into_iter().rev() {
                    let _ = fs::rename(sidecar_backup_path, sidecar_path);
                }

                let _ = fs::rename(&backup_path, destination_path);
                anyhow::bail!(error);
            }

            moved_sidecars.push((sidecar_backup_path, sidecar_path));
        }
    }

    Ok(Some(backup_path))
}

fn restore_database_backup(backup_path: &Path, destination_path: &Path) -> Result<()> {
    if destination_path.exists() {
        fs::remove_file(destination_path)?;
    }

    fs::rename(backup_path, destination_path)?;

    for suffix in ["wal", "shm"] {
        let sidecar_backup_path = sqlite_sidecar_path(backup_path, suffix);
        if sidecar_backup_path.exists() {
            let sidecar_path = sqlite_sidecar_path(destination_path, suffix);
            fs::rename(sidecar_backup_path, sidecar_path)?;
        }
    }

    Ok(())
}

fn is_current_database(path: &Path) -> Result<bool> {
    let database_path = database_path()?;

    if !database_path.exists() || !path.exists() {
        return Ok(false);
    }

    Ok(path.canonicalize()? == database_path.canonicalize()?)
}

fn sqlite_sidecar_path(database_path: &Path, suffix: &str) -> PathBuf {
    let mut sidecar_path = OsString::from(database_path.as_os_str());
    sidecar_path.push(format!("-{suffix}"));
    PathBuf::from(sidecar_path)
}

fn timestamp_suffix() -> String {
    let seconds = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();

    seconds.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

    struct TestEnv {
        root: PathBuf,
        app_data: Option<OsString>,
        program_files: Option<OsString>,
        program_files_x86: Option<OsString>,
    }

    impl TestEnv {
        fn new(name: &str) -> Result<Self> {
            let root = env::temp_dir().join(format!(
                "gbfr-logs-{name}-{}-{}",
                std::process::id(),
                timestamp_suffix()
            ));

            if root.exists() {
                fs::remove_dir_all(&root)?;
            }

            let app_data = env::var_os("APPDATA");
            let program_files = env::var_os("ProgramFiles");
            let program_files_x86 = env::var_os("ProgramFiles(x86)");

            env::set_var("APPDATA", root.join("appdata"));
            env::set_var("ProgramFiles", root.join("program-files"));
            env::remove_var("ProgramFiles(x86)");

            Ok(Self {
                root,
                app_data,
                program_files,
                program_files_x86,
            })
        }

        fn original_database_path(&self) -> PathBuf {
            self.root
                .join("program-files")
                .join("GBFR Logs")
                .join(DB_FILE_NAME)
        }
    }

    impl Drop for TestEnv {
        fn drop(&mut self) {
            restore_env_var("APPDATA", self.app_data.as_ref());
            restore_env_var("ProgramFiles", self.program_files.as_ref());
            restore_env_var("ProgramFiles(x86)", self.program_files_x86.as_ref());

            let _ = fs::remove_dir_all(&self.root);
        }
    }

    fn restore_env_var(key: &str, value: Option<&OsString>) {
        if let Some(value) = value {
            env::set_var(key, value);
        } else {
            env::remove_var(key);
        }
    }

    fn create_logs_database(path: &Path, log_name: &str) -> Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(path)?;
        conn.execute_batch(
            r#"
            CREATE TABLE logs (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                time INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                data BLOB NOT NULL
            );
            "#,
        )?;
        conn.execute(
            "INSERT INTO logs (id, name, time, duration, data) VALUES (1, ?1, 0, 0, X'01')",
            [log_name],
        )?;

        Ok(())
    }

    fn first_log_name(path: &Path) -> Result<String> {
        let conn = Connection::open(path)?;
        let name = conn.query_row("SELECT name FROM logs WHERE id = 1", [], |row| row.get(0))?;
        Ok(name)
    }

    #[test]
    fn export_first_original_database_replaces_original_after_backup_with_sidecars() -> Result<()> {
        let _lock = ENV_LOCK.get_or_init(|| Mutex::new(())).lock().unwrap();
        let env = TestEnv::new("export-original")?;

        let an0mas_database_path = database_path()?;
        create_logs_database(&an0mas_database_path, "an0mas-log")?;

        let original_database_path = env.original_database_path();
        create_logs_database(&original_database_path, "original-log")?;
        fs::write(sqlite_sidecar_path(&original_database_path, "wal"), b"wal")?;
        fs::write(sqlite_sidecar_path(&original_database_path, "shm"), b"shm")?;
        assert!(sqlite_sidecar_path(&original_database_path, "wal").exists());
        assert!(sqlite_sidecar_path(&original_database_path, "shm").exists());

        let summary = export_database_to_first_original()?;

        assert_eq!(
            summary.source_path.canonicalize()?,
            an0mas_database_path.canonicalize()?
        );
        assert_eq!(
            summary.destination_path.canonicalize()?,
            original_database_path.canonicalize()?
        );

        let backup_path = summary
            .backup_path
            .expect("original database should be backed up before replacement");
        let backup_wal_path = sqlite_sidecar_path(&backup_path, "wal");
        let backup_shm_path = sqlite_sidecar_path(&backup_path, "shm");
        assert!(
            backup_wal_path.exists(),
            "missing backup WAL at {}; original WAL exists after export: {}",
            backup_wal_path.display(),
            sqlite_sidecar_path(&original_database_path, "wal").exists()
        );
        assert!(
            backup_shm_path.exists(),
            "missing backup SHM at {}; original SHM exists after export: {}",
            backup_shm_path.display(),
            sqlite_sidecar_path(&original_database_path, "shm").exists()
        );
        assert_eq!(first_log_name(&an0mas_database_path)?, "an0mas-log");
        assert_eq!(first_log_name(&original_database_path)?, "an0mas-log");
        assert_eq!(first_log_name(&backup_path)?, "original-log");

        Ok(())
    }
}

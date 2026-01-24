"use strict";exports.id=6261,exports.ids=[6261],exports.modules={1717:(a,b,c)=>{c.d(b,{kA:()=>t,cf:()=>n,wS:()=>o,U1:()=>p,mt:()=>q,Mx:()=>r,bM:()=>u});var d=c(87550),e=c.n(d),f=c(29021),g=c.n(f);function h(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,11)}`}c(5349);var i=c(33873),j=c.n(i);function k(){let a=function(){let a=process.cwd();return!function(){let a=process.cwd();return a.includes(".build/standalone")||a.includes(".build\\standalone")}()?a:j().resolve(a,"..","..")}(),b=j().join(a,"data");return g().existsSync(b)||g().mkdirSync(b,{recursive:!0}),b}c(79358),c(55511);let l=null;function m(){if(l)return l;let a=k();g().existsSync(a)||g().mkdirSync(a,{recursive:!0});let b=j().join(k(),"supascale.db");return(l=new(e())(b)).pragma("journal_mode = WAL"),function(a){if(a.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      last_login TEXT,
      preferences TEXT DEFAULT '{}'
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      directory TEXT NOT NULL,
      ports TEXT NOT NULL,
      credentials TEXT NOT NULL,
      auth_providers TEXT DEFAULT '[]',
      backup_settings TEXT DEFAULT '{}',
      container_versions TEXT,
      domain TEXT,
      enabled_services TEXT,
      status TEXT NOT NULL DEFAULT 'stopped',
      last_status_check TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Cloud storage providers table
    CREATE TABLE IF NOT EXISTS cloud_storage_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      s3_config TEXT,
      gcs_config TEXT,
      last_tested_at TEXT,
      last_test_result TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Tasks table
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      type TEXT NOT NULL,
      project_id TEXT NOT NULL,
      cron_expression TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      health_check_config TEXT,
      container_update_config TEXT,
      custom_config TEXT,
      last_run TEXT,
      last_run_status TEXT,
      last_run_duration INTEGER,
      last_run_error TEXT,
      next_run TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Activity log table
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      project_id TEXT,
      user_id TEXT NOT NULL,
      details TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT
    );

    -- Settings table (single row)
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      general TEXT NOT NULL,
      appearance TEXT NOT NULL,
      security TEXT NOT NULL,
      notifications TEXT NOT NULL
    );

    -- Meta table (single row)
    CREATE TABLE IF NOT EXISTS meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_port_assigned INTEGER NOT NULL,
      version TEXT NOT NULL,
      db_version INTEGER NOT NULL
    );

    -- License table (single row)
    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT NOT NULL,
      license_key TEXT NOT NULL,
      license_hash TEXT NOT NULL,
      validated_at TEXT NOT NULL,
      expires_at TEXT,
      features TEXT DEFAULT '[]',
      last_check TEXT
    );

    -- Metrics history table for storing historical system metrics
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      cpu_usage REAL NOT NULL,
      cpu_cores INTEGER NOT NULL,
      cpu_temperature REAL,
      memory_total INTEGER NOT NULL,
      memory_used INTEGER NOT NULL,
      memory_percent REAL NOT NULL,
      disk_total INTEGER NOT NULL,
      disk_used INTEGER NOT NULL,
      disk_percent REAL NOT NULL,
      network_rx INTEGER NOT NULL,
      network_tx INTEGER NOT NULL,
      network_rx_sec REAL NOT NULL,
      network_tx_sec REAL NOT NULL,
      uptime INTEGER NOT NULL
    );

    -- Backups table
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      encrypted INTEGER NOT NULL DEFAULT 0,
      destination TEXT NOT NULL DEFAULT 'local',
      status TEXT NOT NULL DEFAULT 'pending',
      duration INTEGER,
      error_message TEXT,
      task_id TEXT,
      checksum TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Restore jobs table
    CREATE TABLE IF NOT EXISTS restore_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      backup_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      restore_types TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration INTEGER,
      error_message TEXT,
      warnings TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (backup_id) REFERENCES backups(id) ON DELETE CASCADE
    );

    -- API keys table
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      permissions TEXT NOT NULL,
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Security scans table
    CREATE TABLE IF NOT EXISTS security_scans (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      results TEXT,
      error_message TEXT,
      duration INTEGER,
      task_id TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Security snapshots table
    CREATE TABLE IF NOT EXISTS security_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT,
      data TEXT NOT NULL,
      tables_count INTEGER NOT NULL DEFAULT 0,
      policies_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_security_scans_project_id ON security_scans(project_id);
    CREATE INDEX IF NOT EXISTS idx_security_scans_started_at ON security_scans(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_security_scans_type ON security_scans(type);
    CREATE INDEX IF NOT EXISTS idx_security_snapshots_project_id ON security_snapshots(project_id);
    CREATE INDEX IF NOT EXISTS idx_security_snapshots_created_at ON security_snapshots(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(type);
    CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_metrics_history_timestamp ON metrics_history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_backups_project_id ON backups(project_id);
    CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
    CREATE INDEX IF NOT EXISTS idx_backups_destination ON backups(destination);
    CREATE INDEX IF NOT EXISTS idx_restore_jobs_project_id ON restore_jobs(project_id);
    CREATE INDEX IF NOT EXISTS idx_restore_jobs_backup_id ON restore_jobs(backup_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);
  `),!function(a){let b=a.prepare("PRAGMA table_info(projects)").all();b.some(a=>"enabled_services"===a.name)||a.exec("ALTER TABLE projects ADD COLUMN enabled_services TEXT");let c=a.prepare("PRAGMA table_info(cloud_storage_providers)").all(),d=c.some(a=>"azure_config"===a.name),e=c.some(a=>"local_config"===a.name);d||a.exec("ALTER TABLE cloud_storage_providers ADD COLUMN azure_config TEXT"),e||a.exec("ALTER TABLE cloud_storage_providers ADD COLUMN local_config TEXT");let f=a.prepare("PRAGMA table_info(tasks)").all();if(f.some(a=>"backup_config"===a.name)||a.exec("ALTER TABLE tasks ADD COLUMN backup_config TEXT"),a.prepare("PRAGMA table_info(license)").all().some(a=>"update_token"===a.name)||a.exec("ALTER TABLE license ADD COLUMN update_token TEXT"),a.prepare("PRAGMA table_info(api_keys)").all().some(a=>"encrypted_key"===a.name)||a.exec("ALTER TABLE api_keys ADD COLUMN encrypted_key TEXT"),b.some(a=>"auto_start"===a.name)||a.exec("ALTER TABLE projects ADD COLUMN auto_start INTEGER DEFAULT 1"),f.some(a=>"security_scan_config"===a.name)||a.exec("ALTER TABLE tasks ADD COLUMN security_scan_config TEXT"),!a.prepare("PRAGMA table_info(settings)").all().some(a=>"security_scanning"===a.name)){let b=JSON.stringify({enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"});a.exec(`ALTER TABLE settings ADD COLUMN security_scanning TEXT DEFAULT '${b}'`)}}(a),0===a.prepare("SELECT COUNT(*) as count FROM settings").get().count){let b={general:{siteName:"Supascale",serverHost:process.env.SERVER_HOST||"localhost",basePort:54321,portIncrement:1e3,projectsBaseDir:process.env.PROJECTS_BASE_DIR||process.env.HOME||"/home",backupsBaseDir:process.env.BACKUPS_BASE_DIR||`${process.env.HOME}/.supascale_backups`},appearance:{defaultTheme:"system",accentColor:"#3ecf8e"},security:{sessionTimeout:60,requireStrongPasswords:!0,maxLoginAttempts:5},notifications:{enableEmail:!1,emailProvider:"resend",resendApiKey:"",resendFromEmail:"",notificationEmail:"",notifyOnBackupFailure:!0,notifyOnBackupSuccess:!1,notifyOnTaskFailure:!0,notifyOnProjectDown:!0,notifyOnUpdateAvailable:!0,notifyOnSecurityIssues:!0},securityScanning:{enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"}};a.prepare(`
      INSERT INTO settings (id, general, appearance, security, notifications, security_scanning)
      VALUES (1, ?, ?, ?, ?, ?)
    `).run(JSON.stringify(b.general),JSON.stringify(b.appearance),JSON.stringify(b.security),JSON.stringify(b.notifications),JSON.stringify(b.securityScanning))}0===a.prepare("SELECT COUNT(*) as count FROM meta").get().count&&a.prepare(`
      INSERT INTO meta (id, last_port_assigned, version, db_version)
      VALUES (1, ?, '1.0.0', 1)
    `).run(54321)}(l),0===l.prepare("SELECT COUNT(*) as count FROM users").get().count&&(console.warn("WARNING: No admin user found in database."),console.warn("Run the install script or use scripts/setup-admin.js to create an admin user."),console.warn("Example: node scripts/setup-admin.js <username> <password>")),l}function n(){return m().prepare("SELECT * FROM projects ORDER BY created_at DESC").all().map(w)}function o(){return m().prepare("SELECT * FROM projects WHERE auto_start = 1 OR auto_start IS NULL ORDER BY created_at ASC").all().map(w)}function p(a){let b=m().prepare("SELECT * FROM projects WHERE id = ?").get(a);return b?w(b):null}function q(){let a=m().prepare("SELECT * FROM settings WHERE id = 1").get(),b=JSON.parse(a.general),c={enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"};return{general:{serverHost:"localhost",...b},appearance:JSON.parse(a.appearance),security:JSON.parse(a.security),notifications:JSON.parse(a.notifications),securityScanning:a.security_scanning?{...c,...JSON.parse(a.security_scanning)}:c}}function r(a,b,c,d={},e,f="success",g){let i=m();i.prepare(`
    INSERT INTO activity_log (id, timestamp, type, action, project_id, user_id, details, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(h(),new Date().toISOString(),a,b,e||null,c,JSON.stringify(d),f,g||null),i.prepare(`
    DELETE FROM activity_log WHERE id IN (
      SELECT id FROM activity_log ORDER BY timestamp DESC LIMIT -1 OFFSET 10000
    )
  `).run()}function s(a){var b;let c=m().prepare("SELECT * FROM security_scans WHERE id = ?").get(a);return c?{id:(b=c).id,projectId:b.project_id,type:b.type,status:b.status,results:b.results?JSON.parse(b.results):void 0,errorMessage:b.error_message??void 0,duration:b.duration??void 0,taskId:b.task_id??void 0,startedAt:b.started_at,completedAt:b.completed_at??void 0}:null}function t(a){let b=m(),c=h();return b.prepare(`
    INSERT INTO security_scans (
      id, project_id, type, status, results, error_message, duration, task_id, started_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.projectId,a.type,a.status,a.results?JSON.stringify(a.results):null,a.errorMessage??null,a.duration??null,a.taskId??null,a.startedAt,a.completedAt??null),s(c)}function u(a,b){let c=m(),d=s(a);if(!d)return null;let e={...d,...b};return c.prepare(`
    UPDATE security_scans SET
      status = ?,
      results = ?,
      error_message = ?,
      duration = ?,
      completed_at = ?
    WHERE id = ?
  `).run(e.status,e.results?JSON.stringify(e.results):null,e.errorMessage??null,e.duration??null,e.completedAt??null,a),s(a)}let v={vector:!0,db:!0,analytics:!0,kong:!0,auth:!0,rest:!0,meta:!0,studio:!0,realtime:!0,storage:!0,imgproxy:!0,functions:!0,supavisor:!0};function w(a){return{id:a.id,name:a.name,description:a.description||void 0,directory:a.directory,ports:JSON.parse(a.ports),credentials:JSON.parse(a.credentials),authProviders:JSON.parse(a.auth_providers),backupSettings:JSON.parse(a.backup_settings),containerVersions:a.container_versions?JSON.parse(a.container_versions):void 0,domain:a.domain?JSON.parse(a.domain):void 0,enabledServices:a.enabled_services?JSON.parse(a.enabled_services):v,autoStart:0!==a.auto_start,status:a.status,lastStatusCheck:a.last_status_check,createdAt:a.created_at,updatedAt:a.updated_at}}},28041:(a,b,c)=>{c.d(b,{NK:()=>h,io:()=>g});var d=c(79646);let e=(0,c(28354).promisify)(d.exec),f=["docker","docker-compose","podman","podman-compose","git","certbot","openssl","pg_dump","pg_restore","psql","tar","gzip","gunzip","which","npx"];function g(a){return`'${a.replace(/'/g,"'\\''")}'`}async function h(a,b={}){if(!function(a){let b=a.trim().split(/\s+/)[0];return f.some(a=>b===a||b.endsWith(`/${a}`))}(a))throw Error(`Command not allowed: ${a.split(/\s+/)[0]}`);try{let{stdout:c,stderr:d}=await e(a,{cwd:b.cwd,timeout:b.timeout||12e4,env:{...process.env,...b.env},maxBuffer:0xa00000});return{stdout:c,stderr:d,exitCode:0}}catch(a){return{stdout:a.stdout||"",stderr:a.stderr||a.message,exitCode:a.code||1}}}},79358:(a,b,c)=>{c.d(b,{Yc:()=>g});var d=c(16977),e=c.n(d);let f=null;function g(a){if(!a)return a;try{return e().AES.decrypt(a,(!f&&(f=function(){let a=process.env.DB_ENCRYPTION_KEY;if(!a)throw Error("SECURITY ERROR: DB_ENCRYPTION_KEY environment variable must be set. Generate a secure key with: openssl rand -hex 32");if(a.length<32)throw Error("DB_ENCRYPTION_KEY must be at least 32 characters long");return a}()),f)).toString(e().enc.Utf8)}catch{return console.error("Failed to decrypt data"),""}}}};
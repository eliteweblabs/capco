"use strict";exports.id=5552,exports.ids=[5552],exports.modules={2328:(a,b,c)=>{c.d(b,{Ag:()=>m,LV:()=>h,X7:()=>j,jU:()=>l,mC:()=>k,ok:()=>i});var d=c(33873),e=c.n(d),f=c(29021),g=c.n(f);function h(){let a=process.cwd();return!function(){let a=process.cwd();return a.includes(".build/standalone")||a.includes(".build\\standalone")}()?a:e().resolve(a,"..","..")}function i(){let a=h(),b=e().join(a,"data");return g().existsSync(b)||g().mkdirSync(b,{recursive:!0}),b}function j(){return e().join(i(),"supascale.db")}function k(){return e().join(i(),".update-state.json")}function l(){return e().join(h(),".update-status.json")}function m(){return e().join(process.cwd(),".updates")}},15995:(a,b,c)=>{c.d(b,{Yc:()=>i,bk:()=>j,cq:()=>k,w:()=>h});var d=c(58862),e=c.n(d);let f=null;function g(){return f||(f=function(){let a=process.env.DB_ENCRYPTION_KEY;if(!a)throw Error("SECURITY ERROR: DB_ENCRYPTION_KEY environment variable must be set. Generate a secure key with: openssl rand -hex 32");if(a.length<32)throw Error("DB_ENCRYPTION_KEY must be at least 32 characters long");return a}()),f}function h(a){return a?e().AES.encrypt(a,g()).toString():a}function i(a){if(!a)return a;try{return e().AES.decrypt(a,g()).toString(e().enc.Utf8)}catch{return console.error("Failed to decrypt data"),""}}function j(a=40){let b="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",c=e().lib.WordArray.random(a).toString(e().enc.Hex),d="";for(let e=0;e<a;e++){let a=parseInt(c.slice(2*e,2*e+2),16)%b.length;d+=b[a]}return d}function k(){return j(32)}},35552:(a,b,c)=>{c.r(b),c.d(b,{clearLicense:()=>aL,createApiKey:()=>ay,createBackup:()=>$,createCloudStorageProvider:()=>L,createProjectInDb:()=>z,createRestoreJob:()=>ah,createSecurityScan:()=>ao,createSecuritySnapshot:()=>au,createTask:()=>T,db:()=>p,deleteApiKey:()=>aE,deleteBackup:()=>aa,deleteCloudStorageProvider:()=>N,deleteOldSecurityScans:()=>aw,deleteProjectFromDb:()=>B,deleteSecurityScan:()=>aq,deleteSecuritySnapshot:()=>av,deleteTask:()=>W,exportMetricsToCSV:()=>aP,generateApiKey:()=>ax,getActivityLog:()=>H,getAllApiKeys:()=>aC,getAllBackups:()=>X,getAllCloudStorageProviders:()=>I,getAllProjects:()=>w,getAllRestoreJobs:()=>ad,getAllSecurityScans:()=>aj,getAllSecuritySnapshots:()=>ar,getAllTasks:()=>Q,getApiKey:()=>aA,getApiKeysByUser:()=>aB,getAutoStartProjects:()=>x,getBackup:()=>Y,getBackupCount:()=>ab,getBackupStats:()=>ac,getBackupsByProject:()=>Z,getCloudStorageProvider:()=>J,getDb:()=>q,getDecryptedApiKey:()=>az,getDefaultCloudStorageProvider:()=>K,getLatestSecurityScan:()=>am,getLatestSecurityScans:()=>an,getLatestSecuritySnapshot:()=>at,getLicense:()=>aG,getLoginHistory:()=>v,getMetricsHistory:()=>aN,getMetricsSummary:()=>aO,getNextPortRange:()=>E,getProject:()=>y,getRestoreJob:()=>ae,getRestoreJobsByBackup:()=>ag,getRestoreJobsByProject:()=>af,getSecurityScan:()=>ak,getSecurityScansByProject:()=>al,getSecuritySnapshot:()=>as,getSettings:()=>C,getTask:()=>R,getTasksByProject:()=>S,getUpdateCredentials:()=>aK,getUserById:()=>s,hasValidLicense:()=>aH,logActivity:()=>G,saveLicense:()=>aI,saveMetricsHistory:()=>aM,setDefaultCloudStorageProvider:()=>O,updateApiKey:()=>aF,updateBackup:()=>_,updateCloudStorageProvider:()=>M,updateLastPort:()=>F,updateLicenseLastCheck:()=>aJ,updateProject:()=>A,updateProviderTestResult:()=>P,updateRestoreJob:()=>ai,updateSecurityScan:()=>ap,updateSettings:()=>D,updateTask:()=>U,updateTaskRun:()=>V,updateUser:()=>t,validateApiKey:()=>aD,validateUser:()=>r,verifyUserPassword:()=>u});var d=c(87550),e=c.n(d),f=c(29021),g=c.n(f),h=c(87082),i=c.n(h),j=c(70673),k=c(2328),l=c(70401),m=c(15995),n=c(55511),o=c.n(n);let p=null;function q(){if(p)return p;let a=(0,k.ok)();g().existsSync(a)||g().mkdirSync(a,{recursive:!0});let b=(0,k.X7)();return(p=new(e())(b)).pragma("journal_mode = WAL"),function(a){if(a.exec(`
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
  `),!function(a){let b=a.prepare("PRAGMA table_info(projects)").all();b.some(a=>"enabled_services"===a.name)||a.exec("ALTER TABLE projects ADD COLUMN enabled_services TEXT");let c=a.prepare("PRAGMA table_info(cloud_storage_providers)").all(),d=c.some(a=>"azure_config"===a.name),e=c.some(a=>"local_config"===a.name);d||a.exec("ALTER TABLE cloud_storage_providers ADD COLUMN azure_config TEXT"),e||a.exec("ALTER TABLE cloud_storage_providers ADD COLUMN local_config TEXT");let f=a.prepare("PRAGMA table_info(tasks)").all();if(f.some(a=>"backup_config"===a.name)||a.exec("ALTER TABLE tasks ADD COLUMN backup_config TEXT"),a.prepare("PRAGMA table_info(license)").all().some(a=>"update_token"===a.name)||a.exec("ALTER TABLE license ADD COLUMN update_token TEXT"),a.prepare("PRAGMA table_info(api_keys)").all().some(a=>"encrypted_key"===a.name)||a.exec("ALTER TABLE api_keys ADD COLUMN encrypted_key TEXT"),b.some(a=>"auto_start"===a.name)||a.exec("ALTER TABLE projects ADD COLUMN auto_start INTEGER DEFAULT 1"),f.some(a=>"security_scan_config"===a.name)||a.exec("ALTER TABLE tasks ADD COLUMN security_scan_config TEXT"),!a.prepare("PRAGMA table_info(settings)").all().some(a=>"security_scanning"===a.name)){let b=JSON.stringify({enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"});a.exec(`ALTER TABLE settings ADD COLUMN security_scanning TEXT DEFAULT '${b}'`)}}(a),0===a.prepare("SELECT COUNT(*) as count FROM settings").get().count){let b={general:{siteName:"Supascale",serverHost:process.env.SERVER_HOST||"localhost",basePort:l.K4,portIncrement:l.Ss,projectsBaseDir:process.env.PROJECTS_BASE_DIR||process.env.HOME||"/home",backupsBaseDir:process.env.BACKUPS_BASE_DIR||`${process.env.HOME}/.supascale_backups`},appearance:{defaultTheme:"system",accentColor:"#3ecf8e"},security:{sessionTimeout:60,requireStrongPasswords:!0,maxLoginAttempts:5},notifications:{enableEmail:!1,emailProvider:"resend",resendApiKey:"",resendFromEmail:"",notificationEmail:"",notifyOnBackupFailure:!0,notifyOnBackupSuccess:!1,notifyOnTaskFailure:!0,notifyOnProjectDown:!0,notifyOnUpdateAvailable:!0,notifyOnSecurityIssues:!0},securityScanning:{enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"}};a.prepare(`
      INSERT INTO settings (id, general, appearance, security, notifications, security_scanning)
      VALUES (1, ?, ?, ?, ?, ?)
    `).run(JSON.stringify(b.general),JSON.stringify(b.appearance),JSON.stringify(b.security),JSON.stringify(b.notifications),JSON.stringify(b.securityScanning))}0===a.prepare("SELECT COUNT(*) as count FROM meta").get().count&&a.prepare(`
      INSERT INTO meta (id, last_port_assigned, version, db_version)
      VALUES (1, ?, '1.0.0', 1)
    `).run(l.K4)}(p),0===p.prepare("SELECT COUNT(*) as count FROM users").get().count&&(console.warn("WARNING: No admin user found in database."),console.warn("Run the install script or use scripts/setup-admin.js to create an admin user."),console.warn("Example: node scripts/setup-admin.js <username> <password>")),p}function r(a,b){let c=q(),d=c.prepare("SELECT * FROM users WHERE username = ?").get(a);return d&&i().compareSync(b,d.password_hash)?(c.prepare("UPDATE users SET last_login = ? WHERE id = ?").run(new Date().toISOString(),d.id),aQ(d)):null}function s(a){let b=q().prepare("SELECT * FROM users WHERE id = ?").get(a);return b?aQ(b):null}function t(a,b){let c=q(),d=s(a);if(!d)return{success:!1,error:"User not found"};if(b.username&&b.username!==d.username&&c.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(b.username,a))return{success:!1,error:"Username already taken"};let e=[],f=[];if(b.username&&(e.push("username = ?"),f.push(b.username)),b.password){let a=i().hashSync(b.password,12);e.push("password_hash = ?"),f.push(a)}return 0===e.length||(f.push(a),c.prepare(`UPDATE users SET ${e.join(", ")} WHERE id = ?`).run(...f)),{success:!0}}function u(a,b){let c=q().prepare("SELECT password_hash FROM users WHERE id = ?").get(a);return!!c&&i().compareSync(b,c.password_hash)}function v(a,b=50,c=0){return H({type:"auth",limit:b,offset:c})}function w(){return q().prepare("SELECT * FROM projects ORDER BY created_at DESC").all().map(aS)}function x(){return q().prepare("SELECT * FROM projects WHERE auto_start = 1 OR auto_start IS NULL ORDER BY created_at ASC").all().map(aS)}function y(a){let b=q().prepare("SELECT * FROM projects WHERE id = ?").get(a);return b?aS(b):null}function z(a){q().prepare(`
    INSERT INTO projects (
      id, name, description, directory, ports, credentials,
      auth_providers, backup_settings, enabled_services, auto_start, status, last_status_check,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(a.id,a.name,a.description||null,a.directory,JSON.stringify(a.ports),JSON.stringify(a.credentials),JSON.stringify(a.authProviders),JSON.stringify(a.backupSettings),JSON.stringify(a.enabledServices),+(!1!==a.autoStart),a.status,a.lastStatusCheck,a.createdAt,a.updatedAt)}function A(a,b){let c=q(),d=y(a);if(!d)return;let e={...d,...b,updatedAt:new Date().toISOString()};c.prepare(`
    UPDATE projects SET
      name = ?, description = ?, directory = ?, ports = ?, credentials = ?,
      auth_providers = ?, backup_settings = ?, container_versions = ?,
      domain = ?, auto_start = ?, status = ?, last_status_check = ?, updated_at = ?
    WHERE id = ?
  `).run(e.name,e.description||null,e.directory,JSON.stringify(e.ports),JSON.stringify(e.credentials),JSON.stringify(e.authProviders),JSON.stringify(e.backupSettings),e.containerVersions?JSON.stringify(e.containerVersions):null,e.domain?JSON.stringify(e.domain):null,+(!1!==e.autoStart),e.status,e.lastStatusCheck,e.updatedAt,a)}function B(a){q().prepare("DELETE FROM projects WHERE id = ?").run(a)}function C(){let a=q().prepare("SELECT * FROM settings WHERE id = 1").get(),b=JSON.parse(a.general),c={enabled:!0,scanTime:"03:00",scanTypes:["audit","coverage"],minSeverityToNotify:"high"};return{general:{serverHost:"localhost",...b},appearance:JSON.parse(a.appearance),security:JSON.parse(a.security),notifications:JSON.parse(a.notifications),securityScanning:a.security_scanning?{...c,...JSON.parse(a.security_scanning)}:c}}function D(a){let b=q(),c=C(),d={general:{...c.general,...a.general},appearance:{...c.appearance,...a.appearance},security:{...c.security,...a.security},notifications:{...c.notifications,...a.notifications},securityScanning:{...c.securityScanning,...a.securityScanning}};return b.prepare(`
    UPDATE settings SET general = ?, appearance = ?, security = ?, notifications = ?, security_scanning = ?
    WHERE id = 1
  `).run(JSON.stringify(d.general),JSON.stringify(d.appearance),JSON.stringify(d.security),JSON.stringify(d.notifications),JSON.stringify(d.securityScanning)),d}function E(){let a=q(),b=C(),c=b.general.basePort,d=b.general.portIncrement,e=a.prepare("SELECT ports FROM projects").all(),f=new Set;for(let a of e)try{let b=JSON.parse(a.ports);f.add(b.api)}catch{}if(0===f.size)return c;let g=c;for(;f.has(g);)g+=d;return g}function F(a){let b=q();a>b.prepare("SELECT last_port_assigned FROM meta WHERE id = 1").get().last_port_assigned&&b.prepare("UPDATE meta SET last_port_assigned = ? WHERE id = 1").run(a)}function G(a,b,c,d={},e,f="success",g){let h=q();h.prepare(`
    INSERT INTO activity_log (id, timestamp, type, action, project_id, user_id, details, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run((0,j.$C)(),new Date().toISOString(),a,b,e||null,c,JSON.stringify(d),f,g||null),h.prepare(`
    DELETE FROM activity_log WHERE id IN (
      SELECT id FROM activity_log ORDER BY timestamp DESC LIMIT -1 OFFSET 10000
    )
  `).run()}function H(a={}){let b=q(),{type:c,projectId:d,status:e,from:f,to:g,limit:h=50,offset:i=0}=a,j="1=1",k=[];c&&(j+=" AND type = ?",k.push(c)),d&&(j+=" AND project_id = ?",k.push(d)),e&&(j+=" AND status = ?",k.push(e)),f&&(j+=" AND timestamp >= ?",k.push(f)),g&&(j+=" AND timestamp <= ?",k.push(g));let l=b.prepare(`SELECT COUNT(*) as count FROM activity_log WHERE ${j}`).get(...k);return{entries:b.prepare(`
    SELECT * FROM activity_log WHERE ${j}
    ORDER BY timestamp DESC LIMIT ? OFFSET ?
  `).all(...k,h,i).map(aT),total:l.count}}function I(){return q().prepare("SELECT * FROM cloud_storage_providers ORDER BY created_at DESC").all().map(aU)}function J(a){let b=q().prepare("SELECT * FROM cloud_storage_providers WHERE id = ?").get(a);return b?aU(b):null}function K(){let a=q().prepare("SELECT * FROM cloud_storage_providers WHERE is_default = 1").get();return a?aU(a):null}function L(a){let b=q(),c=(0,j.$C)(),d=new Date().toISOString();return a.isDefault&&b.prepare("UPDATE cloud_storage_providers SET is_default = 0").run(),b.prepare(`
    INSERT INTO cloud_storage_providers (
      id, name, type, is_default, s3_config, gcs_config, azure_config, local_config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.name,a.type,+!!a.isDefault,a.s3Config?JSON.stringify(a.s3Config):null,a.gcsConfig?JSON.stringify(a.gcsConfig):null,a.azureConfig?JSON.stringify(a.azureConfig):null,a.localConfig?JSON.stringify(a.localConfig):null,d,d),J(c)}function M(a,b){let c=q(),d=J(a);if(!d)return null;let e=new Date().toISOString();b.isDefault&&c.prepare("UPDATE cloud_storage_providers SET is_default = 0 WHERE id != ?").run(a);let f={...d,...b,updatedAt:e};return c.prepare(`
    UPDATE cloud_storage_providers SET
      name = ?,
      type = ?,
      is_default = ?,
      s3_config = ?,
      gcs_config = ?,
      azure_config = ?,
      local_config = ?,
      last_tested_at = ?,
      last_test_result = ?,
      updated_at = ?
    WHERE id = ?
  `).run(f.name,f.type,+!!f.isDefault,f.s3Config?JSON.stringify(f.s3Config):null,f.gcsConfig?JSON.stringify(f.gcsConfig):null,f.azureConfig?JSON.stringify(f.azureConfig):null,f.localConfig?JSON.stringify(f.localConfig):null,f.lastTestedAt||null,f.lastTestResult||null,e,a),J(a)}function N(a){return q().prepare("DELETE FROM cloud_storage_providers WHERE id = ?").run(a).changes>0}function O(a){let b=q();return!!J(a)&&(b.prepare("UPDATE cloud_storage_providers SET is_default = 0").run(),b.prepare("UPDATE cloud_storage_providers SET is_default = 1 WHERE id = ?").run(a),!0)}function P(a,b){let c=q(),d=new Date().toISOString();return c.prepare(`
    UPDATE cloud_storage_providers SET
      last_tested_at = ?,
      last_test_result = ?,
      updated_at = ?
    WHERE id = ?
  `).run(d,b?"success":"failure",d,a).changes>0}function Q(){return q().prepare("SELECT * FROM tasks ORDER BY created_at DESC").all().map(aV)}function R(a){let b=q().prepare("SELECT * FROM tasks WHERE id = ?").get(a);return b?aV(b):null}function S(a){return q().prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC").all(a).map(aV)}function T(a){let b=q(),c=new Date().toISOString(),d=(0,j.$C)();return b.prepare(`
    INSERT INTO tasks (
      id, name, enabled, type, project_id, cron_expression, timezone,
      health_check_config, container_update_config, custom_config, backup_config, security_scan_config,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(d,a.name,+!!a.enabled,a.type,a.projectId,a.cronExpression,a.timezone,a.healthCheckConfig?JSON.stringify(a.healthCheckConfig):null,a.containerUpdateConfig?JSON.stringify(a.containerUpdateConfig):null,a.customConfig?JSON.stringify(a.customConfig):null,a.backupConfig?JSON.stringify(a.backupConfig):null,a.securityScanConfig?JSON.stringify(a.securityScanConfig):null,c,c),R(d)}function U(a,b){let c=q(),d=R(a);if(!d)return null;let e=new Date().toISOString();return c.prepare(`
    UPDATE tasks SET
      name = ?,
      enabled = ?,
      type = ?,
      project_id = ?,
      cron_expression = ?,
      timezone = ?,
      health_check_config = ?,
      container_update_config = ?,
      custom_config = ?,
      backup_config = ?,
      security_scan_config = ?,
      next_run = ?,
      updated_at = ?
    WHERE id = ?
  `).run(b.name??d.name,b.enabled??d.enabled?1:0,b.type??d.type,b.projectId??d.projectId,b.cronExpression??d.cronExpression,b.timezone??d.timezone,b.healthCheckConfig?JSON.stringify(b.healthCheckConfig):d.healthCheckConfig?JSON.stringify(d.healthCheckConfig):null,b.containerUpdateConfig?JSON.stringify(b.containerUpdateConfig):d.containerUpdateConfig?JSON.stringify(d.containerUpdateConfig):null,b.customConfig?JSON.stringify(b.customConfig):d.customConfig?JSON.stringify(d.customConfig):null,b.backupConfig?JSON.stringify(b.backupConfig):d.backupConfig?JSON.stringify(d.backupConfig):null,b.securityScanConfig?JSON.stringify(b.securityScanConfig):d.securityScanConfig?JSON.stringify(d.securityScanConfig):null,b.nextRun??d.nextRun??null,e,a),R(a)}function V(a,b,c,d,e){let f=q(),g=new Date().toISOString();f.prepare(`
    UPDATE tasks SET
      last_run = ?,
      last_run_status = ?,
      last_run_duration = ?,
      last_run_error = ?,
      next_run = ?,
      updated_at = ?
    WHERE id = ?
  `).run(g,b,c??null,d??null,e??null,g,a)}function W(a){return q().prepare("DELETE FROM tasks WHERE id = ?").run(a).changes>0}function X(a={}){let b=q(),{projectId:c,status:d,destination:e,limit:f=50,offset:g=0}=a,h="1=1",i=[];c&&(h+=" AND project_id = ?",i.push(c)),d&&(h+=" AND status = ?",i.push(d)),e&&(h+=" AND destination = ?",i.push(e));let j=b.prepare(`SELECT COUNT(*) as count FROM backups WHERE ${h}`).get(...i);return{backups:b.prepare(`
    SELECT * FROM backups WHERE ${h}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...i,f,g).map(aY),total:j.count}}function Y(a){let b=q().prepare("SELECT * FROM backups WHERE id = ?").get(a);return b?aY(b):null}function Z(a){return q().prepare("SELECT * FROM backups WHERE project_id = ? ORDER BY created_at DESC").all(a).map(aY)}function $(a){let b=q(),c=(0,j.$C)(),d=new Date().toISOString();return b.prepare(`
    INSERT INTO backups (
      id, project_id, type, filename, path, size, encrypted, destination,
      status, duration, error_message, task_id, checksum, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.projectId,a.type,a.filename,a.path,a.size,+!!a.encrypted,a.destination,a.status,a.duration??null,a.errorMessage??null,a.taskId??null,a.checksum??null,a.metadata?JSON.stringify(a.metadata):null,d),Y(c)}function _(a,b){let c=q(),d=Y(a);if(!d)return null;let e={...d,...b};return c.prepare(`
    UPDATE backups SET
      status = ?,
      size = ?,
      duration = ?,
      error_message = ?,
      checksum = ?,
      metadata = ?
    WHERE id = ?
  `).run(e.status,e.size,e.duration??null,e.errorMessage??null,e.checksum??null,e.metadata?JSON.stringify(e.metadata):null,a),Y(a)}function aa(a){return q().prepare("DELETE FROM backups WHERE id = ?").run(a).changes>0}function ab(a){let b=q();return a?b.prepare("SELECT COUNT(*) as count FROM backups WHERE project_id = ?").get(a).count:b.prepare("SELECT COUNT(*) as count FROM backups").get().count}function ac(){let a=q(),b=a.prepare("SELECT COUNT(*) as count FROM backups").get().count,c=a.prepare("SELECT COALESCE(SUM(size), 0) as total FROM backups WHERE status = ?").get("completed").total;return{total:b,totalSize:c,byType:a.prepare("SELECT type, COUNT(*) as count FROM backups GROUP BY type").all().reduce((a,b)=>(a[b.type]=b.count,a),{}),byStatus:a.prepare("SELECT status, COUNT(*) as count FROM backups GROUP BY status").all().reduce((a,b)=>(a[b.status]=b.count,a),{})}}function ad(a={}){let b=q(),{projectId:c,status:d,limit:e=50,offset:f=0}=a,g="1=1",h=[];c&&(g+=" AND project_id = ?",h.push(c)),d&&(g+=" AND status = ?",h.push(d));let i=b.prepare(`SELECT COUNT(*) as count FROM restore_jobs WHERE ${g}`).get(...h);return{jobs:b.prepare(`
    SELECT * FROM restore_jobs WHERE ${g}
    ORDER BY started_at DESC LIMIT ? OFFSET ?
  `).all(...h,e,f).map(aZ),total:i.count}}function ae(a){let b=q().prepare("SELECT * FROM restore_jobs WHERE id = ?").get(a);return b?aZ(b):null}function af(a){return q().prepare("SELECT * FROM restore_jobs WHERE project_id = ? ORDER BY started_at DESC").all(a).map(aZ)}function ag(a){return q().prepare("SELECT * FROM restore_jobs WHERE backup_id = ? ORDER BY started_at DESC").all(a).map(aZ)}function ah(a){let b=q(),c=(0,j.$C)();return b.prepare(`
    INSERT INTO restore_jobs (
      id, project_id, backup_id, status, restore_types, started_at,
      completed_at, duration, error_message, warnings
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.projectId,a.backupId,a.status,JSON.stringify(a.restoreTypes),a.startedAt,a.completedAt??null,a.duration??null,a.errorMessage??null,a.warnings?JSON.stringify(a.warnings):null),ae(c)}function ai(a,b){let c=q(),d=ae(a);if(!d)return null;let e={...d,...b};return c.prepare(`
    UPDATE restore_jobs SET
      status = ?,
      completed_at = ?,
      duration = ?,
      error_message = ?,
      warnings = ?
    WHERE id = ?
  `).run(e.status,e.completedAt??null,e.duration??null,e.errorMessage??null,e.warnings?JSON.stringify(e.warnings):null,a),ae(a)}function aj(a={}){let b=q(),{projectId:c,type:d,status:e,limit:f=50,offset:g=0}=a,h="1=1",i=[];c&&(h+=" AND project_id = ?",i.push(c)),d&&(h+=" AND type = ?",i.push(d)),e&&(h+=" AND status = ?",i.push(e));let j=b.prepare(`SELECT COUNT(*) as count FROM security_scans WHERE ${h}`).get(...i);return{scans:b.prepare(`
    SELECT * FROM security_scans WHERE ${h}
    ORDER BY started_at DESC LIMIT ? OFFSET ?
  `).all(...i,f,g).map(a$),total:j.count}}function ak(a){let b=q().prepare("SELECT * FROM security_scans WHERE id = ?").get(a);return b?a$(b):null}function al(a,b=50){return q().prepare("SELECT * FROM security_scans WHERE project_id = ? ORDER BY started_at DESC LIMIT ?").all(a,b).map(a$)}function am(a,b){let c=q().prepare("SELECT * FROM security_scans WHERE project_id = ? AND type = ? ORDER BY started_at DESC LIMIT 1").get(a,b);return c?a$(c):null}function an(a){return{audit:am(a,"audit"),coverage:am(a,"coverage"),storage:am(a,"storage"),snapshot:am(a,"snapshot")}}function ao(a){let b=q(),c=(0,j.$C)();return b.prepare(`
    INSERT INTO security_scans (
      id, project_id, type, status, results, error_message, duration, task_id, started_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.projectId,a.type,a.status,a.results?JSON.stringify(a.results):null,a.errorMessage??null,a.duration??null,a.taskId??null,a.startedAt,a.completedAt??null),ak(c)}function ap(a,b){let c=q(),d=ak(a);if(!d)return null;let e={...d,...b};return c.prepare(`
    UPDATE security_scans SET
      status = ?,
      results = ?,
      error_message = ?,
      duration = ?,
      completed_at = ?
    WHERE id = ?
  `).run(e.status,e.results?JSON.stringify(e.results):null,e.errorMessage??null,e.duration??null,e.completedAt??null,a),ak(a)}function aq(a){return q().prepare("DELETE FROM security_scans WHERE id = ?").run(a).changes>0}function ar(a,b=50){return q().prepare("SELECT * FROM security_snapshots WHERE project_id = ? ORDER BY created_at DESC LIMIT ?").all(a,b).map(a_)}function as(a){let b=q().prepare("SELECT * FROM security_snapshots WHERE id = ?").get(a);return b?a_(b):null}function at(a){let b=q().prepare("SELECT * FROM security_snapshots WHERE project_id = ? ORDER BY created_at DESC LIMIT 1").get(a);return b?a_(b):null}function au(a){let b=q(),c=(0,j.$C)();return b.prepare(`
    INSERT INTO security_snapshots (
      id, project_id, name, data, tables_count, policies_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(c,a.projectId,a.name??null,a.data,a.tablesCount,a.policiesCount,a.createdAt),as(c)}function av(a){return q().prepare("DELETE FROM security_snapshots WHERE id = ?").run(a).changes>0}function aw(a,b=50){return q().prepare(`
    DELETE FROM security_scans
    WHERE project_id = ? AND id NOT IN (
      SELECT id FROM security_scans
      WHERE project_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    )
  `).run(a,a,b).changes}function ax(){let a=o().randomBytes(32).toString("hex"),b=`supascale_${a}`,c=b.substring(0,14),d=o().createHash("sha256").update(b).digest("hex");return{key:b,prefix:c,hash:d}}function ay(a,b,c,d){let e=q(),f=(0,j.$C)(),g=new Date().toISOString(),{key:h,prefix:i,hash:k}=ax(),l=(0,m.w)(h);return e.prepare(`
    INSERT INTO api_keys (
      id, name, key_prefix, key_hash, permissions, expires_at, created_at, created_by, encrypted_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(f,a,i,k,JSON.stringify(b),d??null,g,c,l),{apiKey:aA(f),fullKey:h}}function az(a){let b=q().prepare("SELECT encrypted_key FROM api_keys WHERE id = ?").get(a);return b&&b.encrypted_key?(0,m.Yc)(b.encrypted_key):null}function aA(a){let b=q().prepare("SELECT * FROM api_keys WHERE id = ?").get(a);return b?aW(b):null}function aB(a){return q().prepare("SELECT * FROM api_keys WHERE created_by = ? ORDER BY created_at DESC").all(a).map(aW)}function aC(){return q().prepare("SELECT * FROM api_keys ORDER BY created_at DESC").all().map(aW)}function aD(a){let b=q(),c=o().createHash("sha256").update(a).digest("hex"),d=b.prepare("SELECT * FROM api_keys WHERE key_hash = ?").get(c);if(!d)return null;let e=aW(d);if(e.expiresAt&&new Date(e.expiresAt)<new Date)return null;let f=new Date().toISOString();return b.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(f,e.id),e}function aE(a){return q().prepare("DELETE FROM api_keys WHERE id = ?").run(a).changes>0}function aF(a,b){let c=q();return aA(a)?(void 0!==b.name&&c.prepare("UPDATE api_keys SET name = ? WHERE id = ?").run(b.name,a),void 0!==b.permissions&&c.prepare("UPDATE api_keys SET permissions = ? WHERE id = ?").run(JSON.stringify(b.permissions),a),void 0!==b.expiresAt&&c.prepare("UPDATE api_keys SET expires_at = ? WHERE id = ?").run(b.expiresAt,a),aA(a)):null}function aG(){var a;let b=q().prepare("SELECT * FROM license WHERE id = 1").get();return b?{email:(a=b).email,licenseKey:a.license_key,licenseHash:a.license_hash,validatedAt:a.validated_at,expiresAt:a.expires_at||void 0,features:JSON.parse(a.features),lastCheck:a.last_check||void 0,updateToken:a.update_token||void 0}:null}function aH(){process.env.SKIP_LICENSE_CHECK;let a=aG();return!(!a||a.expiresAt&&new Date(a.expiresAt)<new Date)&&!0}function aI(a){let b=q(),c=aG(),d=new Date().toISOString();c?b.prepare(`
      UPDATE license SET
        email = ?, license_key = ?, license_hash = ?,
        validated_at = ?, expires_at = ?, features = ?, last_check = ?, update_token = ?
      WHERE id = 1
    `).run(a.email,a.licenseKey,a.licenseHash,a.validatedAt,a.expiresAt||null,JSON.stringify(a.features),d,a.updateToken||null):b.prepare(`
      INSERT INTO license (id, email, license_key, license_hash, validated_at, expires_at, features, last_check, update_token)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.email,a.licenseKey,a.licenseHash,a.validatedAt,a.expiresAt||null,JSON.stringify(a.features),d,a.updateToken||null)}function aJ(){q().prepare("UPDATE license SET last_check = ? WHERE id = 1").run(new Date().toISOString())}function aK(){let a=aG();if(a?.email&&a?.updateToken)return{email:a.email,updateToken:a.updateToken};let b=process.env.LICENSE_EMAIL,c=process.env.UPDATE_TOKEN;if(b&&c){if(a&&(!a.updateToken||!a.email))try{q().prepare(`
          UPDATE license
          SET email = COALESCE(email, ?), update_token = COALESCE(update_token, ?)
          WHERE id = 1
        `).run(b,c)}catch(a){console.error("Failed to save update credentials to database:",a)}return{email:b,updateToken:c}}return null}function aL(){q().prepare("DELETE FROM license WHERE id = 1").run()}function aM(a){let b=q();b.prepare(`
    INSERT INTO metrics_history (
      timestamp, cpu_usage, cpu_cores, cpu_temperature,
      memory_total, memory_used, memory_percent,
      disk_total, disk_used, disk_percent,
      network_rx, network_tx, network_rx_sec, network_tx_sec, uptime
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(a.timestamp,a.cpuUsage,a.cpuCores,a.cpuTemperature??null,a.memoryTotal,a.memoryUsed,a.memoryPercent,a.diskTotal,a.diskUsed,a.diskPercent,a.networkRx,a.networkTx,a.networkRxSec,a.networkTxSec,a.uptime);let c=new Date;c.setDate(c.getDate()-7),b.prepare(`
    DELETE FROM metrics_history WHERE timestamp < ?
  `).run(c.toISOString())}function aN(a={}){let b=q(),{from:c,to:d,interval:e="minute",limit:f=1e3}=a,g="1=1",h=[];return c&&(g+=" AND timestamp >= ?",h.push(c)),d&&(g+=" AND timestamp <= ?",h.push(d)),b.prepare(`
    SELECT * FROM metrics_history
    WHERE ${g}
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(...h,f).map(aX).reverse()}function aO(a,b){let c=q().prepare(`
    SELECT
      AVG(cpu_usage) as avg_cpu,
      MAX(cpu_usage) as max_cpu,
      AVG(memory_percent) as avg_memory,
      MAX(memory_percent) as max_memory,
      AVG(disk_percent) as avg_disk,
      MAX(disk_percent) as max_disk,
      MAX(network_rx) - MIN(network_rx) as total_network_rx,
      MAX(network_tx) - MIN(network_tx) as total_network_tx,
      COUNT(*) as data_points
    FROM metrics_history
    WHERE timestamp >= ? AND timestamp <= ?
  `).get(a,b);return{avgCpu:c.avg_cpu||0,maxCpu:c.max_cpu||0,avgMemory:c.avg_memory||0,maxMemory:c.max_memory||0,avgDisk:c.avg_disk||0,maxDisk:c.max_disk||0,totalNetworkRx:c.total_network_rx||0,totalNetworkTx:c.total_network_tx||0,dataPoints:c.data_points||0}}function aP(a,b){return["Timestamp,CPU Usage %,CPU Cores,CPU Temp,Memory Total,Memory Used,Memory %,Disk Total,Disk Used,Disk %,Network RX,Network TX,Network RX/s,Network TX/s,Uptime",...aN({from:a,to:b,limit:1e5}).map(a=>[a.timestamp,a.cpuUsage.toFixed(2),a.cpuCores,a.cpuTemperature?.toFixed(1)||"",a.memoryTotal,a.memoryUsed,a.memoryPercent.toFixed(2),a.diskTotal,a.diskUsed,a.diskPercent.toFixed(2),a.networkRx,a.networkTx,a.networkRxSec.toFixed(2),a.networkTxSec.toFixed(2),a.uptime].join(","))].join("\n")}function aQ(a){return{id:a.id,username:a.username,passwordHash:a.password_hash,role:a.role,createdAt:a.created_at,lastLogin:a.last_login||a.created_at,preferences:JSON.parse(a.preferences)}}let aR={vector:!0,db:!0,analytics:!0,kong:!0,auth:!0,rest:!0,meta:!0,studio:!0,realtime:!0,storage:!0,imgproxy:!0,functions:!0,supavisor:!0};function aS(a){return{id:a.id,name:a.name,description:a.description||void 0,directory:a.directory,ports:JSON.parse(a.ports),credentials:JSON.parse(a.credentials),authProviders:JSON.parse(a.auth_providers),backupSettings:JSON.parse(a.backup_settings),containerVersions:a.container_versions?JSON.parse(a.container_versions):void 0,domain:a.domain?JSON.parse(a.domain):void 0,enabledServices:a.enabled_services?JSON.parse(a.enabled_services):aR,autoStart:0!==a.auto_start,status:a.status,lastStatusCheck:a.last_status_check,createdAt:a.created_at,updatedAt:a.updated_at}}function aT(a){return{id:a.id,timestamp:a.timestamp,type:a.type,action:a.action,projectId:a.project_id||void 0,userId:a.user_id,details:JSON.parse(a.details),status:a.status,errorMessage:a.error_message||void 0}}function aU(a){return{id:a.id,name:a.name,type:a.type,isDefault:1===a.is_default,s3Config:a.s3_config?JSON.parse(a.s3_config):void 0,gcsConfig:a.gcs_config?JSON.parse(a.gcs_config):void 0,azureConfig:a.azure_config?JSON.parse(a.azure_config):void 0,localConfig:a.local_config?JSON.parse(a.local_config):void 0,lastTestedAt:a.last_tested_at||void 0,lastTestResult:a.last_test_result,createdAt:a.created_at,updatedAt:a.updated_at}}function aV(a){return{id:a.id,name:a.name,enabled:1===a.enabled,type:a.type,projectId:a.project_id,cronExpression:a.cron_expression,timezone:a.timezone,healthCheckConfig:a.health_check_config?JSON.parse(a.health_check_config):void 0,containerUpdateConfig:a.container_update_config?JSON.parse(a.container_update_config):void 0,customConfig:a.custom_config?JSON.parse(a.custom_config):void 0,backupConfig:a.backup_config?JSON.parse(a.backup_config):void 0,securityScanConfig:a.security_scan_config?JSON.parse(a.security_scan_config):void 0,lastRun:a.last_run||void 0,lastRunStatus:a.last_run_status,lastRunDuration:a.last_run_duration??void 0,lastRunError:a.last_run_error||void 0,nextRun:a.next_run||void 0,createdAt:a.created_at,updatedAt:a.updated_at}}function aW(a){return{id:a.id,name:a.name,keyPrefix:a.key_prefix,keyHash:a.key_hash,permissions:JSON.parse(a.permissions),lastUsedAt:a.last_used_at||void 0,expiresAt:a.expires_at||void 0,createdAt:a.created_at,createdBy:a.created_by}}function aX(a){return{id:a.id,timestamp:a.timestamp,cpuUsage:a.cpu_usage,cpuCores:a.cpu_cores,cpuTemperature:a.cpu_temperature??void 0,memoryTotal:a.memory_total,memoryUsed:a.memory_used,memoryPercent:a.memory_percent,diskTotal:a.disk_total,diskUsed:a.disk_used,diskPercent:a.disk_percent,networkRx:a.network_rx,networkTx:a.network_tx,networkRxSec:a.network_rx_sec,networkTxSec:a.network_tx_sec,uptime:a.uptime}}function aY(a){return{id:a.id,projectId:a.project_id,type:a.type,filename:a.filename,path:a.path,size:a.size,encrypted:1===a.encrypted,destination:a.destination,status:a.status,duration:a.duration??void 0,errorMessage:a.error_message??void 0,taskId:a.task_id??void 0,checksum:a.checksum??void 0,metadata:a.metadata?JSON.parse(a.metadata):void 0,createdAt:a.created_at}}function aZ(a){return{id:a.id,projectId:a.project_id,backupId:a.backup_id,status:a.status,restoreTypes:JSON.parse(a.restore_types),startedAt:a.started_at,completedAt:a.completed_at??void 0,duration:a.duration??void 0,errorMessage:a.error_message??void 0,warnings:a.warnings?JSON.parse(a.warnings):void 0}}function a$(a){return{id:a.id,projectId:a.project_id,type:a.type,status:a.status,results:a.results?JSON.parse(a.results):void 0,errorMessage:a.error_message??void 0,duration:a.duration??void 0,taskId:a.task_id??void 0,startedAt:a.started_at,completedAt:a.completed_at??void 0}}function a_(a){return{id:a.id,projectId:a.project_id,name:a.name??void 0,data:a.data,tablesCount:a.tables_count,policiesCount:a.policies_count,createdAt:a.created_at}}},70401:(a,b,c)=>{c.d(b,{IQ:()=>k,K4:()=>h,Ss:()=>i,VM:()=>j,Vh:()=>f,it:()=>g,qK:()=>d});let d=["studio","kong","auth","rest","realtime","storage","imgproxy","meta","functions","analytics","db","vector","supavisor"],e={vector:{id:"vector",name:"Vector",description:"Log aggregation and collection service. Required for all other services.",category:"core",canDisable:!1,dependencies:[],requiredBy:["db"],memoryMb:50,icon:"FileText"},db:{id:"db",name:"PostgreSQL Database",description:"The core PostgreSQL database with Supabase extensions.",category:"core",canDisable:!1,dependencies:["vector"],requiredBy:["analytics","auth","rest","realtime","storage","meta","supavisor"],memoryMb:200,icon:"Database"},analytics:{id:"analytics",name:"Analytics (Logflare)",description:"Logging and analytics backend. Required by most services for health checks.",category:"core",canDisable:!1,dependencies:["db"],requiredBy:["studio","kong","auth","rest","realtime","meta","functions","supavisor"],memoryMb:150,icon:"BarChart3"},kong:{id:"kong",name:"API Gateway (Kong)",description:"HTTP/HTTPS API gateway. Main entry point for all API requests.",category:"recommended",canDisable:!0,dependencies:["analytics"],requiredBy:[],memoryMb:100,icon:"Globe"},auth:{id:"auth",name:"Authentication (GoTrue)",description:"User authentication, JWT tokens, and OAuth provider integration.",category:"recommended",canDisable:!0,dependencies:["db","analytics"],requiredBy:[],memoryMb:80,icon:"Shield"},rest:{id:"rest",name:"REST API (PostgREST)",description:"Auto-generated REST API from your database schema.",category:"recommended",canDisable:!0,dependencies:["db","analytics"],requiredBy:["storage"],memoryMb:60,icon:"Zap"},meta:{id:"meta",name:"Metadata API",description:"PostgreSQL metadata introspection. Required for Studio dashboard.",category:"recommended",canDisable:!0,dependencies:["db","analytics"],requiredBy:["studio"],memoryMb:40,icon:"Info"},studio:{id:"studio",name:"Studio Dashboard",description:"Web-based admin interface for managing your database and services.",category:"recommended",canDisable:!0,dependencies:["analytics","meta"],requiredBy:[],memoryMb:150,icon:"LayoutDashboard"},realtime:{id:"realtime",name:"Realtime",description:"WebSocket connections for live data subscriptions and broadcasts.",category:"optional",canDisable:!0,dependencies:["db","analytics"],requiredBy:[],memoryMb:100,icon:"Radio"},storage:{id:"storage",name:"Storage API",description:"File storage with S3-compatible API for uploads and downloads.",category:"optional",canDisable:!0,dependencies:["db","rest","imgproxy"],requiredBy:[],memoryMb:80,icon:"HardDrive"},imgproxy:{id:"imgproxy",name:"Image Proxy",description:"On-the-fly image transformation, resizing, and format conversion.",category:"optional",canDisable:!0,dependencies:[],requiredBy:["storage"],memoryMb:100,icon:"Image"},functions:{id:"functions",name:"Edge Functions",description:"Serverless Deno runtime for custom backend logic.",category:"optional",canDisable:!0,dependencies:["analytics"],requiredBy:[],memoryMb:150,icon:"Code"},supavisor:{id:"supavisor",name:"Connection Pooler",description:"Database connection pooling for better performance in production.",category:"optional",canDisable:!0,dependencies:["db","analytics"],requiredBy:[],memoryMb:60,icon:"Network"}},f=[{id:"minimal",name:"Minimal",description:"Database only with Studio for management. Best for backend-only apps.",services:["vector","db","analytics","meta","studio"],memoryMb:590},{id:"basic",name:"Basic API",description:"Database + REST API + Auth. Great for most web/mobile apps.",services:["vector","db","analytics","kong","auth","rest","meta","studio"],memoryMb:830},{id:"standard",name:"Standard",description:"Includes Storage for file uploads. Recommended for most projects.",services:["vector","db","analytics","kong","auth","rest","meta","studio","storage","imgproxy"],memoryMb:1010},{id:"full",name:"Full Stack",description:"All services including Realtime and Edge Functions.",services:["vector","db","analytics","kong","auth","rest","meta","studio","storage","imgproxy","realtime","functions","supavisor"],memoryMb:1320}];function g(a){e[a];let b=new Set([a]);return!function a(c){for(let d of e[c].dependencies)b.has(d)||(b.add(d),a(d))}(a),Array.from(b)}let h=54321,i=1e3,j={api:0,db:1,studio:2,inbucket:3,smtp:4,pop3:5,analytics:6,pooler:8,apiHttps:443},k={google:{name:"Google",icon:"google",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-google",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID",required:!0,placeholder:"xxxx.apps.googleusercontent.com"},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_GOOGLE_SECRET",required:!0,secret:!0}]},github:{name:"GitHub",icon:"github",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-github",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_GITHUB_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_GITHUB_SECRET",required:!0,secret:!0}]},gitlab:{name:"GitLab",icon:"gitlab",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-gitlab",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_GITLAB_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_GITLAB_SECRET",required:!0,secret:!0},{name:"GitLab URL",envVar:"GOTRUE_EXTERNAL_GITLAB_URL",required:!1,placeholder:"https://gitlab.com (default)"}]},discord:{name:"Discord",icon:"discord",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-discord",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_DISCORD_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_DISCORD_SECRET",required:!0,secret:!0}]},twitter:{name:"Twitter / X",icon:"twitter",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-twitter",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_TWITTER_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_TWITTER_SECRET",required:!0,secret:!0}]},facebook:{name:"Facebook",icon:"facebook",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-facebook",fields:[{name:"App ID",envVar:"GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID",required:!0},{name:"App Secret",envVar:"GOTRUE_EXTERNAL_FACEBOOK_SECRET",required:!0,secret:!0}]},apple:{name:"Apple",icon:"apple",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-apple",fields:[{name:"Service ID",envVar:"GOTRUE_EXTERNAL_APPLE_CLIENT_ID",required:!0},{name:"Secret Key",envVar:"GOTRUE_EXTERNAL_APPLE_SECRET",required:!0,secret:!0}]},azure:{name:"Azure AD",icon:"azure",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-azure",fields:[{name:"Application (Client) ID",envVar:"GOTRUE_EXTERNAL_AZURE_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_AZURE_SECRET",required:!0,secret:!0},{name:"Azure Tenant URL",envVar:"GOTRUE_EXTERNAL_AZURE_URL",required:!0,placeholder:"https://login.microsoftonline.com/<tenant-id>"}]},bitbucket:{name:"Bitbucket",icon:"bitbucket",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-bitbucket",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_BITBUCKET_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_BITBUCKET_SECRET",required:!0,secret:!0}]},linkedin:{name:"LinkedIn",icon:"linkedin",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-linkedin-oidc",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_LINKEDIN_OIDC_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_LINKEDIN_OIDC_SECRET",required:!0,secret:!0}]},notion:{name:"Notion",icon:"notion",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-notion",fields:[{name:"OAuth Client ID",envVar:"GOTRUE_EXTERNAL_NOTION_CLIENT_ID",required:!0},{name:"OAuth Client Secret",envVar:"GOTRUE_EXTERNAL_NOTION_SECRET",required:!0,secret:!0}]},slack:{name:"Slack",icon:"slack",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-slack",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_SLACK_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_SLACK_SECRET",required:!0,secret:!0}]},spotify:{name:"Spotify",icon:"spotify",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-spotify",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_SPOTIFY_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_SPOTIFY_SECRET",required:!0,secret:!0}]},twitch:{name:"Twitch",icon:"twitch",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-twitch",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_TWITCH_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_TWITCH_SECRET",required:!0,secret:!0}]},workos:{name:"WorkOS",icon:"workos",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-workos",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_WORKOS_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_WORKOS_SECRET",required:!0,secret:!0}]},zoom:{name:"Zoom",icon:"zoom",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-zoom",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_ZOOM_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_ZOOM_SECRET",required:!0,secret:!0}]},keycloak:{name:"Keycloak",icon:"keycloak",docsUrl:"https://supabase.com/docs/guides/auth/social-login/auth-keycloak",fields:[{name:"Client ID",envVar:"GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID",required:!0},{name:"Client Secret",envVar:"GOTRUE_EXTERNAL_KEYCLOAK_SECRET",required:!0,secret:!0},{name:"Realm URL",envVar:"GOTRUE_EXTERNAL_KEYCLOAK_URL",required:!0,placeholder:"https://keycloak.example.com/realms/myrealm"}]}}},70673:(a,b,c)=>{c.d(b,{$C:()=>g,cn:()=>f,pz:()=>i,z3:()=>h});var d=c(81171),e=c(11167);function f(...a){return(0,e.QP)((0,d.$)(a))}function g(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,11)}`}let h=function(a){if(0===a)return"0 B";let b=Math.floor(Math.log(a)/Math.log(1024));return`${parseFloat((a/Math.pow(1024,b)).toFixed(2))} ${["B","KB","MB","GB","TB"][b]}`};function i(a){return/^[a-z0-9][a-z0-9_-]*$/.test(a)}}};
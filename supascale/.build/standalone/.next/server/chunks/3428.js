"use strict";exports.id=3428,exports.ids=[3428],exports.modules={73428:(a,b,c)=>{c.d(b,{startSecurityScheduler:()=>q});var d=c(28041),e=c(79358),f=c(1717);async function g(a){let b=(0,f.mt)().notifications;if(!b.enableEmail||!b.resendApiKey)return console.log("Email notifications not configured"),!1;try{let c=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${b.resendApiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:b.resendFromEmail||"onboarding@resend.dev",to:[a.to],subject:a.subject,html:a.html})});if(!c.ok){let a=await c.json().catch(()=>({}));return console.error("Failed to send email:",a),!1}return!0}catch(a){return console.error("Error sending email:",a),!1}}async function h(a){let b=(0,f.mt)(),c=b.notifications;if(!c.notifyOnSecurityIssues||!c.notificationEmail)return!1;let d=0,e=0,h=0,i=0,j=0;for(let b of a)b.results.summary.total>0&&j++,d+=b.results.summary.critical,e+=b.results.summary.high,h+=b.results.summary.medium,i+=b.results.summary.low;let k=d+e+h+i;if(0===k)return!1;let l=a.filter(a=>a.results.summary.total>0).map(a=>`
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: 500;">${a.projectName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: ${a.results.summary.critical>0?"#dc2626":"#666"};">${a.results.summary.critical}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: ${a.results.summary.high>0?"#f59e0b":"#666"};">${a.results.summary.high}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: ${a.results.summary.medium>0?"#3b82f6":"#666"};">${a.results.summary.medium}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: center;">${a.results.summary.low}</td>
      </tr>
    `).join(""),m=`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3ecf8e; margin: 0; font-size: 24px;">Supascale Security Summary</h1>
      </div>

      <div style="background: ${d>0?"#fef2f2":e>0?"#fffbeb":"#f0f9ff"}; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${d>0?"#dc2626":e>0?"#f59e0b":"#3b82f6"};">
        <h2 style="margin: 0 0 8px 0; color: #333; font-size: 18px;">
          ${k} Total Issue${1!==k?"s":""} Across ${j} Project${1!==j?"s":""}
        </h2>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Scheduled security scan completed
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666;">Project</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #dc2626;">Critical</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #f59e0b;">High</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #3b82f6;">Medium</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666;">Low</th>
          </tr>
        </thead>
        <tbody>
          ${l}
        </tbody>
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${b.general.serverHost?`http://${b.general.serverHost}:3000`:""}/security"
           style="display: inline-block; padding: 12px 24px; background: #3ecf8e; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Security Dashboard
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
        This notification was sent from your Supascale instance.<br>
        ${new Date().toISOString()}
      </p>
    </div>
  `;return g({to:c.notificationEmail,subject:`Security Summary: ${k} issue${1!==k?"s":""} found across ${j} project${1!==j?"s":""}`,html:m})}function i(a){let b=(0,e.Yc)(a.credentials.postgresPassword),c=a.ports.db;return`postgresql://postgres:${encodeURIComponent(b)}@localhost:${c}/postgres`}async function j(a){let b=(0,f.U1)(a);if(!b)throw Error(`Project '${a}' not found`);let c=i(b),e=`
    SELECT n.nspname as schema, c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND NOT c.relrowsecurity
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_%;'
  `,g=`
    SELECT n.nspname as schema, c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relrowsecurity
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = n.nspname AND p.tablename = c.relname
      );
  `,h=`
    SELECT schemaname as schema, tablename as table_name, policyname, cmd, permissive
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual = 'true' OR with_check = 'true');
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${g.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),i=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[a,c]=b.split("|");c&&i.push({severity:"critical",schema:a||"public",table:c.trim(),issue:"RLS is not enabled on this table",recommendation:`Enable RLS with: ALTER TABLE ${a||"public"}.${c.trim()} ENABLE ROW LEVEL SECURITY;`})}for(let a of b.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c]=a.split("|");c&&i.push({severity:"high",schema:b||"public",table:c.trim(),issue:"RLS is enabled but no policies are defined (all access denied)",recommendation:"Create RLS policies to allow appropriate access"})}for(let a of f.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c,d]=a.split("|");c&&d&&i.push({severity:"medium",schema:b||"public",table:c.trim(),issue:`Policy "${d.trim()}" uses permissive 'true' condition`,recommendation:"Review policy to ensure it properly restricts access"})}let j={total:i.length,critical:i.filter(a=>"critical"===a.severity).length,high:i.filter(a=>"high"===a.severity).length,medium:i.filter(a=>"medium"===a.severity).length,low:i.filter(a=>"low"===a.severity).length};return{issues:i,summary:j}}catch(a){throw Error(`Audit scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function k(a){let b=(0,f.U1)(a);if(!b)throw Error(`Project '${a}' not found`);let c=i(b),e=`
    SELECT
      n.nspname as schema,
      c.relname as table_name,
      c.relrowsecurity as has_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_%'
    ORDER BY c.relname;
  `,g=`
    SELECT
      schemaname as schema,
      tablename as table_name,
      policyname as policy_name,
      cmd as command,
      permissive
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${g.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[a,c,d]=b.split("|");c&&f.push({schema:a||"public",table:c.trim(),hasRLS:"t"===d,policies:[]})}for(let a of b.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c,d,e,g]=a.split("|");if(c&&d){let a=f.find(a=>a.table===c.trim()&&a.schema===(b||"public"));if(a){let b={r:"SELECT",a:"INSERT",w:"UPDATE",d:"DELETE","*":"ALL"};a.policies.push({name:d.trim(),command:b[e]||"ALL",permissive:"t"===g})}}}let h=f.length,i=f.filter(a=>a.hasRLS).length,j=h>0?Math.round(i/h*100):0;return{tables:f,summary:{totalTables:h,tablesWithRLS:i,coveragePercent:j}}}catch(a){throw Error(`Coverage scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function l(a){let b=(0,f.U1)(a);if(!b)throw Error(`Project '${a}' not found`);let c=i(b),e=`
    SELECT
      b.id,
      b.name,
      b.public,
      (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') as policy_count
    FROM storage.buckets b
    ORDER BY b.name;
  `,g=`
    SELECT
      polname as name,
      polcmd as command,
      CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
  `,h=`
    SELECT relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects';
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${g.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=await (0,d.NK)(`psql "${c}" -t -A -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4});if(a.stdout.includes("does not exist")||0!==a.exitCode)return{buckets:[],summary:{totalBuckets:0,publicBuckets:0,bucketsWithPolicies:0}};let i=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim())){let[a,c,d,e]=b.split("|");c&&i.push({name:c.trim(),isPublic:"t"===d||"true"===d,policies:[],issues:[]})}let j=b.stdout.trim().split("\n").filter(a=>a.trim()),k=[];for(let a of j){let[b,c,d]=a.split("|");b&&k.push({name:b.trim(),command:c?.trim()||"",type:d?.trim()||""})}let l="t"===f.stdout.trim();for(let a of i)a.policies=k.map(a=>({name:a.name,operation:"*"===a.command?"ALL":a.command,passed:!0,message:a.type})),a.isPublic&&a.issues.push("Bucket is publicly accessible"),l||a.issues.push("RLS is not enabled on storage.objects table"),0===k.length&&a.issues.push("No RLS policies defined for storage");let m=i.filter(a=>a.isPublic).length,n=k.length>0?i.length:0;return{buckets:i,summary:{totalBuckets:i.length,publicBuckets:m,bucketsWithPolicies:n}}}catch(a){throw Error(`Storage scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}let m=null,n=null;function o(){let a=(0,f.mt)().securityScanning;if(!a?.enabled)return!1;let b=new Date,c=b.toISOString().split("T")[0];if(n===c)return!1;let[d,e]=(a.scanTime||"03:00").split(":").map(Number),g=b.getHours(),h=b.getMinutes();return!!(g===d&&1>=Math.abs(h-e))}async function p(){let a=(0,f.mt)().securityScanning;if(!a?.enabled)return void console.log("[Security Scheduler] Scanning is disabled");n=new Date().toISOString().split("T")[0],console.log("[Security Scheduler] Starting scheduled security scans");let b=(0,f.cf)().filter(a=>"running"===a.status);if(0===b.length)return void console.log("[Security Scheduler] No running projects to scan");console.log(`[Security Scheduler] Found ${b.length} running project(s) to scan`);let c=a.scanTypes||["audit","coverage"],d=[];for(let a of b)try{if(console.log(`[Security Scheduler] Scanning project "${a.name}"...`),c.includes("audit")){let b=Date.now(),c=(0,f.kA)({projectId:a.id,type:"audit",status:"running",startedAt:new Date().toISOString()});try{let e=await j(a.id),g=Date.now()-b;(0,f.bM)(c.id,{status:"completed",results:{audit:e},duration:g,completedAt:new Date().toISOString()}),e.summary.total>0&&d.push({projectName:a.name,projectId:a.id,results:e}),console.log(`[Security Scheduler] Audit scan completed for "${a.name}": ${e.summary.total} issues found`)}catch(b){(0,f.bM)(c.id,{status:"failed",errorMessage:b instanceof Error?b.message:"Unknown error",completedAt:new Date().toISOString()}),console.error(`[Security Scheduler] Audit scan failed for "${a.name}":`,b)}}if(c.includes("coverage")){let b=Date.now(),c=(0,f.kA)({projectId:a.id,type:"coverage",status:"running",startedAt:new Date().toISOString()});try{let d=await k(a.id),e=Date.now()-b;(0,f.bM)(c.id,{status:"completed",results:{coverage:d},duration:e,completedAt:new Date().toISOString()}),console.log(`[Security Scheduler] Coverage scan completed for "${a.name}": ${d.summary.coveragePercent}% RLS coverage`)}catch(b){(0,f.bM)(c.id,{status:"failed",errorMessage:b instanceof Error?b.message:"Unknown error",completedAt:new Date().toISOString()}),console.error(`[Security Scheduler] Coverage scan failed for "${a.name}":`,b)}}if(c.includes("storage")){let b=Date.now(),c=(0,f.kA)({projectId:a.id,type:"storage",status:"running",startedAt:new Date().toISOString()});try{let d=await l(a.id),e=Date.now()-b;(0,f.bM)(c.id,{status:"completed",results:{storage:d},duration:e,completedAt:new Date().toISOString()}),console.log(`[Security Scheduler] Storage scan completed for "${a.name}": ${d.summary.publicBuckets} public buckets`)}catch(b){(0,f.bM)(c.id,{status:"failed",errorMessage:b instanceof Error?b.message:"Unknown error",completedAt:new Date().toISOString()}),console.error(`[Security Scheduler] Storage scan failed for "${a.name}":`,b)}}}catch(b){console.error(`[Security Scheduler] Error scanning project "${a.name}":`,b)}if((0,f.Mx)("system","security.scheduled_scan_completed","system",{projectsScanned:b.length,scanTypes:c,issuesFound:d.reduce((a,b)=>a+b.results.summary.total,0)}),d.length>0){let b=a.minSeverityToNotify||"high",c=["critical","high","medium","low"],e=c.indexOf(b),f=d.filter(a=>{let{summary:b}=a.results;for(let a=0;a<=e;a++)if(b[c[a]]>0)return!0;return!1});if(f.length>0)try{await h(f),console.log(`[Security Scheduler] Notification sent for ${f.length} project(s) with issues`)}catch(a){console.error("[Security Scheduler] Failed to send notification:",a)}}console.log("[Security Scheduler] Scheduled security scans completed")}function q(){if(m)return void console.log("[Security Scheduler] Already running");console.log("[Security Scheduler] Starting scheduler"),setTimeout(()=>{o()&&p().catch(a=>{console.error("[Security Scheduler] Error running scheduled scan:",a)})},1e4),m=setInterval(()=>{o()&&p().catch(a=>{console.error("[Security Scheduler] Error running scheduled scan:",a)})},6e4)}}};
exports.id=2900,exports.ids=[2900],exports.modules={10576:(a,b,c)=>{"use strict";c.d(b,{m:()=>f});var d=c(35552);async function e(a){let b=(0,d.getSettings)().notifications;if(!b.enableEmail||!b.resendApiKey)return console.log("Email notifications not configured"),!1;try{let c=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${b.resendApiKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:b.resendFromEmail||"onboarding@resend.dev",to:[a.to],subject:a.subject,html:a.html})});if(!c.ok){let a=await c.json().catch(()=>({}));return console.error("Failed to send email:",a),!1}return!0}catch(a){return console.error("Error sending email:",a),!1}}async function f(a,b,c){let f=(0,d.getSettings)(),g=f.notifications;if(!g.notifyOnSecurityIssues)return!1;if(!g.notificationEmail)return console.log("No notification email configured"),!1;let{summary:h,issues:i}=c;if(0===h.total)return!1;let j={critical:"#dc2626",high:"#f59e0b",medium:"#3b82f6",low:"#6b7280"},k=i.slice(0,10).map(a=>`
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">
        <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${j[a.severity]};">
          ${a.severity.toUpperCase()}
        </span>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-family: monospace; font-size: 13px;">
        ${a.schema}.${a.table}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; color: #666;">
        ${a.issue}
      </td>
    </tr>
  `).join(""),l=i.length>10?`
    <tr>
      <td colspan="3" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
        ...and ${i.length-10} more issues
      </td>
    </tr>
  `:"",m=`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #3ecf8e; margin: 0; font-size: 24px;">Supascale Security Alert</h1>
      </div>

      <div style="background: ${h.critical>0?"#fef2f2":h.high>0?"#fffbeb":"#f0f9ff"}; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${h.critical>0?"#dc2626":h.high>0?"#f59e0b":"#3b82f6"};">
        <h2 style="margin: 0 0 12px 0; color: #333; font-size: 18px;">
          ${h.total} Security Issue${1!==h.total?"s":""} Found
        </h2>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Project: <strong>${a}</strong>
        </p>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        ${h.critical>0?`
          <div style="flex: 1; background: #fef2f2; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${h.critical}</div>
            <div style="font-size: 12px; color: #666;">Critical</div>
          </div>
        `:""}
        ${h.high>0?`
          <div style="flex: 1; background: #fffbeb; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${h.high}</div>
            <div style="font-size: 12px; color: #666;">High</div>
          </div>
        `:""}
        ${h.medium>0?`
          <div style="flex: 1; background: #f0f9ff; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${h.medium}</div>
            <div style="font-size: 12px; color: #666;">Medium</div>
          </div>
        `:""}
        ${h.low>0?`
          <div style="flex: 1; background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #6b7280;">${h.low}</div>
            <div style="font-size: 12px; color: #666;">Low</div>
          </div>
        `:""}
      </div>

      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Severity</th>
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Table</th>
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase;">Issue</th>
          </tr>
        </thead>
        <tbody>
          ${k}
          ${l}
        </tbody>
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${f.general.serverHost?`http://${f.general.serverHost}:3000`:""}/projects/${b}/security"
           style="display: inline-block; padding: 12px 24px; background: #3ecf8e; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
          View Full Report
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
        This notification was sent from your Supascale instance.<br>
        ${new Date().toISOString()}
      </p>
    </div>
  `;return e({to:g.notificationEmail,subject:`Security Alert: ${h.total} issue${1!==h.total?"s":""} found in ${a}`,html:m})}},60112:(a,b,c)=>{"use strict";c.d(b,{Be:()=>i,Ns:()=>l,W9:()=>k,k8:()=>j,qC:()=>h});var d=c(20942),e=c(15995),f=c(35552);function g(a){let b=(0,e.Yc)(a.credentials.postgresPassword),c=a.ports.db;return`postgresql://postgres:${encodeURIComponent(b)}@localhost:${c}/postgres`}async function h(a){let b=(0,f.getProject)(a);if(!b)throw Error(`Project '${a}' not found`);let c=g(b),e=`
    SELECT n.nspname as schema, c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND NOT c.relrowsecurity
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_%;'
  `,h=`
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
  `,i=`
    SELECT schemaname as schema, tablename as table_name, policyname, cmd, permissive
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual = 'true' OR with_check = 'true');
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${i.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),g=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[a,c]=b.split("|");c&&g.push({severity:"critical",schema:a||"public",table:c.trim(),issue:"RLS is not enabled on this table",recommendation:`Enable RLS with: ALTER TABLE ${a||"public"}.${c.trim()} ENABLE ROW LEVEL SECURITY;`})}for(let a of b.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c]=a.split("|");c&&g.push({severity:"high",schema:b||"public",table:c.trim(),issue:"RLS is enabled but no policies are defined (all access denied)",recommendation:"Create RLS policies to allow appropriate access"})}for(let a of f.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c,d]=a.split("|");c&&d&&g.push({severity:"medium",schema:b||"public",table:c.trim(),issue:`Policy "${d.trim()}" uses permissive 'true' condition`,recommendation:"Review policy to ensure it properly restricts access"})}let j={total:g.length,critical:g.filter(a=>"critical"===a.severity).length,high:g.filter(a=>"high"===a.severity).length,medium:g.filter(a=>"medium"===a.severity).length,low:g.filter(a=>"low"===a.severity).length};return{issues:g,summary:j}}catch(a){throw Error(`Audit scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function i(a){let b=(0,f.getProject)(a);if(!b)throw Error(`Project '${a}' not found`);let c=g(b),e=`
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
  `,h=`
    SELECT
      schemaname as schema,
      tablename as table_name,
      policyname as policy_name,
      cmd as command,
      permissive
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[a,c,d]=b.split("|");c&&f.push({schema:a||"public",table:c.trim(),hasRLS:"t"===d,policies:[]})}for(let a of b.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c,d,e,g]=a.split("|");if(c&&d){let a=f.find(a=>a.table===c.trim()&&a.schema===(b||"public"));if(a){let b={r:"SELECT",a:"INSERT",w:"UPDATE",d:"DELETE","*":"ALL"};a.policies.push({name:d.trim(),command:b[e]||"ALL",permissive:"t"===g})}}}let g=f.length,i=f.filter(a=>a.hasRLS).length,j=g>0?Math.round(i/g*100):0;return{tables:f,summary:{totalTables:g,tablesWithRLS:i,coveragePercent:j}}}catch(a){throw Error(`Coverage scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function j(a){let b=(0,f.getProject)(a);if(!b)throw Error(`Project '${a}' not found`);let c=g(b),e=`
    SELECT
      b.id,
      b.name,
      b.public,
      (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') as policy_count
    FROM storage.buckets b
    ORDER BY b.name;
  `,h=`
    SELECT
      polname as name,
      polcmd as command,
      CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as type
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects';
  `,i=`
    SELECT relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'storage' AND c.relname = 'objects';
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=await (0,d.NK)(`psql "${c}" -t -A -c "${i.replace(/\n/g," ")}" 2>&1`,{timeout:3e4});if(a.stdout.includes("does not exist")||0!==a.exitCode)return{buckets:[],summary:{totalBuckets:0,publicBuckets:0,bucketsWithPolicies:0}};let g=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim())){let[a,c,d,e]=b.split("|");c&&g.push({name:c.trim(),isPublic:"t"===d||"true"===d,policies:[],issues:[]})}let j=b.stdout.trim().split("\n").filter(a=>a.trim()),k=[];for(let a of j){let[b,c,d]=a.split("|");b&&k.push({name:b.trim(),command:c?.trim()||"",type:d?.trim()||""})}let l="t"===f.stdout.trim();for(let a of g)a.policies=k.map(a=>({name:a.name,operation:"*"===a.command?"ALL":a.command,passed:!0,message:a.type})),a.isPublic&&a.issues.push("Bucket is publicly accessible"),l||a.issues.push("RLS is not enabled on storage.objects table"),0===k.length&&a.issues.push("No RLS policies defined for storage");let m=g.filter(a=>a.isPublic).length,n=k.length>0?g.length:0;return{buckets:g,summary:{totalBuckets:g.length,publicBuckets:m,bucketsWithPolicies:n}}}catch(a){throw Error(`Storage scan failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function k(a){let b=(0,f.getProject)(a);if(!b)throw Error(`Project '${a}' not found`);let c=g(b),e=`
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
  `,h=`
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd,
      permissive,
      roles,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;try{let a=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${e.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),b=await (0,d.NK)(`psql "${c}" -t -A -F'|' -c "${h.replace(/\n/g," ")}" 2>&1`,{timeout:3e4}),f=[],g=[];for(let b of a.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[a,c,d]=b.split("|");c&&f.push({schema:a||"public",table:c.trim(),hasRLS:"t"===d})}for(let a of b.stdout.trim().split("\n").filter(a=>a.trim()&&!a.includes("rows)"))){let[b,c,d,e,f,h,i,j]=a.split("|");c&&d&&g.push({schema:b||"public",table:c.trim(),name:d.trim(),command:e||"*",permissive:"t"===f,roles:h||"",using:i||"",withCheck:j||""})}let i={timestamp:new Date().toISOString(),tables:f,policies:g};return{data:JSON.stringify(i),tablesCount:f.length,policiesCount:g.length}}catch(a){throw Error(`Snapshot failed: ${a instanceof Error?a.message:"Unknown error"}`)}}async function l(a,b){let c;if(!(0,f.getProject)(a))throw Error(`Project '${a}' not found`);let d=JSON.parse((await k(a)).data);try{c=JSON.parse(b)}catch{throw Error("Invalid snapshot data format")}let e=[],g=new Map(d.policies.map(a=>[`${a.schema}.${a.table}.${a.name}`,a])),h=new Map((c.policies||[]).map(a=>[`${a.schema}.${a.table}.${a.name}`,a]));for(let[a,b]of g)h.has(a)||e.push({type:"added",schema:b.schema,table:b.table,policy:b.name,details:`Policy "${b.name}" was added`});for(let[a,b]of h)g.has(a)||e.push({type:"removed",schema:b.schema,table:b.table,policy:b.name,details:`Policy "${b.name}" was removed`});let i=new Map(d.tables.map(a=>[`${a.schema}.${a.table}`,a])),j=new Map((c.tables||[]).map(a=>[`${a.schema}.${a.table}`,a]));for(let[,a]of i){let b=`${a.schema}.${a.table}`,c=j.get(b);c&&a.hasRLS!==c.hasRLS&&e.push({type:"modified",schema:a.schema,table:a.table,details:a.hasRLS?"RLS was enabled":"RLS was disabled"})}return{changes:e,summary:{added:e.filter(a=>"added"===a.type).length,removed:e.filter(a=>"removed"===a.type).length,modified:e.filter(a=>"modified"===a.type).length}}}c(10576)},78335:()=>{},96487:()=>{}};
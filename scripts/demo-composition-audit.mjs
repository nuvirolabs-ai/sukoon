// Read-only source audit. Never seeds or repairs data.
import "dotenv/config";
import pg from "pg";
import { mkdir, writeFile } from "node:fs/promises";
const phase=process.argv[2]||"before";
if(!/^[a-z][a-z0-9-]*$/.test(phase))throw Error("Use a simple audit phase name");
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
const tables=["Property","PropertyDoc","DocumentVersion","Bill","Obligation","ObligationOccurrence","ObligationPayment","Maintenance","MaintenanceEvent","TimelineEvent","DurableReminder","ShareLink","AssessmentSnapshot","AssessmentItem","ConstructionProject","ConstructionStage","ConstructionTask","ConstructionBudgetItem","ConstructionCost","MaterialRequirement","MaterialPriceEntry","ConstructionContact","ConstructionUpdate","ConstructionDocumentLink","ConstructionEvent","PurchaseWorkspace","PurchaseCandidate","PurchaseEntry","PurchaseEvidenceEvent"];
const audit={phase,at:new Date().toISOString(),counts:{},fingerprints:{},api:{}};
try{
 await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 const {rows:[ws]}=await client.query('SELECT w.id FROM "Workspace" w JOIN "user" u ON u.id=w."ownerUserId" WHERE u.email=$1',["demo-owner@sukoon.local"]);
 if(!ws)throw Error("Demo owner workspace missing");
 audit.database=(await client.query("SELECT current_database() AS name")).rows[0].name;
 if(audit.database!=="sukoon_s02_local_20260911")throw Error("Unexpected audit database");
 for(const table of tables){
   const condition=table==="PurchaseEvidenceEvent"?'"entryId" IN (SELECT id FROM "PurchaseEntry" WHERE "workspaceId"=$1)':'"workspaceId"=$1';
   const {rows:[row]}=await client.query('SELECT count(*)::int AS count, md5(coalesce(string_agg(id,\',\' ORDER BY id),\'\')) AS ids FROM "'+table+'" WHERE '+condition,[ws.id]);
   audit.counts[table]=row.count;audit.fingerprints[table]=row.ids;
 }
 audit.properties=(await client.query('SELECT id,name,status,"insuranceUntil","loanBalancePaise" FROM "Property" WHERE "workspaceId"=$1 ORDER BY name',[ws.id])).rows;
 audit.documentStates=(await client.query('SELECT "scanStatus","reviewStatus",count(*)::int FROM "PropertyDoc" WHERE "workspaceId"=$1 GROUP BY 1,2',[ws.id])).rows;
 audit.projects=(await client.query('SELECT id,name,status,"initialBudgetPaise","budgetPaise" FROM "ConstructionProject" WHERE "workspaceId"=$1',[ws.id])).rows;
 audit.purchase=(await client.query('SELECT id,name,stage,"askingPricePaise","budgetPaise" FROM "PurchaseCandidate" WHERE "workspaceId"=$1',[ws.id])).rows;
 audit.questions=(await client.query('SELECT kind,state,count(*)::int FROM "PurchaseEntry" WHERE "workspaceId"=$1 GROUP BY 1,2',[ws.id])).rows;
 audit.shares=(await client.query('SELECT role,"inviteeEmail","propertyId","acceptedAt","revokedAt","expiresAt" FROM "ShareLink" WHERE "workspaceId"=$1',[ws.id])).rows;
 audit.shareScopes=(await client.query('SELECT s."inviteeEmail",s.role,ss."scopeType",ss."documentId" FROM "ShareLink" s JOIN "ShareLinkScope" ss ON ss."shareLinkId"=s.id WHERE s."workspaceId"=$1 ORDER BY s."inviteeEmail",ss."scopeType",ss."documentId"',[ws.id])).rows;
 audit.obligations=(await client.query('SELECT o.label,o.direction,o."amountPaise",o."dueDate",oo."amountPaise" AS "occurrenceAmountPaise",oo.status,coalesce(sum(CASE WHEN op.status=\'RECORDED\' AND op."reversalOfId" IS NULL THEN op."amountPaise" ELSE 0 END),0)::text AS "paidPaise" FROM "Obligation" o JOIN "ObligationOccurrence" oo ON oo."obligationId"=o.id LEFT JOIN "ObligationPayment" op ON op."occurrenceId"=oo.id WHERE o."workspaceId"=$1 GROUP BY o.id,o.label,o.direction,o."amountPaise",o."dueDate",oo.id,oo."amountPaise",oo.status ORDER BY o.label,oo."dueDate"',[ws.id])).rows;
 audit.assessments=(await client.query('SELECT s.id,s."propertyId",s.assessment,s.score,s."applicableCount",s."satisfiedCount",s."unknownCount",count(i.id)::int AS "itemCount" FROM "AssessmentSnapshot" s LEFT JOIN "AssessmentItem" i ON i."snapshotId"=s.id WHERE s."workspaceId"=$1 GROUP BY s.id ORDER BY s."evaluatedAt" DESC',[ws.id])).rows;
 audit.constructionDocuments=(await client.query('SELECT l."projectId",l."documentId",l."documentVersionId",l.category,d.name FROM "ConstructionDocumentLink" l JOIN "PropertyDoc" d ON d.id=l."documentId" WHERE l."workspaceId"=$1 ORDER BY d.name',[ws.id])).rows;
 audit.materials=(await client.query('SELECT m.name,m.quantity,m.unit,m."estimatedUnitRatePaise",p."pricePaise",p."recordedDate" FROM "MaterialRequirement" m LEFT JOIN "MaterialPriceEntry" p ON p."materialId"=m.id WHERE m."workspaceId"=$1 ORDER BY m.name,p."recordedDate"',[ws.id])).rows;
 await client.query("COMMIT");
 const base="http://localhost:3100";
 const post=(path,data)=>fetch(base+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify(data)});
 await post("/api/auth/email-otp/send-verification-otp",{email:"demo-owner@sukoon.local",type:"sign-in"});
 const mailbox=await (await fetch(base+"/api/auth/dev-mailbox?email=demo-owner%40sukoon.local")).json();
 const signin=await post("/api/auth/sign-in/email-otp",{email:"demo-owner@sukoon.local",otp:mailbox.data.otp});
 if(!signin.ok)throw Error("Sandbox authentication failed");
 const cookie=signin.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
 for(const path of ["/api/state","/api/home","/api/updates","/api/construction","/api/purchases"]){
  const response=await fetch(base+path,{headers:{cookie}});if(!response.ok)throw Error(path+" "+response.status);
  audit.api[path]=(await response.json()).data;
 }
 await mkdir("output/demo-composition",{recursive:true});
 await writeFile("output/demo-composition/"+phase+"-audit.json",JSON.stringify(audit,null,2));
 console.log(JSON.stringify({phase,database:audit.database,counts:audit.counts,documentStates:audit.documentStates,projects:audit.projects,questions:audit.questions,apiCounts:{properties:audit.api["/api/state"].state.properties.length,documents:audit.api["/api/state"].state.docs.length,timeline:audit.api["/api/state"].state.timeline.length,updates:audit.api["/api/updates"].items.length},output:"output/demo-composition/"+phase+"-audit.json"}));
}finally{await client.end();}

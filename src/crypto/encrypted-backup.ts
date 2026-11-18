import type { Table } from 'dexie'
import { salonDb } from '../db/database'
import type { ActorContext, BackupRecord, AuditEvent } from '../db/types'
import { encryptJson, decryptJson, type EncryptedEnvelope } from './secure-envelope'

type BackupRow={id:string;salonId:string;revision?:number;updatedAt?:string;[key:string]:unknown}
type BackupPayload={formatVersion:1;schemaVersion:5;salonId:string;createdAt:string;deviceId:string;tables:Record<string,BackupRow[]>}
export type EncryptedBackupFile={metadata:{formatVersion:1;schemaVersion:5;createdAt:string;salonId:string;ciphertextHash:string;sizeBytes:number;recordCounts:Record<string,number>};envelope:EncryptedEnvelope}
export type RestoreMode='merge'|'replace'
const tableNames=['customers','appointments','services','workflowEvents','auditEvents','employees','workShifts','commissionPolicies','products','suppliers','purchaseOrders','inventoryLots','stockMovements','invoices','payments','refunds','cashSessions','expenses','taxPolicies','devices','changeLogs','syncConflicts','syncCursors','backupRecords']
function tables():Record<string,Table<BackupRow,string>>{return{
 customers:salonDb.customers as unknown as Table<BackupRow,string>,appointments:salonDb.appointments as unknown as Table<BackupRow,string>,services:salonDb.services as unknown as Table<BackupRow,string>,workflowEvents:salonDb.workflowEvents as unknown as Table<BackupRow,string>,auditEvents:salonDb.auditEvents as unknown as Table<BackupRow,string>,employees:salonDb.employees as unknown as Table<BackupRow,string>,workShifts:salonDb.workShifts as unknown as Table<BackupRow,string>,commissionPolicies:salonDb.commissionPolicies as unknown as Table<BackupRow,string>,products:salonDb.products as unknown as Table<BackupRow,string>,suppliers:salonDb.suppliers as unknown as Table<BackupRow,string>,purchaseOrders:salonDb.purchaseOrders as unknown as Table<BackupRow,string>,inventoryLots:salonDb.inventoryLots as unknown as Table<BackupRow,string>,stockMovements:salonDb.stockMovements as unknown as Table<BackupRow,string>,invoices:salonDb.invoices as unknown as Table<BackupRow,string>,payments:salonDb.payments as unknown as Table<BackupRow,string>,refunds:salonDb.refunds as unknown as Table<BackupRow,string>,cashSessions:salonDb.cashSessions as unknown as Table<BackupRow,string>,expenses:salonDb.expenses as unknown as Table<BackupRow,string>,taxPolicies:salonDb.taxPolicies as unknown as Table<BackupRow,string>,devices:salonDb.devices as unknown as Table<BackupRow,string>,changeLogs:salonDb.changeLogs as unknown as Table<BackupRow,string>,syncConflicts:salonDb.syncConflicts as unknown as Table<BackupRow,string>,syncCursors:salonDb.syncCursors as unknown as Table<BackupRow,string>,backupRecords:salonDb.backupRecords as unknown as Table<BackupRow,string>,
}}
function audit(actor:ActorContext,id:string,action:AuditEvent['action'],summary:string):AuditEvent{return{id:crypto.randomUUID(),salonId:actor.salonId,entityType:'backup',entityId:id,action,occurredAt:new Date().toISOString(),actorId:actor.actorId,deviceId:actor.deviceId,summary}}
export async function createEncryptedBackup(actor:ActorContext,passphrase:string):Promise<EncryptedBackupFile>{
 const dbTables:Record<string,Table<BackupRow,string>>=tables(),data:Record<string,BackupRow[]>={},recordCounts:Record<string,number>={}
 for(const name of tableNames){const rows=await dbTables[name].where('salonId').equals(actor.salonId).toArray();data[name]=rows;recordCounts[name]=rows.length}
 const createdAt=new Date().toISOString(),payload:BackupPayload={formatVersion:1,schemaVersion:5,salonId:actor.salonId,createdAt,deviceId:actor.deviceId,tables:data}
 const envelope=await encryptJson(payload,passphrase,'backup'),metadata={formatVersion:1 as const,schemaVersion:5 as const,createdAt,salonId:actor.salonId,ciphertextHash:envelope.sha256,sizeBytes:envelope.ciphertext.length,recordCounts}
 const record:BackupRecord={id:crypto.randomUUID(),salonId:actor.salonId,createdAt,updatedAt:createdAt,revision:1,createdBy:actor.actorId,updatedBy:actor.actorId,deviceId:actor.deviceId,schemaVersion:5,formatVersion:1,ciphertextHash:envelope.sha256,sizeBytes:envelope.ciphertext.length,recordCounts}
 await salonDb.transaction('rw',salonDb.backupRecords,salonDb.auditEvents,async()=>{await salonDb.backupRecords.add(record);await salonDb.auditEvents.add(audit(actor,record.id,'created','Tạo backup mã hóa'))})
 return{metadata,envelope}
}
export async function restoreEncryptedBackup(actor:ActorContext,file:EncryptedBackupFile,passphrase:string,mode:RestoreMode){
 if(!file?.metadata||file.metadata.salonId!==actor.salonId||file.metadata.ciphertextHash!==file.envelope?.sha256)throw new Error('Metadata backup không khớp salon hoặc checksum.')
 const payload=await decryptJson<BackupPayload>(file.envelope,passphrase,'backup')
 if(payload.formatVersion!==1||payload.schemaVersion>5||payload.schemaVersion<1||payload.salonId!==actor.salonId||!payload.tables||typeof payload.tables!=='object')throw new Error('Backup không đúng salon hoặc phiên bản không được hỗ trợ.')
 const dbTables:Record<string,Table<BackupRow,string>>=tables(),allowed=new Set(tableNames),entries=Object.entries(payload.tables)
 for(const [name,rows] of entries){if(!allowed.has(name)||!Array.isArray(rows))throw new Error('Backup chứa bảng không hợp lệ.');for(const row of rows){if(!row||typeof row.id!=='string'||row.salonId!==actor.salonId)throw new Error('Backup chứa bản ghi sai salon hoặc thiếu định danh.')}} 
 const txTables=Object.values(dbTables)
 await salonDb.transaction('rw',txTables,async()=>{
  if(mode==='replace'){for(const table of txTables)await table.where('salonId').equals(actor.salonId).delete()}
  for(const [name,rows] of entries){const table=dbTables[name];for(const row of rows){const current=await table.get(row.id);if(mode==='merge'&&current){const currentRevision=Number(current.revision??0),incomingRevision=Number(row.revision??0);if(currentRevision>incomingRevision||(currentRevision===incomingRevision&&String(current.updatedAt??'')>String(row.updatedAt??'')))continue}await table.put(row)}}
 })
 const restoredId=crypto.randomUUID(),t=new Date().toISOString(),record:BackupRecord={id:restoredId,salonId:actor.salonId,createdAt:t,updatedAt:t,revision:1,createdBy:actor.actorId,updatedBy:actor.actorId,deviceId:actor.deviceId,schemaVersion:payload.schemaVersion,formatVersion:1,ciphertextHash:file.envelope.sha256,sizeBytes:file.envelope.ciphertext.length,recordCounts:Object.fromEntries(entries.map(([name,rows])=>[name,rows.length]))}
 await salonDb.transaction('rw',salonDb.backupRecords,salonDb.auditEvents,async()=>{await salonDb.backupRecords.add(record);await salonDb.auditEvents.add(audit(actor,restoredId,'restored','Khôi phục backup mã hóa ('+mode+')'))})
 return{restoredTables:entries.length,restoredRecords:entries.reduce((n,[,rows])=>n+rows.length,0),mode}
}
export async function listBackupRecords(actor:ActorContext){if(!actor.salonId.trim())throw new Error('Thiếu salon context.');return salonDb.backupRecords.where('salonId').equals(actor.salonId).sortBy('createdAt')}

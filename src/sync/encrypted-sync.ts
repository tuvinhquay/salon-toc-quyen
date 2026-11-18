import { decryptJson, encryptJson, type EncryptedEnvelope } from '../crypto/secure-envelope'
import type { ActorContext, ChangeLog } from '../db/types'

export type EncryptedSyncPacket={protocolVersion:1;salonId:string;fromDeviceId:string;createdAt:string;envelope:EncryptedEnvelope}
type SyncPayload={schemaVersion:5;salonId:string;fromDeviceId:string;createdAt:string;changes:Array<Pick<ChangeLog,'id'|'entityType'|'entityId'|'operation'|'baseRevision'|'entityRevision'|'encryptedPayload'|'createdAt'>>}

export async function sealSyncPacket(actor:ActorContext,changes:ChangeLog[],passphrase:string):Promise<EncryptedSyncPacket>{
 if(!actor.salonId.trim()||!actor.deviceId.trim())throw new Error('Thiếu ngữ cảnh thiết bị đồng bộ.')
 const safe=changes.map(change=>{if(change.salonId!==actor.salonId||!change.encryptedPayload.trim())throw new Error('Change log không hợp lệ hoặc sai salon.');return{id:change.id,entityType:change.entityType,entityId:change.entityId,operation:change.operation,baseRevision:change.baseRevision,entityRevision:change.entityRevision,encryptedPayload:change.encryptedPayload,createdAt:change.createdAt}})
 const createdAt=new Date().toISOString(),payload:SyncPayload={schemaVersion:5,salonId:actor.salonId,fromDeviceId:actor.deviceId,createdAt,changes:safe}
 return{protocolVersion:1,salonId:actor.salonId,fromDeviceId:actor.deviceId,createdAt,envelope:await encryptJson(payload,passphrase,'sync')}
}
export async function openSyncPacket(actor:ActorContext,packet:EncryptedSyncPacket,passphrase:string,expectedPeerDeviceId?:string){
 if(packet.protocolVersion!==1||packet.salonId!==actor.salonId||packet.fromDeviceId===actor.deviceId)throw new Error('Gói đồng bộ không hợp lệ cho salon/thiết bị này.')
 if(expectedPeerDeviceId&&packet.fromDeviceId!==expectedPeerDeviceId)throw new Error('Thiết bị gửi không khớp thiết bị đã chọn.')
 const payload=await decryptJson<SyncPayload>(packet.envelope,passphrase,'sync')
 if(payload.schemaVersion>5||payload.salonId!==actor.salonId||payload.fromDeviceId!==packet.fromDeviceId||!Array.isArray(payload.changes))throw new Error('Nội dung gói đồng bộ không hợp lệ.')
 for(const change of payload.changes){if(!change.id||!change.entityId||!change.encryptedPayload||change.entityRevision<=change.baseRevision)throw new Error('Change log trong gói không hợp lệ.')}
 return payload
}

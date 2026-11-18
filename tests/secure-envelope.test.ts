import { decryptJson, encryptJson } from '../src/crypto/secure-envelope'
import { describe, expect, it } from 'vitest'

describe('encrypted payload envelope',()=>{
 const passphrase='Quyen-Salon-Backup-2026!'
 it('encrypts and decrypts a JSON payload with authenticated context',async()=>{
  const payload={salonId:'salon-a',items:[{id:'c1',name:'Khách hàng'}]}
  const envelope=await encryptJson(payload,passphrase,'backup')
  expect(envelope.ciphertext).not.toContain('Khách hàng')
  await expect(decryptJson(envelope,passphrase,'backup')).resolves.toEqual(payload)
 })
 it('rejects a wrong passphrase and a different encryption context',async()=>{
  const envelope=await encryptJson({secret:'data'},passphrase,'sync')
  await expect(decryptJson(envelope,'wrong-passphrase-123','sync')).rejects.toThrow('Không thể giải mã')
  await expect(decryptJson(envelope,passphrase,'backup')).rejects.toThrow('Không thể giải mã')
 })
 it('requires a sufficiently long passphrase',async()=>{
  await expect(encryptJson({ok:true},'short','backup')).rejects.toThrow('ít nhất 12 ký tự')
 })
})

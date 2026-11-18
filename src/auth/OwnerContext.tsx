import { createContext, useContext, type ReactNode } from 'react'
import type { ActorContext } from '../db/types'
const OwnerContext=createContext<ActorContext|null>(null)
export function OwnerProvider({value,children}:{value:ActorContext;children:ReactNode}){return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>}
export function useOwnerContext(){const value=useContext(OwnerContext);if(!value)throw new Error('Owner chưa được xác minh.');return value}

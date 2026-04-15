import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { SosMeshModal } from '@/components/sos/SosMeshModal'

type SosContextValue = {
  meshModalOpen: boolean
  openMeshModal: () => void
  closeMeshModal: () => void
}

const SosContext = createContext<SosContextValue | null>(null)

export function SosProvider({ children }: { children: ReactNode }) {
  const [meshModalOpen, setMeshModalOpen] = useState(false)

  const openMeshModal = useCallback(() => setMeshModalOpen(true), [])
  const closeMeshModal = useCallback(() => setMeshModalOpen(false), [])

  const value = useMemo(
    () => ({ meshModalOpen, openMeshModal, closeMeshModal }),
    [meshModalOpen, openMeshModal, closeMeshModal],
  )

  return (
    <SosContext.Provider value={value}>
      {children}
      <SosMeshModal open={meshModalOpen} onClose={closeMeshModal} />
    </SosContext.Provider>
  )
}

export function useSos() {
  const ctx = useContext(SosContext)
  if (!ctx) throw new Error('useSos must be used within SosProvider')
  return ctx
}

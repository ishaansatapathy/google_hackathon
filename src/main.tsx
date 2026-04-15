import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { createRoot } from 'react-dom/client'

import './index.css'

import App from './App.tsx'
import { SosProvider } from '@/context/SosContext'
import { clerkPublishableKey } from '@/lib/clerkConfig'
import { ensureRuntimeMapsEnv } from '@/lib/runtimeMapsEnv'
import { RootErrorBoundary } from './RootErrorBoundary.tsx'

const appTree = (
  <SosProvider>
    <App />
  </SosProvider>
)

async function bootstrap() {
  await ensureRuntimeMapsEnv()
  createRoot(document.getElementById('root')!).render(
    <RootErrorBoundary>
      {clerkPublishableKey ? (
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          appearance={{
            baseTheme: dark,
            variables: { colorPrimary: '#EE3F2C', colorTextOnPrimaryBackground: '#ffffff' },
          }}
        >
          {appTree}
        </ClerkProvider>
      ) : (
        appTree
      )}
    </RootErrorBoundary>,
  )
}

void bootstrap()

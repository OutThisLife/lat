import { Suspense } from 'react'

import PageClient from './page-client'

export default function Page() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <Suspense>
        <PageClient key={Math.random()} />
      </Suspense>
    </main>
  )
}

import { useState } from 'react'
import PasswordGenerator from '../components/PasswordGenerator'
import PasswordInput from '../components/PasswordInput'
import StrengthMeter from '../components/StrengthMeter'

export default function Generator() {
  const [check, setCheck] = useState('')
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Password generator</h1>
        <p className="mt-1 text-slate-400">Generated with your browser's secure random number generator. Nothing is sent to the server.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass p-6 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold">Generate</h2>
          <PasswordGenerator />
        </section>
        <section className="glass self-start p-6 sm:p-7">
          <h2 className="text-lg font-semibold">Check a password</h2>
          <p className="mb-4 mt-1 text-sm text-slate-400">See how strong it is and how to improve it. The check runs locally.</p>
          <PasswordInput value={check} onChange={setCheck} autoComplete="off" placeholder="Type or paste a password" />
          <StrengthMeter password={check} />
        </section>
      </div>
    </div>
  )
}

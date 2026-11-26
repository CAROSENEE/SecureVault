import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EntryForm from '../components/EntryForm'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function EditPassword() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const [entry, setEntry] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api.getEntry(id).then(setEntry).catch((e) => setError(e.message)) }, [id])

  if (error) return <p role="alert" className="text-red-300">{error}</p>
  if (!entry) return <p className="text-slate-500">Loading…</p>
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Edit password</h1>
      <EntryForm editing initial={{ ...entry, password: '' }} submitLabel="Save changes" onCancel={() => nav('/vault')} onSubmit={async (data) => {
        await api.updateEntry(id, data)
        toast('Changes saved')
        nav('/vault')
      }} />
    </div>
  )
}

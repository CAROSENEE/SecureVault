import { useNavigate } from 'react-router-dom'
import EntryForm from '../components/EntryForm'
import { api } from '../services/api'
import { useToast } from '../components/Toast'

export default function AddPassword() {
  const nav = useNavigate()
  const toast = useToast()
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Add password</h1>
      <EntryForm submitLabel="Save password" onCancel={() => nav('/vault')} onSubmit={async (data) => {
        await api.createEntry(data)
        toast('Password saved')
        nav('/vault')
      }} />
    </div>
  )
}

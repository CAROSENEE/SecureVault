import Logo from '../components/Logo'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="glass animate-rise p-7 sm:p-9">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
      </div>
    </div>
  )
}

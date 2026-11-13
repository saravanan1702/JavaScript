import { Construction } from 'lucide-react';

export default function ComingSoon({ title, phase }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="card mt-6 flex flex-col items-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Construction className="h-6 w-6" />
        </div>
        <p className="mt-4 font-medium text-slate-900">Coming in Phase {phase}</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          This section is part of the roadmap and will be built in its phase.
        </p>
      </div>
    </div>
  );
}

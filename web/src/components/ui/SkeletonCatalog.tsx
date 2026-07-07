import React from 'react';

export default function SkeletonCatalog() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-32"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-24"></div></th>
              <th className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16"></div></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-12"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-28"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-36"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-16"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-20"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-24"></div></td>
                <td className="px-6 py-4"><div className="h-3 bg-slate-800 rounded w-16"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-48"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-slate-800 rounded w-16"></div>
          <div className="h-8 bg-slate-800 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

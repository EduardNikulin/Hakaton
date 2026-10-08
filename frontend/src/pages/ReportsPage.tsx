// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { api } from '../api/client';
// import type { CitizenReport } from '../types/api';

// const STATUS_COLORS: Record<string, string> = {
//   new: 'bg-sky-500/20 text-sky-400',
//   in_progress: 'bg-amber-500/20 text-amber-400',
//   resolved: 'bg-emerald-500/20 text-emerald-400',
//   rejected: 'bg-rose-500/20 text-rose-400',
// };

// export function ReportsPage() {
//   const [reports, setReports] = useState<CitizenReport[]>([]);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     api.get<CitizenReport[]>('/api/v1/citizen-reports/').then(setReports).catch(() => setError('Нет данных'));
//   }, []);

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold">Жалобы жителей</h1>
//         <Link to="/map" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">
//           + Новая жалоба
//         </Link>
//       </div>

//       {error && <p className="text-red-400">{error}</p>}

//       <div className="overflow-x-auto rounded-xl bg-slate-800">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-slate-700 text-left text-slate-400">
//               <th className="px-4 py-3">Тип</th>
//               <th className="px-4 py-3">Описание</th>
//               <th className="px-4 py-3">Статус</th>
//               <th className="px-4 py-3">Дата</th>
//             </tr>
//           </thead>
//           <tbody>
//             {reports.map((r) => (
//               <tr key={r.id} className="border-b border-slate-700/50 last:border-0">
//                 <td className="px-4 py-3 font-medium">{r.complaint_type}</td>
//                 <td className="max-w-md truncate px-4 py-3 text-slate-300">{r.description}</td>
//                 <td className="px-4 py-3">
//                   <span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[r.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
//                     {r.status}
//                   </span>
//                 </td>
//                 <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString('ru')}</td>
//               </tr>
//             ))}
//             {reports.length === 0 && !error && (
//               <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Пока нет жалоб</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
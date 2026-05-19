import React from 'react';
import toast from 'react-hot-toast';

export default function Backup() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-[13px]">

      {/* ── Underlined title ───────────────────────────── */}
      <div className="flex items-center justify-center py-5">
        <h1 className="font-bold text-[15px] underline underline-offset-2">Backup</h1>
      </div>

      {/* ── Centered card ──────────────────────────────── */}
      <div className="flex items-center justify-center flex-1 pb-32">
        <div className="bg-[#eaf4fb] border border-[#c0ddf0] rounded-xl px-14 py-8 w-[340px]
                        flex flex-col gap-4 shadow-sm">
          <h2 className="text-center font-bold text-[14px] text-gray-800">Database Backup</h2>

          <button
            onClick={() => toast.success('Backup started…')}
            className="w-full py-2.5 bg-[#0b8fd3] text-white font-semibold text-[14px]
                       rounded-sm hover:bg-[#0a7ab8] transition-colors shadow-sm">
            Backup
          </button>

          <button
            onClick={() => toast.success('Downloading backup…')}
            className="w-full py-2.5 bg-[#0b8fd3] text-white font-semibold text-[14px]
                       rounded-sm hover:bg-[#0a7ab8] transition-colors shadow-sm">
            Download
          </button>
        </div>
      </div>

    </div>
  );
}

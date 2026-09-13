import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function Layout({ mode = 'user', title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar mode={mode} open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
        <footer className="px-4 sm:px-6 pb-4 max-w-[1400px] w-full mx-auto text-[10px] text-slate-700">
          Fotografías:{' '}
          <a href="https://unsplash.com/@leo_visions_" target="_blank" rel="noreferrer" className="underline hover:text-slate-500">
            Leo_Visions
          </a>{' '}
          ·{' '}
          <a href="https://unsplash.com/@togemet" target="_blank" rel="noreferrer" className="underline hover:text-slate-500">
            James Nilsson
          </a>{' '}
          — Unsplash
        </footer>
      </div>
    </div>
  );
}

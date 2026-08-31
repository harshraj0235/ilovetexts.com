'use client';

import Link from 'next/link';

export default function Gta6Promo({ lang }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-1 mt-8 mb-12 shadow-2xl group">
      {/* Animated glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
      
      <div className="relative bg-slate-900 rounded-xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 z-10 overflow-hidden">
        {/* Palm tree silhouettes / abstract background shapes */}
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-cyan-500/20 rounded-full blur-2xl"></div>

        <div className="flex-1 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-sm font-bold tracking-widest mb-4 border border-pink-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            TRENDING NOW
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Prepare for <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">Vice City</span>
          </h2>
          <p className="text-slate-300 text-lg mb-6 max-w-xl">
            Check out our new suite of GTA 6 tools! Generate your own 'Florida Man' breaking news headlines, create custom license plates, and build the ultimate hype.
          </p>
          <Link href={`/${lang}/gta-6-tools/vice-city-headline-generator`} className="inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(219,39,119,0.5)] hover:shadow-[0_0_25px_rgba(219,39,119,0.7)] group-hover:-translate-y-1">
            Try the Headline Generator
            <svg className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </Link>
        </div>

        {/* Decorative graphic right side */}
        <div className="hidden md:flex flex-col gap-3 z-10 opacity-80 transform rotate-3">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 shadow-xl w-64 transform -rotate-6 translate-y-4 hover:rotate-0 hover:translate-y-0 transition duration-300">
            <div className="h-4 bg-pink-500 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-full mb-1"></div>
            <div className="h-3 bg-white/20 rounded w-5/6"></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20 shadow-xl w-64 transform rotate-3 -translate-x-4 hover:rotate-0 hover:translate-x-0 transition duration-300">
             <div className="h-4 bg-cyan-500 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-white/20 rounded w-full mb-1"></div>
            <div className="h-3 bg-white/20 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

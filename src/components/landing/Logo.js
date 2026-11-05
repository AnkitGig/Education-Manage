export default function Logo({ className = 'h-8', dark = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 44 34" className={className} aria-hidden="true">
        <path d="M2 5 L19 9 V30 L2 26 Z" fill="#1f5fe0" />
        <path d="M42 5 L25 9 V30 L42 26 Z" fill="#4d8bff" />
        <path d="M19 9 Q22 6.5 25 9 V30 Q22 27.5 19 30 Z" fill="#123a94" />
      </svg>
      <span className={`text-[22px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-navy'}`}>EduManage<sup className="ml-0.5 text-[9px] font-semibold">®</sup></span>
    </span>
  );
}

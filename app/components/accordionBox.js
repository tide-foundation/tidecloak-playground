export default function AccordionBox({ title, children, isOpen }) {
    return (
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          } bg-slate-50 border-l-4 border-blue-500 rounded-md shadow-inner px-5 py-0 mb-4 text-sm space-y-3 ring-1 ring-slate-300`}
      >
        {isOpen && (
          <div className="py-5">
            {title && (
              <h4 className="text-base font-bold text-blue-900 tracking-wide uppercase">
                {title}
              </h4>
            )}
            <div className="text-slate-700 leading-relaxed">{children}</div>
          </div>
        )}
      </div>
    );
  }
export default function Card({ children, className = '', hover = false }) {
  return (
    <div className={`
      bg-white dark:bg-slate-800 
      rounded-xl 
      border border-gray-200 dark:border-slate-700
      shadow-sm
      ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

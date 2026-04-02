interface ThemeToggleProps {
  darkMode: boolean
  onToggle: () => void
}

export default function ThemeToggle({ darkMode, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="relative w-16 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-purple-600 dark:to-indigo-800 transition-all duration-500 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-500"
      aria-label="Toggle dark mode"
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-500 ease-in-out flex items-center justify-center ${
          darkMode ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        <span className="text-sm transform transition-transform duration-500">
          {darkMode ? '🌙' : '☀️'}
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-semibold text-white pointer-events-none">
        <span className={`transition-opacity duration-300 ${darkMode ? 'opacity-0' : 'opacity-100'}`}>
          ☀️
        </span>
        <span className={`transition-opacity duration-300 ${darkMode ? 'opacity-100' : 'opacity-0'}`}>
          🌙
        </span>
      </div>
    </button>
  )
}

import { motion } from 'framer-motion'
import { GridIcon } from './contractorIcons.jsx'

function CategoryTabs({ groups, active, onChange }) {
  const tabs = [{ id: 'all', label: 'All Categories', icon: GridIcon }, ...groups.map((g) => ({ id: g.id, label: g.label }))]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              isActive ? 'border-transparent text-charcoal' : 'border-ink/10 text-ink/60 hover:border-ink/20 hover:text-ink'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="category-tab-pill"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gold-500"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs

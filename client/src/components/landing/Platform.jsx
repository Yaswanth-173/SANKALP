import SectionHeading from './SectionHeading.jsx'
import { PLATFORM } from './content.js'
import { useTranslation } from '../../i18n/index.js'
import contractorIcon from '../../assets/dashboard-icons/contractor-icon.png'
import taskTrackerIcon from '../../assets/dashboard-icons/task-tracker-icon.png'
import materialDetailsIcon from '../../assets/dashboard-icons/material-details-icon.png'
import costComparisonIcon from '../../assets/dashboard-icons/cost-comparison-icon.png'
import progressUpdatesIcon from '../../assets/dashboard-icons/progress-updates-icon.png'
import budgetExpensesIcon from '../../assets/dashboard-icons/budget-expenses-icon.png'

const ICONS = {
  contractors: contractorIcon,
  tasks: taskTrackerIcon,
  materials: materialDetailsIcon,
  costComparison: costComparisonIcon,
  progress: progressUpdatesIcon,
  budget: budgetExpensesIcon,
}

/** The six customer-dashboard tools, shown before signup. */
function Platform() {
  const { t } = useTranslation()
  const total = String(PLATFORM.features.length).padStart(2, '0')

  return (
    <section id="platform" className="section-pad relative">
      <div className="container-page">
        <SectionHeading index="04" eyebrow={PLATFORM.eyebrow} title={PLATFORM.title} />

        <ul data-platform-stack className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM.features.map((key, i) => (
            <li
              key={key}
              data-platform-card={i}
              className="card group relative flex flex-col overflow-hidden p-6 transition-[border-color,box-shadow] duration-300 hover:border-gold-500/50 hover:shadow-glow sm:p-7"
            >
              <div className="flex items-start justify-between">
                <img src={ICONS[key]} alt="" width="96" height="96" loading="lazy" decoding="async" className="h-20 w-20 object-contain drop-shadow-[0_10px_24px_rgb(0_0_0/0.45)] sm:h-24 sm:w-24" />
                <span className="tabular text-xs font-medium text-fg-subtle">
                  {String(i + 1).padStart(2, '0')} / {total}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-fg">{t(`cards.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(`cards.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Platform

import FeatureCard from './FeatureCard.jsx'
import { useTranslation } from '../../i18n/index.js'
import contractorIcon from '../../assets/dashboard-icons/contractor-icon.png'
import taskTrackerIcon from '../../assets/dashboard-icons/task-tracker-icon.png'
import materialDetailsIcon from '../../assets/dashboard-icons/material-details-icon.png'
import costComparisonIcon from '../../assets/dashboard-icons/cost-comparison-icon.png'
import progressUpdatesIcon from '../../assets/dashboard-icons/progress-updates-icon.png'
import budgetExpensesIcon from '../../assets/dashboard-icons/budget-expenses-icon.png'

function FeatureGrid() {
  const { t } = useTranslation()

  const features = [
    { icon: contractorIcon, titleKey: 'cards.contractors.title', descKey: 'cards.contractors.description', to: '/dashboard/contractors' },
    { icon: taskTrackerIcon, titleKey: 'cards.tasks.title', descKey: 'cards.tasks.description', to: '/dashboard/tasks' },
    { icon: materialDetailsIcon, titleKey: 'cards.materials.title', descKey: 'cards.materials.description', to: '/dashboard/materials' },
    { icon: costComparisonIcon, titleKey: 'cards.costComparison.title', descKey: 'cards.costComparison.description', to: '/dashboard/cost-comparison' },
    { icon: progressUpdatesIcon, titleKey: 'cards.progress.title', descKey: 'cards.progress.description', to: '/dashboard/progress' },
    { icon: budgetExpensesIcon, titleKey: 'cards.budget.title', descKey: 'cards.budget.description', to: '/dashboard/budget' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {features.map(({ titleKey, descKey, ...feature }, i) => (
        <FeatureCard key={feature.to} index={i} title={t(titleKey)} description={t(descKey)} {...feature} />
      ))}
    </div>
  )
}

export default FeatureGrid

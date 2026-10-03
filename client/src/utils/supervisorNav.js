import { BudgetIcon, ProgressIcon, ProjectsIcon, SettingsIcon } from '../components/dashboard/icons.jsx'

export const supervisorNavItems = [
  { to: '/supervisor', label: 'Projects', icon: ProjectsIcon, end: true },
  { to: '/dashboard/progress', label: 'Progress Updates', icon: ProgressIcon },
  { to: '/dashboard/budget', label: 'Budget & Expenses', icon: BudgetIcon },
  { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

// Contractors don't get the Budget & Expenses link — the backend never
// grants that role budget/expense routes (a contractor's job is the work,
// not the customer's finances), so there's nothing behind it for them.
export const contractorNavItems = [
  { to: '/contractor', label: 'Projects', icon: ProjectsIcon, end: true },
  { to: '/dashboard/progress', label: 'Progress Updates', icon: ProgressIcon },
  { to: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
]

export const ROLES = [
  {
    value: 'contractor',
    labelKey: 'roles.contractor',
    color: 'text-gold-300',
    bg: 'bg-gold-500/15',
    border: 'border-gold-500/30',
    dot: 'bg-gold-400',
  },
  {
    value: 'supervisor',
    labelKey: 'roles.supervisor',
    color: 'text-blue-300',
    bg: 'bg-blue-500/15',
    border: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  {
    value: 'worker',
    labelKey: 'roles.worker',
    color: 'text-teal-300',
    bg: 'bg-teal-500/15',
    border: 'border-teal-400/30',
    dot: 'bg-teal-400',
  },
  {
    value: 'material_shop',
    labelKey: 'roles.materialShop',
    color: 'text-orange-300',
    bg: 'bg-orange-500/15',
    border: 'border-orange-400/30',
    dot: 'bg-orange-400',
  },
]

export const roleConfig = (role) => ROLES.find((r) => r.value === role) || ROLES[0]

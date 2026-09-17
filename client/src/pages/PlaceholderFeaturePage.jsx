import { motion } from 'framer-motion'
import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import { useTranslation } from '../i18n/index.js'

function PlaceholderFeaturePage({ title, description, icon }) {
  const { t } = useTranslation()
  const isImageIcon = typeof icon === 'string'
  const Icon = isImageIcon ? null : icon
  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} title={title.toUpperCase()} subtitle={description} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-ink/10 bg-navy-900/40 px-6 py-20 text-center"
          >
            {isImageIcon ? (
              <img
                src={icon}
                alt=""
                className="h-24 w-24 rounded-xl object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
                draggable={false}
              />
            ) : (
              Icon && (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/10 bg-navy-950/60 text-gold-300">
                  <Icon className="h-6 w-6" />
                </span>
              )
            )}
            <h2 className="mt-5 font-display text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-2 max-w-md text-sm text-ink/50">
              {t('placeholder.comingSoon')}
            </p>
          </motion.div>
        </>
      )}
    </DashboardShell>
  )
}

export default PlaceholderFeaturePage

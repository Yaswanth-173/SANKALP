import DashboardShell from '../components/dashboard/DashboardShell.jsx'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import FeatureGrid from '../components/dashboard/FeatureGrid.jsx'

function CustomerDashboard() {
  return (
    <DashboardShell>
      {({ onMenuClick }) => (
        <>
          <DashboardHeader onMenuClick={onMenuClick} />
          <div className="mt-7">
            <FeatureGrid />
          </div>
        </>
      )}
    </DashboardShell>
  )
}

export default CustomerDashboard

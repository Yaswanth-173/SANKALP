// Lets the Projects list, Budget & Expenses, and Progress Updates pages
// agree on "which project" across navigation without a shared parent
// component — each page reads this on mount as its initial pick, and
// writes it whenever the user switches projects, so hopping between
// modules keeps the same project selected where practical.
const KEY = 'sankalp_selected_project_id'

export function getSelectedProjectId() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setSelectedProjectId(id) {
  try {
    if (id) localStorage.setItem(KEY, id)
  } catch {
    // Non-fatal — worst case the other page falls back to its own default.
  }
}

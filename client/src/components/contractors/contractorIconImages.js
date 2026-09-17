const modules = import.meta.glob('../../assets/contractor-icons/*.png', { eager: true, import: 'default' })

// Maps a category slug (e.g. "civil", "full-house-construction") to its
// cropped icon-sheet image URL, keyed by filename.
export const CONTRACTOR_ICON_IMAGES = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const slug = path.split('/').pop().replace('.png', '')
    return [slug, url]
  })
)

import { isProduction } from '@shared/consts'

// Demo-only shortcut: every authorized localhost user can open the teacher PE screen.
// Remove this helper and its usages before wiring the feature to real production permissions.
export const isDemoPeTeacherAccessEnabled = () => !isProduction

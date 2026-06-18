import { attach, createEvent, restore, sample } from 'effector'

import { peApi } from '@shared/api'
import { PeTeacherPermission } from '@shared/api/physical-education'
import { isDemoPeTeacherAccessEnabled } from '@shared/lib/dev-pe-access'
import { userModel } from '@shared/session'

const load = createEvent()

const loadFx = attach({
    effect: async (currentUser) => {
        if (currentUser && isDemoPeTeacherAccessEnabled()) {
            return {
                id: currentUser?.guid ?? '',
                fullName: currentUser?.fullName ?? 'Тестовый преподаватель',
                permissions: [PeTeacherPermission.DefaultAccess],
                groups: [],
            }
        }

        const { data } = await peApi.getTeacher(currentUser?.guid ?? '')

        return { ...data.data, id: currentUser?.guid ?? '' }
    },
    source: userModel.stores.user,
})

const $peTeacher = restore(loadFx, null)

sample({
    clock: userModel.events.authenticated,
    target: load,
})

sample({ clock: load, target: loadFx })

const $isLoading = loadFx.pending

export const events = {
    load,
}

export const stores = {
    peTeacher: $peTeacher,
    isLoading: $isLoading,
}

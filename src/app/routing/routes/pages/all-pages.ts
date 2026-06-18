import { createStore, sample } from 'effector'

import { PageRoute } from '@shared/routing'
import { userModel } from '@shared/session'
import { isDemoPeTeacherAccessEnabled } from '@shared/lib/dev-pe-access'

import { employeeHiddenPages, employeePages } from '../employee'
import { privateHiddenPages, privatePages } from '../private'
import { hiddenStudentPages, studentPages } from '../student'

export const $allPages = createStore<PageRoute | null>(null)

sample({
    clock: userModel.stores.user,
    source: userModel.stores.user,
    fn: (user) => ({
        ...privatePages,
        ...privateHiddenPages,
        ...(user?.user_status === 'stud'
            ? {
                  ...studentPages,
                  ...hiddenStudentPages,
                  ...(isDemoPeTeacherAccessEnabled()
                      ? { 'physical-education-teacher': employeePages['physical-education'] }
                      : {}),
              }
            : { ...employeePages, ...employeeHiddenPages }),
    }),
    target: $allPages,
})

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { FiRefreshCw } from 'react-icons/fi'

import { createQrToken, PEStudentProfile, QrStudentPayload, QrTokenResponse } from '@shared/api/physical-education'
import { Button, Title } from '@shared/ui/atoms'

import { QrCard, QrImageBox, QrInfo, StatusMessage } from './styled'

type Props = {
    student: PEStudentProfile
}

const secondsUntil = (date: string) => Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 1000))

const toPayload = (student: PEStudentProfile): QrStudentPayload => ({
    studentGuid: student.studentGuid,
    fullName: student.fullName,
    groupNumber: student.groupNumber,
    healthGroup: student.healthGroup,
    specialization: student.specialization,
    course: student.course,
    totalPoints: student.totalPoints,
    lmsPoints: student.lmsPoints,
    hasDebt: student.hasDebt,
})

export const StudentQrCard = ({ student }: Props) => {
    const [visible, setVisible] = useState(false)
    const [tokenInfo, setTokenInfo] = useState<QrTokenResponse | null>(null)
    const [qrImage, setQrImage] = useState('')
    const [secondsLeft, setSecondsLeft] = useState(20)
    const [error, setError] = useState('')

    const payload = useMemo(() => toPayload(student), [student])

    const createToken = useCallback(async () => {
        try {
            setError('')
            const nextToken = await createQrToken(payload)
            const scanUrl = `${window.location.origin}${window.location.pathname}#/physical-education/main?qrToken=${nextToken.token}`
            const image = await QRCode.toDataURL(scanUrl, {
                width: 290,
                margin: 1,
                color: { dark: '#111111', light: '#ffffff' },
            })

            setTokenInfo(nextToken)
            setQrImage(image)
            setSecondsLeft(secondsUntil(nextToken.expiresAt))
        } catch {
            setError('Не удалось создать QR-код. Проверьте QR backend.')
        }
    }, [payload])

    useEffect(() => {
        if (!visible) return undefined

        createToken()
        const refreshId = window.setInterval(createToken, 20_000)
        return () => window.clearInterval(refreshId)
    }, [createToken, visible])

    useEffect(() => {
        if (!tokenInfo?.expiresAt) return undefined

        const tickId = window.setInterval(() => setSecondsLeft(secondsUntil(tokenInfo.expiresAt)), 500)
        return () => window.clearInterval(tickId)
    }, [tokenInfo])

    if (!visible) {
        return (
            <Button
                text="Показать QR для отметки"
                background="var(--blue)"
                textColor="#fff"
                onClick={() => setVisible(true)}
            />
        )
    }

    return (
        <QrCard>
            <QrImageBox>{qrImage && <img src={qrImage} alt="QR-код для выставления баллов" />}</QrImageBox>
            <QrInfo>
                <Title size={4} align="left">
                    QR для отметки посещения
                </Title>
                <div>
                    <span className="muted">Код подтверждения</span>
                    <div className="code">{tokenInfo?.confirmationCode ?? '--'}</div>
                </div>
                <span className="muted">
                    QR действует {secondsLeft} сек. и содержит только временный одноразовый токен.
                </span>
                <Button
                    icon={<FiRefreshCw />}
                    text="Обновить QR"
                    background="var(--search)"
                    textColor="var(--text)"
                    onClick={createToken}
                />
                {error && <StatusMessage>{error}</StatusMessage>}
            </QrInfo>
        </QrCard>
    )
}

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { FiRefreshCw, FiX } from 'react-icons/fi'

import { createQrToken, PEStudentProfile, QrStudentPayload, QrTokenResponse } from '@shared/api/physical-education'
import { Button, Title } from '@shared/ui/atoms'

import { CloseButton, QrCard, QrImageBox, QrInfo, StatusMessage, TimerPill } from './styled'

type Props = {
    student: PEStudentProfile
}

const secondsUntil = (date: string) => Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 1000))
const qrRefreshSeconds = 60
const qrSize = 290
const qrLogoSrc = '/icon.png'

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = src
    })

const addLogoToQr = async (qrDataUrl: string) => {
    const [qr, logo] = await Promise.all([loadImage(qrDataUrl), loadImage(qrLogoSrc)])
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) return qrDataUrl

    canvas.width = qrSize
    canvas.height = qrSize
    context.drawImage(qr, 0, 0, qrSize, qrSize)

    const logoSize = Math.round(qrSize * 0.19)
    const logoPadding = Math.round(qrSize * 0.035)
    const boxSize = logoSize + logoPadding * 2
    const boxX = (qrSize - boxSize) / 2
    const boxY = (qrSize - boxSize) / 2
    const logoX = (qrSize - logoSize) / 2
    const logoY = (qrSize - logoSize) / 2

    context.fillStyle = '#ffffff'
    context.beginPath()
    context.roundRect(boxX, boxY, boxSize, boxSize, 12)
    context.fill()
    context.drawImage(logo, logoX, logoY, logoSize, logoSize)

    return canvas.toDataURL('image/png')
}

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
    const [secondsLeft, setSecondsLeft] = useState(qrRefreshSeconds)
    const [error, setError] = useState('')

    const payload = useMemo(() => toPayload(student), [student])

    const createToken = useCallback(async () => {
        try {
            setError('')
            const nextToken = await createQrToken(payload)
            const scanUrl = `${window.location.origin}${window.location.pathname}#/physical-education/main?qrToken=${nextToken.token}`
            const image = await QRCode.toDataURL(scanUrl, {
                width: qrSize,
                margin: 1,
                errorCorrectionLevel: 'H',
                color: { dark: '#111111', light: '#ffffff' },
            })

            setTokenInfo(nextToken)
            setQrImage(await addLogoToQr(image))
            setSecondsLeft(secondsUntil(nextToken.expiresAt))
        } catch {
            setError('Не удалось создать QR-код. Попробуйте обновить страницу.')
        }
    }, [payload])

    useEffect(() => {
        if (!visible) return undefined

        createToken()
        const refreshId = window.setInterval(createToken, qrRefreshSeconds * 1000)
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

    const timerProgress = Math.min(100, Math.max(0, (secondsLeft / qrRefreshSeconds) * 100))

    return (
        <QrCard>
            <CloseButton
                type="button"
                aria-label="Скрыть QR-код"
                title="Скрыть QR-код"
                onClick={() => {
                    setVisible(false)
                    setTokenInfo(null)
                    setQrImage('')
                    setSecondsLeft(qrRefreshSeconds)
                    setError('')
                }}
            >
                <FiX />
            </CloseButton>
            <QrImageBox>{qrImage && <img src={qrImage} alt="QR-код для выставления баллов" />}</QrImageBox>
            <QrInfo>
                <Title size={4} align="left">
                    QR для отметки посещения
                </Title>
                <div>
                    <span className="muted">Код подтверждения</span>
                    <div className="code">{tokenInfo?.confirmationCode ?? '--'}</div>
                </div>
                <TimerPill>
                    <div className="timer-title">QR-код действует {secondsLeft} сек.</div>
                    <div className="timer-track">
                        <div className="timer-fill" style={{ width: `${timerProgress}%` }} />
                    </div>
                </TimerPill>
                <span className="muted">Покажите QR и код подтверждения преподавателю.</span>
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

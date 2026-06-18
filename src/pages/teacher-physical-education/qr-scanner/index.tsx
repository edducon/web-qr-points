import React, { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { FiCamera, FiCheckCircle, FiStopCircle } from 'react-icons/fi'

import { Button, Title } from '@shared/ui/atoms'
import { markQrPoints, QrMarkResponse, QrScanResponse, scanQrToken } from '@shared/api/physical-education'

import { ManualTokenForm, ScannerCard, StatusBadge, StatusMessage, StudentResult, VideoBox } from './styled'

const statusTitle: Record<QrScanResponse['status'], string> = {
    valid: 'QR-код действителен',
    expired: 'QR-код истек',
    used: 'QR-код уже использован',
    not_found: 'QR-код не найден',
}

const extractToken = (value: string) => {
    if (!value) return ''

    try {
        const url = new URL(value)
        return url.searchParams.get('qrToken') ?? url.searchParams.get('token') ?? value.trim()
    } catch {
        const match = value.match(/[?&](?:qrToken|token)=([^&]+)/)
        return match ? decodeURIComponent(match[1]) : value.trim()
    }
}

const tokenFromHash = () => {
    const [, query = ''] = window.location.hash.split('?')
    return new URLSearchParams(query).get('qrToken') ?? ''
}

const formatDate = (date?: string) =>
    date
        ? new Intl.DateTimeFormat('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
          }).format(new Date(date))
        : '-'

export const TeacherQrScanner = () => {
    const [cameraActive, setCameraActive] = useState(false)
    const [manualToken, setManualToken] = useState(tokenFromHash())
    const [scanResult, setScanResult] = useState<QrScanResponse & { token?: string }>({ status: 'not_found' })
    const [markResult, setMarkResult] = useState<QrMarkResponse | null>(null)
    const [message, setMessage] = useState('')
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const frameRef = useRef<number | null>(null)
    const scanningRef = useRef(false)

    const stopCamera = useCallback(() => {
        scanningRef.current = false
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setCameraActive(false)
    }, [])

    const scanToken = useCallback(
        async (value: string) => {
            const token = extractToken(value)
            if (!token) {
                setMessage('QR-код не найден или недействителен.')
                return
            }

            try {
                setMessage('')
                setMarkResult(null)
                const result = await scanQrToken(token)
                setScanResult({ ...result, token })
                setManualToken(token)
                stopCamera()
            } catch (error) {
                const failed = error as QrScanResponse
                setScanResult({ ...failed, token })
                setMessage(failed.message ?? 'QR-код не найден или недействителен.')
            }
        },
        [stopCamera],
    )

    const scanFrame = useCallback(() => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current
            const context = canvas.getContext('2d', { willReadFrequently: true })

            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                const image = context.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQR(image.data, image.width, image.height)

                if (code?.data) {
                    scanToken(code.data)
                    return
                }
            }
        }

        frameRef.current = requestAnimationFrame(scanFrame)
    }, [scanToken])

    const startCamera = useCallback(async () => {
        try {
            setMessage('')
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            })
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            setCameraActive(true)
            scanningRef.current = true
            frameRef.current = requestAnimationFrame(scanFrame)
        } catch {
            setMessage('Не удалось открыть камеру. Проверьте разрешения браузера.')
        }
    }, [scanFrame])

    const markPoints = async () => {
        if (!scanResult.token) return

        try {
            const result = await markQrPoints(scanResult.token)
            setMarkResult(result)
            setScanResult((current) => ({ ...current, status: 'used' }))
            setMessage('')
        } catch (error) {
            const failed = error as QrScanResponse
            setMessage(failed.message ?? 'Не удалось выставить баллы.')
        }
    }

    useEffect(() => {
        const hashToken = tokenFromHash()
        if (hashToken) scanToken(hashToken)
        return stopCamera
    }, [scanToken, stopCamera])

    const student = scanResult.student
    const isValid = scanResult.status === 'valid'

    return (
        <ScannerCard>
            <Title size={4} align="left">
                QR-отметка посещения
            </Title>
            <div className="actions">
                <Button icon={<FiCamera />} text="Сканировать QR" background="var(--blue)" textColor="#fff" onClick={startCamera} />
                <Button icon={<FiStopCircle />} text="Остановить" background="var(--search)" textColor="var(--text)" onClick={stopCamera} />
            </div>
            <VideoBox>
                <video ref={videoRef} muted playsInline />
                <canvas ref={canvasRef} />
                {!cameraActive && (
                    <div className="placeholder">
                        <FiCamera size={46} />
                        <span>Камера выключена</span>
                    </div>
                )}
                <div className="frame" />
            </VideoBox>
            <ManualTokenForm
                onSubmit={(event) => {
                    event.preventDefault()
                    scanToken(manualToken)
                }}
            >
                <input
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    placeholder="Токен или ссылка из QR"
                />
                <Button text="Проверить" background="var(--search)" textColor="var(--text)" />
            </ManualTokenForm>
            {student && (
                <StudentResult>
                    <div className="avatar">{student.fullName.slice(0, 2).toUpperCase()}</div>
                    <div className="data">
                        <b>{student.fullName}</b>
                        <span>Группа: {student.groupNumber}</span>
                        <span>Код подтверждения: {scanResult.confirmationCode}</span>
                        <span>QR действует до: {formatDate(scanResult.expiresAt)}</span>
                        <StatusBadge status={scanResult.status}>{statusTitle[scanResult.status]}</StatusBadge>
                    </div>
                </StudentResult>
            )}
            <Button
                icon={<FiCheckCircle />}
                text="Выставить баллы"
                background="var(--blue)"
                textColor="#fff"
                isActive={isValid}
                notActiveClickMessage="Сначала просканируйте действительный QR-код"
                onClick={markPoints}
            />
            {message && <StatusMessage>{message}</StatusMessage>}
            {markResult && (
                <StatusMessage type="success">
                    {markResult.message}. {markResult.student.fullName}, {markResult.record.points} балл,{' '}
                    {formatDate(markResult.record.createdAt)}
                </StatusMessage>
            )}
        </ScannerCard>
    )
}

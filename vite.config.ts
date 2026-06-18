import { randomBytes, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'

import { babel } from '@rollup/plugin-babel'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, splitVendorChunkPlugin } from 'vite'
import checker from 'vite-plugin-checker'
import svgr from 'vite-plugin-svgr'
import tsconfigPaths from 'vite-tsconfig-paths'

import { version } from './package.json'

type QrStudent = Record<string, unknown>

type QrToken = {
    token: string
    student: QrStudent
    confirmationCode: string
    createdAt: string
    expiresAt: string
    usedAt: string | null
    isUsed: boolean
}

const qrTtlMs = 60_000
const qrTokens = new Map<string, QrToken>()
const qrRecords: Array<Record<string, unknown>> = []

const qrMessages = {
    expired: 'QR-код просрочен. Попросите студента обновить код.',
    used: 'QR-код уже был использован.',
    not_found: 'QR-код не найден или недействителен.',
}

const sendJson = (response: ServerResponse, statusCode: number, payload: unknown) => {
    response.statusCode = statusCode
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(payload))
}

const readJsonBody = async (request: IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = []

        request.on('data', (chunk) => chunks.push(chunk))
        request.on('end', () => {
            if (!chunks.length) {
                resolve({})
                return
            }

            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
            } catch (error) {
                reject(error)
            }
        })
        request.on('error', reject)
    })

const validateQrToken = (token: unknown) => {
    const qrToken = typeof token === 'string' ? qrTokens.get(token) : null

    if (!qrToken) return { status: 'not_found', message: qrMessages.not_found }
    if (qrToken.isUsed) return { status: 'used', message: qrMessages.used }
    if (new Date(qrToken.expiresAt).getTime() <= Date.now()) {
        return { status: 'expired', message: qrMessages.expired }
    }

    return {
        status: 'valid',
        student: qrToken.student,
        confirmationCode: qrToken.confirmationCode,
        expiresAt: qrToken.expiresAt,
    }
}

const qrDevApiPlugin = (): Plugin => ({
    name: 'lk-qr-dev-api',
    configureServer(server) {
        server.middlewares.use('/qr-api', async (request, response, next) => {
            const path = request.url?.split('?')[0] ?? '/'

            try {
                if (request.method === 'GET' && path === '/health') {
                    sendJson(response, 200, { status: 'ok' })
                    return
                }

                if (request.method === 'POST' && path === '/qr/create') {
                    const body = await readJsonBody(request)
                    const now = new Date()
                    const token = randomUUID()
                    const expiresAt = new Date(now.getTime() + qrTtlMs).toISOString()
                    const confirmationCode = randomBytes(1).toString('hex').toUpperCase()
                    const student = (body.student ?? {}) as QrStudent

                    qrTokens.set(token, {
                        token,
                        student,
                        confirmationCode,
                        createdAt: now.toISOString(),
                        expiresAt,
                        usedAt: null,
                        isUsed: false,
                    })

                    sendJson(response, 200, { token, expiresAt, confirmationCode })
                    return
                }

                if (request.method === 'POST' && path === '/qr/scan') {
                    const body = await readJsonBody(request)
                    const result = validateQrToken(body.token)
                    sendJson(response, result.status === 'valid' ? 200 : 400, result)
                    return
                }

                if (request.method === 'POST' && path === '/points/mark') {
                    const body = await readJsonBody(request)
                    const result = validateQrToken(body.token)

                    if (result.status !== 'valid') {
                        sendJson(response, 400, result)
                        return
                    }

                    const qrToken = qrTokens.get(body.token as string)
                    const record = {
                        id: qrRecords.length + 1,
                        studentGuid: qrToken?.student.studentGuid,
                        teacherId: 'mock-teacher',
                        points: 1,
                        createdAt: new Date().toISOString(),
                    }

                    if (qrToken) {
                        qrToken.isUsed = true
                        qrToken.usedAt = record.createdAt
                    }

                    qrRecords.push(record)
                    sendJson(response, 200, {
                        status: 'success',
                        message: 'Баллы успешно выставлены',
                        record,
                        student: qrToken?.student,
                    })
                    return
                }

                sendJson(response, 404, { status: 'not_found' })
            } catch (error) {
                sendJson(response, 500, { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' })
            }
        })
    },
})

const localIndexFallbackPlugin = (): Plugin => ({
    name: 'lk-local-index-fallback',
    configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
            const path = request.url?.split('?')[0]

            if (path === '/' || path === '/index.html') {
                const html = await readFile(resolve(process.cwd(), 'index.html'), 'utf8')
                const transformedHtml = await server.transformIndexHtml(request.url ?? '/', html)
                response.statusCode = 200
                response.setHeader('Content-Type', 'text/html; charset=utf-8')
                response.end(transformedHtml)
                return
            }

            next()
        })
    },
})

export default defineConfig((conf) => {
    const env = loadEnv(conf.mode, process.cwd())

    return {
        server: {
            open: process.env.VITE_OPEN !== 'false',
            port: 3000,
            proxy: {
                '/api': {
                    target: `${env.VITE_URL}/old/lk_api.php`,
                    secure: false,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ''),
                },
                '/pe-api': {
                    target: 'https://api.mospolytech.ru/physedjournal/',
                    secure: false,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/pe-api/, ''),
                },
            },
        },
        esbuild: {
            // jsxInject: (str: string) => (!str.includes('import React') ? "import React from 'react'" : ''),
            logOverride: { 'this-is-undefined-in-esm': 'silent' },
        },
        preview: { port: 3000 },
        plugins: [
            babel({
                presets: [
                    '@babel/typescript',
                    '@babel/react',
                    'patronum/babel-preset',
                    [
                        '@babel/preset-env',
                        {
                            targets: {
                                node: 10,
                            },
                            useBuiltIns: 'usage',
                            corejs: 3,
                        },
                    ],
                ],
                plugins: [['effector/babel-plugin', { factories: [] }]],
                extensions: ['.ts', '.tsx'],
                babelHelpers: 'bundled',
                targets: '>0.25%, iOS>= 13, last 2 versions, not dead',
            }),
            react({
                babel: {
                    plugins: [
                        [
                            'babel-plugin-styled-components',
                            {
                                displayName: process.env.NODE_ENV === 'development',
                                fileName: false,
                            },
                        ],
                    ],
                },
            }),
            localIndexFallbackPlugin(),
            qrDevApiPlugin(),
            tsconfigPaths(),
            svgr(),
            splitVendorChunkPlugin(),
            checker({ typescript: true, eslint: { lintCommand: 'eslint "./src/**/*.{ts,tsx}"' } }),
        ],
        build: {
            outDir: 'build',
            manifest: true,
            target: 'es2015',
        },
        optimizeDeps: {
            include: ['effector'],
        },
        define: {
            'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
        },
    }
})

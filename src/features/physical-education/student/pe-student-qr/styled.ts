import styled from 'styled-components'

export const QrCard = styled.div`
    position: relative;
    width: 100%;
    display: grid;
    grid-template-columns: minmax(220px, 320px) 1fr;
    gap: 18px;
    align-items: center;
    padding: 18px;
    border-radius: var(--brLight);
    background: var(--block-content);
    box-shadow: var(--block-content-shadow);

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
        padding: 12px;
    }
`

export const CloseButton = styled.button`
    position: absolute;
    top: 10px;
    right: 10px;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: var(--redMain);
    color: #fff;
    cursor: pointer;
    box-shadow: var(--block-shadow-1);

    svg {
        width: 20px;
        height: 20px;
    }
`

export const QrImageBox = styled.div`
    display: grid;
    place-items: center;
    padding: 16px;
    border-radius: var(--brLight);
    background: #fff;

    img {
        width: min(100%, 290px);
        aspect-ratio: 1;
        display: block;
    }
`

export const QrInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .code {
        font-size: clamp(44px, 8vw, 76px);
        line-height: 1;
        font-weight: 700;
        color: var(--text);
    }

    .muted {
        color: var(--theme-mild-opposite);
        font-weight: 500;
        line-height: 1.35;
    }
`

export const TimerPill = styled.div`
    width: min(100%, 360px);
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--brLight);
    background: var(--theme-2);
    color: var(--text);
    font-weight: 600;
    line-height: 1.25;

    .timer-title {
        font-size: 0.95rem;
    }

    .timer-track {
        width: 100%;
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--almostTransparentOpposite);
    }

    .timer-fill {
        height: 100%;
        border-radius: inherit;
        background: var(--blue);
        transition: width 0.45s linear;
    }
`

export const StatusMessage = styled.div<{ type?: 'error' | 'success' }>`
    padding: 10px;
    border-radius: var(--brLight);
    background: ${({ type }) => (type === 'success' ? 'var(--greenTransparent)' : 'var(--redMain)')};
    color: ${({ type }) => (type === 'success' ? 'var(--invert-text)' : '#fff')};
    font-weight: 600;
`

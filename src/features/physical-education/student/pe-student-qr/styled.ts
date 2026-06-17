import styled from 'styled-components'

export const QrCard = styled.div`
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

export const StatusMessage = styled.div<{ type?: 'error' | 'success' }>`
    padding: 10px;
    border-radius: var(--brLight);
    background: ${({ type }) => (type === 'success' ? 'var(--greenTransparent)' : 'var(--redMain)')};
    color: ${({ type }) => (type === 'success' ? 'var(--invert-text)' : '#fff')};
    font-weight: 600;
`

import styled from 'styled-components'

export const ScannerCard = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: var(--brLight);
    background: var(--block-content);
    box-shadow: var(--block-content-shadow);

    .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    @media (max-width: 700px) {
        padding: 12px;

        .actions {
            display: grid;
            grid-template-columns: 1fr;
        }
    }
`

export const VideoBox = styled.div`
    position: relative;
    overflow: hidden;
    min-height: 320px;
    aspect-ratio: 16 / 10;
    border-radius: var(--brLight);
    background: var(--theme-2);
    border: 1px solid var(--almostTransparentOpposite);

    video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    canvas {
        display: none;
    }

    .placeholder {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 8px;
        color: var(--theme-mild-opposite);
        font-weight: 600;
    }

    .frame {
        position: absolute;
        inset: 12%;
        border: 2px solid var(--blue);
        border-radius: var(--brLight);
        opacity: 0.6;
        pointer-events: none;
    }

    @media (max-width: 700px) {
        min-height: 430px;
        aspect-ratio: 3 / 4;
    }
`

export const StudentResult = styled.div`
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border-radius: var(--brLight);
    background: var(--theme-2);

    .avatar {
        width: 74px;
        height: 74px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: var(--blue);
        color: #fff;
        font-size: 24px;
        font-weight: 700;
    }

    .data {
        display: grid;
        gap: 5px;
    }

    b {
        font-size: 1.05rem;
    }

    span {
        color: var(--theme-mild-opposite);
        font-weight: 500;
    }
`

export const StatusMessage = styled.div<{ type?: 'error' | 'success' }>`
    padding: 10px;
    border-radius: var(--brLight);
    background: ${({ type }) => (type === 'success' ? 'var(--greenTransparent)' : 'var(--redMain)')};
    color: ${({ type }) => (type === 'success' ? 'var(--invert-text)' : '#fff')};
    font-weight: 600;
`

export const ManualTokenForm = styled.form`
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;

    input {
        min-height: 40px;
        padding: 0 12px;
        border: none;
        border-radius: var(--brLight);
        background: var(--theme-2);
        color: var(--text);
        outline: none;
    }

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
`

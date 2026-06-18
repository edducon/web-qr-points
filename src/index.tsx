import React from 'react'
import ReactDOM from 'react-dom'

import App from './app'
import GlobalStyles from './shared/global-styles'

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
    })
}

ReactDOM.render(
    <React.StrictMode>
        <GlobalStyles />
        <App />
    </React.StrictMode>,
    document.getElementById('root'),
)

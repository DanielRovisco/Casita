import { useEffect, useState } from 'react'

const INTERVALO = 5 * 60 * 1000

/** Mantém a data atual fresca, para o saldo virar sozinho à meia-noite. */
export function useAgora() {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const relogio = setInterval(() => setAgora(Date.now()), INTERVALO)
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') setAgora(Date.now())
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [])

  return agora
}

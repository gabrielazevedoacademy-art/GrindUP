'use client'

import { useEffect } from 'react'

const STYLE = `
  @keyframes _click_ripple {
    0%   { transform: translate(-50%,-50%) scale(0); opacity: .6; }
    100% { transform: translate(-50%,-50%) scale(1); opacity: 0; }
  }
  @keyframes _click_flash {
    0%   { transform: translate(-50%,-50%); opacity: .5; }
    100% { transform: translate(-50%,-50%); opacity: 0; }
  }
  ._click_ripple {
    position: fixed;
    pointer-events: none;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    background: radial-gradient(circle, rgba(124,58,237,.55) 0%, rgba(79,70,229,.25) 55%, rgba(2,2,8,0) 75%);
    animation: _click_ripple 600ms ease-out forwards;
    z-index: 9999;
  }
  ._click_flash {
    position: fixed;
    pointer-events: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    background: rgba(124,58,237,.45);
    animation: _click_flash 300ms ease-out forwards;
    z-index: 9999;
  }
`

export default function ClickEffect() {
  useEffect(() => {
    const lowMemory =
      typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number' &&
      ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4

    const styleEl = document.createElement('style')
    styleEl.textContent = STYLE
    document.head.appendChild(styleEl)

    const MAX = 5
    const pool: HTMLDivElement[] = Array.from({ length: MAX }, () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      return el
    })
    let idx = 0

    const onClick = (e: MouseEvent) => {
      if ((e.target as Element).closest('a,button,input,textarea,select,[role="button"]')) return
      const el = pool[idx++ % MAX]
      // Clear class to stop any running animation, force reflow, then restart
      el.className = ''
      el.style.left = `${e.clientX}px`
      el.style.top = `${e.clientY}px`
      void el.offsetWidth
      el.className = lowMemory ? '_click_flash' : '_click_ripple'
    }

    const onAnimEnd = (e: Event) => {
      (e.target as HTMLElement).className = ''
    }

    pool.forEach(el => el.addEventListener('animationend', onAnimEnd))
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      pool.forEach(el => {
        el.removeEventListener('animationend', onAnimEnd)
        el.remove()
      })
      styleEl.remove()
    }
  }, [])

  return null
}

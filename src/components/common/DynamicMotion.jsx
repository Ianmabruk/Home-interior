import React, { useState, useEffect } from 'react'

let framerPromise = null
let framerModule = null
let framerLoaded = false

const loadFramer = () => {
  if (!framerPromise) framerPromise = import('framer-motion')
  return framerPromise
}

export function preloadFramer() {
  if (framerLoaded) return Promise.resolve(framerModule)
  if (!framerPromise) {
    framerPromise = import('framer-motion')
    framerPromise.then(m => {
      framerModule = m
      framerLoaded = true
      try { window.dispatchEvent(new Event('framer-ready')) } catch (e) {}
    }).catch(() => {})
  }
  return framerPromise
}

const elementCache = new Map()

function createMotionElement(tag) {
  if (elementCache.has(tag)) return elementCache.get(tag)
  const MotionEl = ({ children, ...props }) => {
    const [fm, setFm] = useState(framerModule)

    useEffect(() => {
      if (framerModule) {
        setFm(framerModule)
        return
      }
      const onReady = () => setFm(framerModule)
      window.addEventListener('framer-ready', onReady)
      return () => window.removeEventListener('framer-ready', onReady)
    }, [])

    const Comp = fm && fm.motion && (fm.motion[tag] || fm.motion.div) ? (fm.motion[tag] || fm.motion.div) : tag
    return React.createElement(Comp, props, children)
  }
  MotionEl.displayName = `Motion.${tag}`
  elementCache.set(tag, MotionEl)
  return MotionEl
}

export const motion = new Proxy({}, {
  get(_, prop) {
    if (prop === 'default') return undefined
    return createMotionElement(prop)
  }
})

export const AnimatePresence = ({ children, ...props }) => {
  const [fm, setFm] = useState(framerModule)
  useEffect(() => {
    if (framerModule) return
    const onReady = () => setFm(framerModule)
    window.addEventListener('framer-ready', onReady)
    return () => window.removeEventListener('framer-ready', onReady)
  }, [])
  const Comp = fm && fm.AnimatePresence ? fm.AnimatePresence : React.Fragment
  return React.createElement(Comp, props, children)
}

export default { motion, AnimatePresence, preloadFramer }

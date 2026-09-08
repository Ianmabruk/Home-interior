import React, { useState, useEffect, useMemo } from 'react'

let framerPromise = null
const loadFramer = () => {
  if (!framerPromise) framerPromise = import('framer-motion')
  return framerPromise
}

const elementCache = new Map()

function createMotionElement(tag) {
  if (elementCache.has(tag)) return elementCache.get(tag)
  const MotionEl = ({ children, ...props }) => {
    const [fm, setFm] = useState(null)
    useEffect(() => {
      let mounted = true
      loadFramer().then((m) => {
        if (mounted) setFm(m)
      }).catch(() => {})
      return () => { mounted = false }
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
  const [fm, setFm] = useState(null)
  useEffect(() => {
    let mounted = true
    loadFramer().then(m => { if (mounted) setFm(m) }).catch(() => {})
    return () => { mounted = false }
  }, [])
  const Comp = fm && fm.AnimatePresence ? fm.AnimatePresence : React.Fragment
  return React.createElement(Comp, props, children)
}

export default { motion, AnimatePresence }

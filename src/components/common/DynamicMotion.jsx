import React, { useState, useEffect } from 'react'

let framerPromise = null
let framerModule = null
let framerLoaded = false

export function preloadFramer() {
  if (framerLoaded) return Promise.resolve(framerModule)
  if (!framerPromise) {
    framerPromise = import('framer-motion')
    framerPromise.then(m => {
      framerModule = m
      framerLoaded = true
      try { window.dispatchEvent(new Event('framer-ready')) } catch { /* ignore */ }
    }).catch(() => {})
  }
  return framerPromise
}

const elementCache = new Map()
const FRAMER_PROP_KEYS = new Set([
  'animate', 'initial', 'exit', 'transition', 'variants', 'whileHover', 'whileTap',
  'whileFocus', 'whileInView', 'onAnimationStart', 'onAnimationComplete', 'drag',
  'dragConstraints', 'dragElastic', 'dragMomentum', 'dragTransition', 'layout',
  'layoutId', 'layoutDependency', 'style', 'viewport', 'inView', 'inViewOnce',
  'custom', 'isOpen', 'mode', 'presenceAffectsLayout', 'onDrag', 'onDragStart',
  'onDragEnd', 'onViewportEnter', 'onViewportLeave'
])

function sanitizeMotionProps(props) {
  if (!props || typeof props !== 'object') return props
  const next = { ...props }
  for (const key of Object.keys(next)) {
    if (FRAMER_PROP_KEYS.has(key)) delete next[key]
  }
  return next
}

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
    const safeProps = Comp === tag ? sanitizeMotionProps(props) : props
    return React.createElement(Comp, safeProps, children)
  }
  MotionEl.displayName = `Motion.${tag}`
  elementCache.set(tag, MotionEl)
  return MotionEl
}

export const motion = new Proxy({}, {
  get(_, prop) {
    if (typeof prop === 'symbol' || prop === 'default') return undefined
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

// Minimal Reorder proxy: when framer-motion is loaded, use the real components.
// Otherwise fall back to simple non-drag wrappers so app still works.
const ReorderGroupFallback = ({ children, values: _values, onReorder: _onReorder, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

const ReorderItemFallback = ({ children }) => {
  return <div>{children}</div>
}

export const Reorder = new Proxy({}, {
  get(_, prop) {
    if (typeof prop === 'symbol' || prop === 'default') return undefined
    if (prop === 'Group') return (props) => {
      const fm = framerModule
      if (fm && fm.Reorder && fm.Reorder.Group) return React.createElement(fm.Reorder.Group, props)
      return React.createElement(ReorderGroupFallback, props)
    }
    if (prop === 'Item') return (props) => {
      const fm = framerModule
      if (fm && fm.Reorder && fm.Reorder.Item) return React.createElement(fm.Reorder.Item, props)
      return React.createElement(ReorderItemFallback, props)
    }
    return undefined
  }
})

export function useDragControls() {
  const fm = framerModule
  if (fm && fm.useDragControls) return fm.useDragControls()
  // fallback: return a dummy object with start noop
  return { start: () => {} }
}

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const handler = () => setReduced(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  if (framerModule && framerModule.useReducedMotion) {
    const fmReduced = framerModule.useReducedMotion()
    return fmReduced
  }
  return reduced
}

export default { motion, AnimatePresence, preloadFramer }

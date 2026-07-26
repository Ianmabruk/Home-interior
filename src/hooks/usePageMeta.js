import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const DEFAULT_TITLE = 'HOK INTERIOR DESIGNS'
const DEFAULT_DESCRIPTION = 'Timeless luxury interior design, curated furniture, and premium virtual design services.'

const SITE_URL = 'https://hokinteriors.com'

const pageMeta = {
  '/': {
    title: 'HOK INTERIOR DESIGNS — Timeless Interiors, Designed for a Life Well Lived',
    description: 'Luxury interior design, curated furniture, and premium virtual design services in Nairobi.',
  },
  '/portfolio': {
    title: 'Portfolio — HOK Interior Designs',
    description: 'Explore our curated portfolio of luxury interior design projects.',
  },
  '/shop': {
    title: 'Shop Collection — HOK Interior Designs',
    description: 'Discover timeless furniture and decor pieces curated for luxury living.',
  },
  '/about': {
    title: 'About Us — HOK Interior Designs',
    description: 'Learn about HOK Interior Designs — our story, philosophy, and design team.',
  },
  '/services': {
    title: 'Services — HOK Interior Designs',
    description: 'Comprehensive interior design services from concept to completion.',
  },
  '/virtual-design': {
    title: 'Virtual Design — HOK Interior Designs',
    description: 'Experience your dream space with immersive 3D virtual design services.',
  },
  '/contact': {
    title: 'Contact Us — HOK Interior Designs',
    description: 'Get in touch with HOK Interior Designs for your next project.',
  },
}

export function usePageMeta({ title, description, image, path }) {
  const location = useLocation()
  const currentPath = path || location.pathname
  const meta = pageMeta[currentPath] || {}
  const pageTitle = title || meta.title || DEFAULT_TITLE
  const pageDescription = description || meta.description || DEFAULT_DESCRIPTION

  useEffect(() => {
    document.title = pageTitle

    const setMeta = (name, content) => {
      let element = document.querySelector(`meta[name="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('name', name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    const setProperty = (property, content) => {
      let element = document.querySelector(`meta[property="${property}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute('property', property)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    setMeta('description', pageDescription)
    setMeta('robots', 'index,follow')
    setProperty('og:title', pageTitle)
    setProperty('og:description', pageDescription)
    setProperty('og:url', `${SITE_URL}${currentPath}`)
    setProperty('og:type', 'website')
    if (image) {
      setProperty('og:image', image)
      setProperty('twitter:image', image)
    }
    setMeta('twitter:title', pageTitle)
    setMeta('twitter:description', pageDescription)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [pageTitle, pageDescription, image, currentPath])
}

export function PageMeta({ title, description, image }) {
  usePageMeta({ title, description, image })
  return null
}

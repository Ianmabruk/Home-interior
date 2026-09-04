import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const DEFAULT_TITLE = 'HOK INTERIOR DESIGNS'
const DEFAULT_DESCRIPTION = 'Timeless luxury interior design, curated furniture, and premium e-design packages.'
const SITE_URL = 'https://hokinteriors.com'
const SITE_NAME = 'HOK Interiors'
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`

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
    title: 'E-Design Packages — HOK Interior Designs',
    description: 'Browse our eDesign packages: Mini Refresh, Signature, Whole Home, and more. Renter-friendly online interior design delivered in days.',
  },
  '/contact': {
    title: 'Contact Us — HOK Interior Designs',
    description: 'Get in touch with HOK Interior Designs for your next project.',
  },
  '/socials': {
    title: 'Socials — HOK Interior Designs',
    description: 'Follow HOK Interior Designs on social media.',
  },
}

export function usePageMeta({ title, description, image, path }) {
  const location = useLocation()
  const currentPath = path || location.pathname
  const meta = pageMeta[currentPath] || {}
  const pageTitle = title || meta.title || DEFAULT_TITLE
  const pageDescription = description || meta.description || DEFAULT_DESCRIPTION
  const pageImage = image || DEFAULT_OG_IMAGE

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

    const setLink = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`)
      if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', rel)
        document.head.appendChild(element)
      }
      element.setAttribute('href', href)
    }

    setMeta('description', pageDescription)
    setMeta('robots', 'index,follow')
    setLink('canonical', `${SITE_URL}${currentPath}`)
    setProperty('og:title', pageTitle)
    setProperty('og:description', pageDescription)
    setProperty('og:url', `${SITE_URL}${currentPath}`)
    setProperty('og:type', 'website')
    setProperty('og:site_name', SITE_NAME)
    setProperty('og:image', pageImage)
    setProperty('og:image:width', '1200')
    setProperty('og:image:height', '630')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', pageTitle)
    setMeta('twitter:description', pageDescription)
    setMeta('twitter:image', pageImage)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [pageTitle, pageDescription, pageImage, currentPath])
}

export function PageMeta({ title, description, image }) {
  usePageMeta({ title, description, image })
  return null
}
import { prisma } from '../config/database.js'

const CONTACT_KEYS = ['contact.phoneNumbers', 'contact.emails', 'contact.addresses', 'contact.businessHours']

function parseJson(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export const contactService = {
  getContact,
}

async function getContact() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: CONTACT_KEYS } },
    })

    const result = {}
    for (const s of settings) {
      result[s.key] = parseJson(s.value) || s.value
    }

    return {
      phoneNumbers: result['contact.phoneNumbers'] || ['+254 700 000 000', '+254 711 111 111'],
      emails: result['contact.emails'] || ['info@hokinteriors.com', 'projects@hokinteriors.com'],
      addresses: result['contact.addresses'] || ['Westlands, Nairobi, Kenya'],
      businessHours: result['contact.businessHours'] || 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed',
    }
  } catch {
    return {
      phoneNumbers: ['+254 700 000 000', '+254 711 111 111'],
      emails: ['info@hokinteriors.com', 'projects@hokinteriors.com'],
      addresses: ['Westlands, Nairobi, Kenya'],
      businessHours: 'Mon - Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 4:00 PM\nSun: Closed',
    }
  }
}
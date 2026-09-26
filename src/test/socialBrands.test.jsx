import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SocialBrandIcon } from '../components/common/SocialBrandIcon'
import {
  SOCIAL_BRANDS,
  getSocialBrand,
  getSocialBrandCssVars,
  getSocialPlatforms,
} from '../constants/socialBrands'

describe('social brand configuration', () => {
  it('exposes the official platform palette', () => {
    expect(SOCIAL_BRANDS.facebook.color).toBe('#1877F2')
    expect(SOCIAL_BRANDS.facebook.buttonColor).toBe('#1877F2')
    expect(SOCIAL_BRANDS.pinterest.color).toBe('#E60023')
    expect(SOCIAL_BRANDS.pinterest.iconColor).toBe('#FFFFFF')
    expect(SOCIAL_BRANDS.tiktok.cyan).toBe('#25F4EE')
    expect(SOCIAL_BRANDS.tiktok.red).toBe('#FE2C55')
    expect(SOCIAL_BRANDS.instagram.badgeBackground).toContain('#833AB4')
    expect(SOCIAL_BRANDS.instagram.badgeBackground).toContain('#FCAF45')
  })

  it('resolves button colours to platform styling', () => {
    expect(getSocialBrandCssVars('facebook')['--social-button-bg']).toBe('#1877F2')
    expect(getSocialBrandCssVars('facebook')['--social-button-hover']).toBe('#166FE5')
    expect(getSocialBrandCssVars('pinterest')['--social-button-bg']).toBe('#E60023')
    expect(getSocialBrandCssVars('pinterest')['--social-button-hover']).toBe('#BD001B')
    expect(getSocialBrandCssVars('tiktok')['--social-button-bg']).toBe('#000000')
    expect(getSocialBrandCssVars('tiktok')['--social-button-hover']).toBe('#181818')
    expect(getSocialBrandCssVars('instagram')['--social-button-bg']).toContain('linear-gradient')
  })

  it('falls back to a neutral brand for unknown platforms', () => {
    const brand = getSocialBrand('not-a-platform')
    expect(brand.key).toBe('custom')
    expect(getSocialBrandCssVars('not-a-platform')['--social-button-bg']).toBe('#666666')
  })

  it('lists every selectable platform with a label', () => {
    const platforms = getSocialPlatforms()
    expect(platforms.map((p) => p.key)).toEqual(
      expect.arrayContaining(['facebook', 'instagram', 'pinterest', 'tiktok'])
    )
    platforms.forEach((p) => expect(p.label).toBeTruthy())
  })
})

describe('SocialBrandIcon', () => {
  const platforms = ['facebook', 'instagram', 'pinterest', 'tiktok']

  it('renders the official mark on a coloured badge for each platform', () => {
    for (const platform of platforms) {
      const { container, unmount } = render(
        <SocialBrandIcon platform={platform} name={platform} size={64} />
      )
      const badge = container.firstChild
      expect(badge.getAttribute('data-platform')).toBe(platform)
      // TikTok layers the same official glyph in cyan/red/white.
      const expectedGlyphs = platform === 'tiktok' ? 3 : 1
      expect(container.querySelectorAll('svg')).toHaveLength(expectedGlyphs)
      // The glyph must come from the icon library, never a typed letter.
      expect(container.textContent).toBe('')
      unmount()
    }
  })

  it('applies the platform badge background and icon colour', () => {
    const { container } = render(<SocialBrandIcon platform="pinterest" name="Pinterest" />)
    const style = container.firstChild.style
    expect(style.getPropertyValue('--social-badge-bg')).toBe('#E60023')
    expect(style.getPropertyValue('--social-icon')).toBe('#FFFFFF')
    expect(container.firstChild.className).toContain('is-circle')
  })

  it('uses a rounded badge for TikTok and a circular badge for Pinterest', () => {
    const tiktok = render(<SocialBrandIcon platform="tiktok" name="TikTok" />)
    expect(tiktok.container.firstChild.className).toContain('is-rounded')
    tiktok.unmount()

    const pinterest = render(<SocialBrandIcon platform="pinterest" name="Pinterest" />)
    expect(pinterest.container.firstChild.className).toContain('is-circle')
  })

  it('labels the icon for assistive technology', () => {
    const { getByRole } = render(<SocialBrandIcon platform="instagram" name="Instagram" />)
    expect(getByRole('img', { name: 'Instagram logo' })).toBeTruthy()
  })

  it('hides decorative icons from assistive technology', () => {
    const { container } = render(<SocialBrandIcon platform="facebook" decorative />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})

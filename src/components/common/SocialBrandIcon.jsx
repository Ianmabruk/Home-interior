import { getSocialBrand, getSocialBrandCssVars } from '@constants/socialBrands'

const ICON_RATIO = 0.5
const CHROMATIC_RATIO = 0.11

export const SocialBrandIcon = ({
  platform,
  name,
  size = 64,
  responsive = false,
  decorative = false,
  className = '',
}) => {
  const brand = getSocialBrand(platform)
  const { Icon } = brand
  const iconSize = Math.round(size * ICON_RATIO)
  const offset = Math.max(1, Math.round(iconSize * CHROMATIC_RATIO))
  const label = name || brand.label

  const iconProps = decorative
    ? { 'aria-hidden': 'true', focusable: 'false' }
    : { role: 'img', 'aria-label': `${label} logo` }

  // Responsive badges take their dimensions from the stylesheet so the mobile
  // step can shrink them; fixed badges pin the exact size inline.
  const sizeVars = responsive
    ? null
    : { '--social-badge-size': `${size}px`, '--social-icon-size': `${iconSize}px` }

  const glyphSize = responsive ? undefined : { width: iconSize, height: iconSize }

  return (
    <span
      className={`social-brand-icon ${brand.badgeShape === 'rounded' ? 'is-rounded' : 'is-circle'} ${
        responsive ? 'is-responsive' : ''
      } ${className}`}
      style={{
        ...getSocialBrandCssVars(platform),
        ...sizeVars,
        ...(brand.chromatic ? { '--social-chromatic-offset': `${offset}px` } : null),
      }}
      data-platform={brand.key}
    >
      {brand.chromatic ? (
        <>
          <Icon className="social-brand-glyph is-cyan" style={glyphSize} {...iconProps} />
          <Icon className="social-brand-glyph is-red" style={glyphSize} {...iconProps} />
          <Icon className="social-brand-glyph is-white" style={glyphSize} {...iconProps} />
        </>
      ) : (
        <Icon className="social-brand-glyph" style={glyphSize} {...iconProps} />
      )}
    </span>
  )
}

export default SocialBrandIcon

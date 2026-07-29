import { memo } from 'react'
import { useScrollReveal } from '../../utils/scrollReveal'

const BrandingBanner = memo(() => {
  const [ref, isVisible] = useScrollReveal({ once: true, threshold: 0.1, rootMargin: '0px' })

  return (
    <div
      ref={ref}
      className="relative bg-[#000000] w-full z-10 -mt-8 sm:-mt-10 lg:-mt-12 -mb-6 sm:-mb-8 lg:-mb-10 flex items-center justify-center"
      style={{
        height: '140px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}
    >
      <div className="text-center px-6">
        <h2 className="font-display text-4xl sm:text-[2.75rem] md:text-5xl lg:text-6xl font-normal tracking-[0.15em] uppercase leading-none">
          <span className="text-[#B76E32]">HOK</span>
          <span className="text-[#F5F2EC] ml-2 sm:ml-3 md:ml-4">INTERIORS</span>
        </h2>
        <p className="text-[#F5F2EC] font-display text-sm sm:text-base md:text-lg tracking-[0.25em] uppercase font-normal mt-6 sm:mt-8">
          DESIGN. BUILD. STYLE.
        </p>
      </div>
    </div>
  )
})

BrandingBanner.displayName = 'BrandingBanner'

export { BrandingBanner }
export default BrandingBanner

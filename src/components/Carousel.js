import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import ArrowButton from './ArrowButton'
import smoothscroll from 'smoothscroll-polyfill'
import useResize from '../hooks/resizeHook'
const css = require('styled-components').css

smoothscroll.polyfill()

const Container = styled.div`
  position: relative;
`

const RailWrapper = styled.div`
  overflow: hidden;
  margin: ${({ showDots }) => (showDots ? '0 20px 15px 20px' : '0 20px')};

  ${({ mobileBreakpoint }) => css`
    @media screen and (max-width: ${mobileBreakpoint}px) {
      overflow-x: auto;
      margin: 0;
      scroll-snap-type: ${({ scrollSnap }) =>
        scrollSnap ? 'x mandatory' : ''};
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  `}
`

const Rail = styled.div`
  display: grid;
  grid-column-gap: 10px;
  position: relative;
  transition: left 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0s;
  grid-template-columns: ${({ page }) => `repeat(${page}, 100%)`};
  left: ${({ currentPage }) =>
    `calc(${-100 * currentPage}% - ${10 * currentPage}px)`};

  ${({ mobileBreakpoint }) => css`
    @media screen and (max-width: ${mobileBreakpoint}px) {
      padding-left: ${({ gap }) => `${gap}px`};
      grid-template-columns: ${({ page }) => `repeat(${page}, 90%)`};
      grid-column-gap: ${({ cols, rows, gap }) =>
        `calc(${(cols * rows - 1) * 90}% + ${cols * rows * gap}px)`};
      left: 0;
    }
  `}
`

const ItemSet = styled.div`
  display: grid;
  grid-template-columns: ${({ cols }) => `repeat(${cols}, 1fr)`};
  grid-template-rows: ${({ rows }) => `repeat(${rows}, 1fr)`};
  grid-gap: ${({ gap }) => `${gap}px`};

  ${({ mobileBreakpoint }) => css`
    @media screen and (max-width: ${mobileBreakpoint}px) {
      grid-template-columns: ${({ cols, rows }) =>
        `repeat(${cols * rows}, 100%)`};
      grid-template-rows: 1fr;

      &:last-of-type > ${Item}:last-of-type {
        padding-right: ${({ gap }) => `${gap}px`};
        margin-right: ${({ gap }) => `-${gap}px`};
      }
    }
  `}
`

const DotContainer = styled.div`
  position: absolute;
  bottom: -12px;
  height: 10px;
  width: 100%;
  line-height: 10px;
  text-align: center;

  ${({ mobileBreakpoint }) => css`
    @media screen and (max-width: ${mobileBreakpoint}px) {
      display: none;
    }
  `}
`

const Dot = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 5px;
  cursor: pointer;
  background: ${({ color }) => color};
`

const Item = styled.div`
  scroll-snap-align: ${({ scrollSnap }) => (scrollSnap ? 'center' : '')};
`

const CAROUSEL_ITEM = 'CAROUSEL_ITEM'
const Carousel = ({
  cols: colsProp = 1,
  rows: rowsProp = 1,
  gap: gapProp = 10,
  loop: loopProp = false,
  scrollSnap = true,
  hideArrow = false,
  showDots = false,
  autoplay: autoplayProp,
  dotColorActive = '#795548',
  dotColorInactive = '#ccc',
  responsiveLayout,
  mobileBreakpoint = 767,
  arrowLeft,
  arrowRight,
  containerClassName = '',
  containerStyle = {},
  children
}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [isHover, setIsHover] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const [cols, setCols] = useState(colsProp)
  const [rows, setRows] = useState(rowsProp)
  const [gap, setGap] = useState(gapProp)
  const [loop, setLoop] = useState(loopProp)
  const [autoplay, setAutoplay] = useState(autoplayProp)
  const railWrapperRef = useRef(null)
  const autoplayIntervalRef = useRef(null)
  const breakpointSetting = useResize(responsiveLayout)

  useEffect(() => {
    setCols(colsProp)
  }, [colsProp])

  useEffect(() => {
    setRows(rowsProp)
  }, [rowsProp])

  useEffect(() => {
    setGap(gapProp)
  }, [gapProp])

  useEffect(() => {
    setAutoplay(autoplayProp)
  }, [autoplayProp])

  useEffect(() => {
    setLoop(loopProp)
  }, [loopProp])

  useEffect(() => {
    if (breakpointSetting) {
      setCols(breakpointSetting.cols || colsProp)
      setRows(breakpointSetting.rows || rowsProp)
      setGap(breakpointSetting.gap || gapProp)
      setLoop(breakpointSetting.loop || loopProp)
      setAutoplay(breakpointSetting.autoplay || autoplayProp)
    } else {
      setCols(colsProp)
      setRows(rowsProp)
      setGap(gapProp)
      setLoop(loopProp)
      setAutoplay(autoplayProp)
    }

    setCurrentPage(0)
  }, [breakpointSetting, colsProp, rowsProp, gapProp, loopProp, autoplayProp])

  const itemList = useMemo(
    () =>
      React.Children.toArray(children).filter(
        child => child.type.displayName === CAROUSEL_ITEM
      ),
    [children]
  )

  const itemAmountPerSet = cols * rows
  const itemSetList = useMemo(
    () =>
      itemList.reduce((result, item, i) => {
        const itemComponent = (
          <Item key={i} scrollSnap={scrollSnap}>
            {item}
          </Item>
        )

        if (i % itemAmountPerSet === 0) {
          result.push([itemComponent])
        } else {
          result[result.length - 1].push(itemComponent)
        }

        return result
      }, []),
    [itemList, itemAmountPerSet, scrollSnap]
  )

  const page = Math.ceil(itemList.length / itemAmountPerSet)

  const startAutoplayInterval = useCallback(() => {
    if (autoplayIntervalRef.current === null && typeof autoplay === 'number') {
      autoplayIntervalRef.current = setInterval(() => {
        handleNext(window.innerWidth <= mobileBreakpoint)
      }, autoplay)
    }
  }, [autoplay, autoplayIntervalRef, handleNext])

  useEffect(() => {
    startAutoplayInterval()

    return () => {
      if (autoplayIntervalRef.current !== null) {
        clearInterval(autoplayIntervalRef.current)
      }
    }
  }, [startAutoplayInterval, autoplayIntervalRef])

  useEffect(() => {
    if (isHover || isTouch) {
      clearInterval(autoplayIntervalRef.current)
      autoplayIntervalRef.current = null
    } else {
      startAutoplayInterval()
    }
  }, [isHover, isTouch, autoplayIntervalRef, startAutoplayInterval])

  const handlePrev = useCallback(() => {
    setCurrentPage(p => {
      const prevPage = p - 1
      if (loop && prevPage < 0) {
        return page - 1
      }

      return prevPage
    })
  }, [loop, page])

  const handleNext = useCallback(
    (isMobile = false) => {
      const railWrapper = railWrapperRef.current
      if (isMobile && railWrapper) {
        if (!scrollSnap) {
          return
        }

        const { scrollLeft, offsetWidth, scrollWidth } = railWrapper
        railWrapper.scrollBy({
          top: 0,
          left:
            loop && scrollLeft + offsetWidth >= scrollWidth
              ? -scrollLeft
              : scrollLeft === 0
              ? (offsetWidth - gap) * 0.9
              : (offsetWidth - gap) * 0.9 + gap,
          behavior: 'smooth'
        })
      } else {
        setCurrentPage(p => {
          const nextPage = p + 1
          if (nextPage >= page) {
            return loop ? 0 : p
          }

          return nextPage
        })
      }
    },
    [loop, page, gap, railWrapperRef.current, scrollSnap]
  )

  const handlePage = useCallback(e => {
    setCurrentPage(+e.target.getAttribute('data-index'))
  }, [])

  const handleHover = useCallback(() => {
    setIsHover(hover => !hover)
  }, [])

  const handleTouch = useCallback(() => {
    setIsTouch(touch => !touch)
  }, [])

  return (
    <Container
      onMouseEnter={handleHover}
      onMouseLeave={handleHover}
      onTouchStart={handleTouch}
      onTouchEnd={handleTouch}
      className={containerClassName}
      style={containerStyle}
    >
      <ArrowButton
        type="prev"
        mobileBreakpoint={mobileBreakpoint}
        hidden={hideArrow || (!loop && currentPage <= 0)}
        CustomBtn={arrowLeft}
        onClick={handlePrev}
      />
      <RailWrapper
        mobileBreakpoint={mobileBreakpoint}
        scrollSnap={scrollSnap}
        showDots={showDots}
        ref={railWrapperRef}
      >
        <Rail
          cols={cols}
          rows={rows}
          page={page}
          gap={gap}
          currentPage={currentPage}
          mobileBreakpoint={mobileBreakpoint}
        >
          {itemSetList.map((set, i) => (
            <ItemSet
              key={i}
              cols={cols}
              rows={rows}
              gap={gap}
              mobileBreakpoint={mobileBreakpoint}
            >
              {set}
            </ItemSet>
          ))}
        </Rail>
      </RailWrapper>
      {showDots && (
        <DotContainer mobileBreakpoint={mobileBreakpoint}>
          {[...Array(page)].map((_, i) => (
            <Dot
              key={i}
              data-index={i}
              onClick={handlePage}
              color={i === currentPage ? dotColorActive : dotColorInactive}
            />
          ))}
        </DotContainer>
      )}
      <ArrowButton
        type="next"
        mobileBreakpoint={mobileBreakpoint}
        hidden={hideArrow || (!loop && currentPage === page - 1)}
        CustomBtn={arrowRight}
        onClick={handleNext.bind(null, false)}
      />
    </Container>
  )
}

const numberValidator = (props, propName, componentName, type) => {
  PropTypes.checkPropTypes(
    {
      [propName]: PropTypes.number
    },
    props,
    propName,
    componentName
  )

  if (props[propName] <= 0) {
    if (
      type === 'positive' ||
      (props[propName] < 0 && type === 'non-negative')
    ) {
      return new Error(
        `Invalid prop \`${propName}\` supplied to \`${componentName}\`. expected ${type} \`number\``
      )
    }
  }
}

Carousel.propTypes = {
  cols: (...args) => {
    args.splice(3, 0, 'positive')
    return numberValidator(...args)
  },
  rows: (...args) => {
    args.splice(3, 0, 'positive')
    return numberValidator(...args)
  },
  gap: (...args) => {
    args.splice(3, 0, 'non-negative')
    return numberValidator(...args)
  },
  loop: PropTypes.bool,
  scrollSnap: PropTypes.bool,
  hideArrow: PropTypes.bool,
  showDots: PropTypes.bool,
  autoplay: PropTypes.number,
  dotColorActive: PropTypes.string,
  dotColorInactive: PropTypes.string,
  responsiveLayout: PropTypes.arrayOf(
    PropTypes.shape({
      breakpoint: PropTypes.number.isRequired,
      cols: PropTypes.number,
      rows: PropTypes.number,
      gap: PropTypes.number,
      loop: PropTypes.bool,
      autoplay: PropTypes.number
    })
  ),
  mobileBreakpoint: PropTypes.number,
  arrowLeft: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.elementType
  ]),
  arrowRight: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.element,
    PropTypes.elementType
  ]),
  containerClassName: PropTypes.string,
  containerStyle: PropTypes.object
}

Carousel.Item = ({ children }) => children
Carousel.Item.displayName = CAROUSEL_ITEM
export default Carousel

import React, { FC, useEffect, useRef } from 'react'

export type LegacyType = { modelPath: string; width: number; height: number }

const Legacy: FC<LegacyType> = ({ modelPath, height, width }) => {
  const prevSizeRef = useRef({ width, height })
  const isFirstMount = useRef(true)

  useEffect(() => {
    ;(window as any).loadlive2d('live2d', modelPath)
  }, [modelPath])

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // Only reload if size actually changed (not on StrictMode double-mount)
    if (
      prevSizeRef.current.width !== width ||
      prevSizeRef.current.height !== height
    ) {
      prevSizeRef.current = { width, height }
      window.location.reload()
    }
  }, [height, width])

  return (
    <canvas
      id={'live2d'}
      className="live2d"
      width={width}
      height={height}
    ></canvas>
  )
}

export default React.memo(Legacy)

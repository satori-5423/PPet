import React, { FC, useEffect, useRef } from 'react'

export type CurrentType = {
  modelPath: string
  width: number
  height: number
}

const parseModelPath = (p: string) => {
  // Handle http://127.0.0.1:19999/ prefix for local models
  // and regular http/https URLs for online models
  let protocol = ''
  let cleanPath = p
  if (p.startsWith('http://') || p.startsWith('https://')) {
    const url = new URL(p)
    cleanPath = url.pathname.slice(1) // remove leading /
    protocol = url.origin + '/'
  }

  const paths = cleanPath.split('/')
  paths.pop() // remove model json filename

  const modelName = paths.pop()
  const basePath = protocol + paths.join('/') + '/'

  return {
    basePath,
    modelName,
  }
}

const Current: FC<CurrentType> = ({ modelPath, width, height }) => {
  const live2dRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { basePath, modelName } = parseModelPath(modelPath)
    new (window as any).l2dViewer({
      el: live2dRef.current,
      basePath,
      modelName,
      width,
      height,
      autoMotion: true,
    })
  }, [modelPath, width, height])

  return <div className="live2d" ref={live2dRef} key={+new Date()}></div>
}

export default React.memo(Current)

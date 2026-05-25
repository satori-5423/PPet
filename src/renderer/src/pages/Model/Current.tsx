import React, { FC, useEffect, useRef } from 'react'

export type CurrentType = {
  modelPath: string
  width: number
  height: number
}

const parseModelPath = (p: string) => {
  // Handle ppet:/// and file:/// prefixes
  let protocol = ''
  let cleanPath = p
  if (p.startsWith('ppet:///')) {
    protocol = 'ppet:///'
    cleanPath = p.slice(9) // len of 'ppet:///'
  } else if (p.startsWith('file:///')) {
    protocol = 'file:///'
    cleanPath = p.slice(8) // len of 'file:///'
  } else if (p.startsWith('http://') || p.startsWith('https://')) {
    protocol = p.startsWith('https://') ? 'https://' : 'http://'
    cleanPath = p.slice(protocol.length)
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

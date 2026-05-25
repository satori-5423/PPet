import React, { FC, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Dispatch, RootState } from '../../store'
import { TipsType } from './Tips'

const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 200px;
  color: #aaa;
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  transition: opacity 0.3s;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px 0 0 8px;
  overflow-y: auto;
  padding: 8px;
  z-index: 10;

  &:hover {
    opacity: 1;
  }
`

const ModelItem = styled.div<{ active: boolean }>`
  color: ${(p) => (p.active ? '#fa0' : '#ccc')};
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fa0;
  }
`

const Toolbar: FC<{
  onShowMessage: (tips: TipsType) => void
}> = ({ onShowMessage }) => {
  const dispatch = useDispatch<Dispatch>()
  const { modelPath, modelList, resizable } = useSelector(
    (state: RootState) => ({
      ...state.config,
      ...state.win,
    }),
  )

  const showMessage = (text: string, timeout: number, priority: number) => {
    onShowMessage({ text, priority, timeout })
  }

  const showHitokoto = () => {
    fetch('https://v1.hitokoto.cn')
      .then((response) => response.json())
      .then((result) => {
        showMessage(result.hitokoto, 6000, 10)
        const text = `这句一言来自 <span>「${result.from}」</span>，是 <span>${result.creator}</span> 在 hitokoto.cn 投稿的。`
        window.setTimeout(() => {
          showMessage(text, 6000, 10)
        }, 6000)
      })
  }

  const getModelName = (path: string) => {
    // Extract readable name from model path
    const parts = path.replace(/^.*:\/+/, '').split('/')
    // Get second-to-last meaningful part (before model.json)
    const namePart = parts[parts.length - 2] || path
    return namePart.replace(/\.model\d?\.json$/, '').replace(/^22\./, '')
  }

  return (
    <Wrapper>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#888' }}>
          {modelList.length} models
        </span>
      </div>
      {modelList.map((path) => {
        const name = getModelName(path)
        const active = path === modelPath
        return (
          <ModelItem
            key={path}
            active={active}
            onClick={() => dispatch.config.setModelPath(path)}
            title={path}
          >
            {name}
          </ModelItem>
        )
      })}
    </Wrapper>
  )
}

export default Toolbar

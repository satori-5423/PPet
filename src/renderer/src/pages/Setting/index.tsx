import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Checkbox, Input } from 'antd'

import { Dispatch, RootState } from '../../store'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 10px;
`

const DirRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
`

const TextAreaWrapStyled = styled.div`
  margin-bottom: 10px;
  & > textarea {
    white-space: nowrap;
  }
`

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Setting = () => {
  const dispatch = useDispatch<Dispatch>()
  const { modelList, useGhProxy } = useSelector(
    (state: RootState) => state.config,
  )

  const [value, setValue] = useState(() => modelList.join('\n'))
  const [dirPath, setDirPath] = useState('')
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')

  const handleClickConfirmBtn = () => {
    const models = value.split('\n').filter(Boolean)
    if (models.length === 0) return
    dispatch.config.setModelList(models)
    dispatch.config.setModelPath(models[0])
    setStatus(`已加载 ${models.length} 个模型`)
  }

  const handleScanDir = async () => {
    if (!dirPath.trim()) {
      setStatus('请输入路径')
      return
    }
    setScanning(true)
    setStatus('扫描中...')
    try {
      const models = await window.bridge.scanDirectory(dirPath.trim())
      if (models.length === 0) {
        setStatus('未发现模型文件')
      } else {
        const existing = new Set(value.split('\n').filter(Boolean))
        models.forEach((m) => existing.add(m))
        setValue(Array.from(existing).join('\n'))
        setStatus(`扫描到 ${models.length} 个模型`)
      }
    } catch (err) {
      setStatus('扫描失败: ' + (err as Error).message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <Wrapper>
      <DirRow>
        <Input
          placeholder="模型目录路径"
          value={dirPath}
          onChange={(ev) => setDirPath(ev.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleScanDir} loading={scanning}>
          扫描目录
        </Button>
      </DirRow>

      模型列表（{value.split('\n').filter(Boolean).length} 个）：
      <TextAreaWrapStyled>
        <Input.TextArea
          rows={20}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
        />
      </TextAreaWrapStyled>

      <BottomRow>
        <span style={{ color: '#52c41a' }}>{status}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Checkbox
            checked={useGhProxy}
            onChange={(ev) => dispatch.config.setUseGhProxy(ev.target.checked)}
          >
            ghproxy 加速
          </Checkbox>
          <Button type="primary" onClick={handleClickConfirmBtn}>
            确定
          </Button>
        </div>
      </BottomRow>
    </Wrapper>
  )
}

export default Setting

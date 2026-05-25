import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Checkbox, Input, message } from 'antd'

import { Dispatch, RootState } from '../../store'
import styled from 'styled-components'

const Wrapper = styled.div`
  padding: 10px;

  & > div {
    display: flex;
    padding: 0 10px;
  }
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
const ButtonStyled = styled(Button)`
  padding: 0 40px !important;
  margin-left: auto;
`

const Setting = () => {
  const dispatch = useDispatch<Dispatch>()
  const { modelList, useGhProxy } = useSelector(
    (state: RootState) => state.config,
  )

  const [value, setValue] = useState(() => modelList.join('\n'))
  const [dirPath, setDirPath] = useState('')
  const [scanning, setScanning] = useState(false)

  const handleClickConfirmBtn = () => {
    const models = value.split('\n').filter(Boolean)
    dispatch.config.setModelList(models)
    dispatch.config.setModelPath(models[0])
    message.success(`已加载 ${models.length} 个模型`)
  }

  const handleScanDir = async () => {
    if (!dirPath.trim()) {
      message.warning('请输入模型目录路径')
      return
    }
    setScanning(true)
    try {
      const models = await window.bridge.scanDirectory(dirPath.trim())
      if (models.length === 0) {
        message.warning('未发现模型文件（model.json / .model3.json）')
      } else {
        // Merge with existing models, deduplicate
        const existing = new Set(value.split('\n').filter(Boolean))
        models.forEach((m) => existing.add(m))
        setValue(Array.from(existing).join('\n'))
        message.success(`扫描到 ${models.length} 个模型`)
      }
    } catch (err) {
      message.error('扫描失败: ' + (err as Error).message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <Wrapper>
      <DirRow>
        <Input
          placeholder="模型目录路径，例如 /home/satori/GitHub/live2d-model-assets/assets"
          value={dirPath}
          onChange={(ev) => setDirPath(ev.target.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={handleScanDir} loading={scanning}>
          扫描目录
        </Button>
      </DirRow>

      模型列表：
      <TextAreaWrapStyled>
        <Input.TextArea
          rows={20}
          value={value}
          onChange={(ev) => {
            setValue(ev.target.value)
          }}
        />
      </TextAreaWrapStyled>
      <div>
        <Checkbox
          checked={useGhProxy}
          onChange={(ev) => {
            dispatch.config.setUseGhProxy(ev.target.checked)
          }}
        >
          使用
          <a href="https://ghproxy.com" target="_blank">
            ghproxy
          </a>
          加速
        </Checkbox>
        <ButtonStyled type="primary" onClick={handleClickConfirmBtn}>
          确定
        </ButtonStyled>
      </div>
    </Wrapper>
  )
}

export default Setting

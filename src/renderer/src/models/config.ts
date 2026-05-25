import { createModel } from '@rematch/core'
import { RootModel } from './'

import initModelList from './models.json'

export const config = createModel<RootModel>()({
  state: {
    modelPath: initModelList[0],
    modelList: initModelList,
    useGhProxy: false,
  } as { modelPath: string; modelList: string[]; useGhProxy: boolean },
  reducers: {
    setModelList(state, modelList: string[]) {
      return { ...state, modelList }
    },
    setModelPath(state, modelPath: string) {
      return { ...state, modelPath }
    },
    setUseGhProxy(state, enable: boolean) {
      return { ...state, useGhProxy: enable }
    },
    nextModel(state) {
      const { modelList, modelPath } = state
      let idx = modelList.findIndex((f) => modelPath === f)
      if (idx > -1) {
        if (++idx >= modelList.length) {
          idx = 0
        }
        return { ...state, modelPath: modelList[idx] }
      }
      return state
    },
    prevModel(state) {
      const { modelList, modelPath } = state
      let idx = modelList.findIndex((f) => modelPath === f)
      if (idx > -1) {
        if (--idx < 0) {
          idx = modelList.length - 1
        }
        return { ...state, modelPath: modelList[idx] }
      }
      return state
    },
  },
  effects: () => ({
    async incrementAsync() {
      // placeholder
    },
  }),
})

import { init, RematchDispatch, RematchRootState } from '@rematch/core'
import persistPlugin from '@rematch/persist'
import { PersistConfig, getStoredState } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import { models, RootModel } from './models'
import initModelList from './models/models.json'

const persistConfig: PersistConfig<
  RematchRootState<RootModel, Record<string, never>>,
  any,
  any,
  any
> = {
  key: 'root',
  version: 2,
  storage,
  whitelist: ['config'],
  migrate: (state: any) => {
    // If model list contains stale file:// or ppet:// URLs, reset to defaults
    if (state?.config?.modelList?.length > 0) {
      const firstModel = state.config.modelList[0]
      if (
        firstModel.startsWith('file://') ||
        firstModel.startsWith('ppet://')
      ) {
        return {
          ...state,
          config: {
            ...state.config,
            modelList: initModelList,
            modelPath: initModelList[0],
          },
        }
      }
    }
    return state
  },
}

const store = init({
  models,
  plugins: [
    persistPlugin<RematchRootState<RootModel>, RootModel>(persistConfig),
  ],
})

export default store

export type Store = typeof store
export type Dispatch = RematchDispatch<RootModel>
export type RootState = RematchRootState<RootModel>

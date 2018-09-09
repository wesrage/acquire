import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { devToolsEnhancer } from 'redux-devtools-extension'
import rules from './logic/rules'
import { getInitialState } from './logic/setup'
import reducers from './logic/reducer'
import './index.html'
import Acquire from './components/Acquire'

const store = createStore(reducers, getInitialState(rules), devToolsEnhancer())

render(
   <Provider store={store}>
      <Acquire rules={rules} />
   </Provider>,
   document.getElementById('root')
)

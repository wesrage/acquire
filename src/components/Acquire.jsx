import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'emotion'
import styled from 'react-emotion'
import { initialState } from '../logic/setup'
import Board from './Board'

injectGlobal`
   * {
      box-sizing: border-box;
   }
   body {
      margin: 0;
   }
`

const GameRoot = styled.div`
   align-items: center;
   background-color: #222;
   display: flex;
   height: 100vh;
   font-family: Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif;
   justify-content: center;
   padding: 1em;
   width: 100vw;
`

class Acquire extends React.Component {
   state = initialState

   render() {
      return (
         <GameRoot>
            <Board tiles={this.state.tiles} />
         </GameRoot>
      )
   }
}

export default hot(module)(Acquire)

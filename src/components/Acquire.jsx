import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'emotion'
import styled from 'react-emotion'
import { getInitialState } from '../logic/setup'
import rules from '../logic/rules'
import createActions from '../logic/actions'
import Board from './Board'
import TileRack from './TileRack'

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
   state = getInitialState(rules)

   componentDidMount() {
      const actions = createActions(rules)
      this.setState(actions.startGame)
   }

   render() {
      return (
         <GameRoot>
            <Board tiles={this.state.tiles} rowCount={rules.ROW_COUNT} />
            <TileRack tiles={this.state.players[0].tiles} />
         </GameRoot>
      )
   }
}

export default hot(module)(Acquire)

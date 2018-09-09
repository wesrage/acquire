import React from 'react'
import { hot } from 'react-hot-loader'
import { injectGlobal } from 'emotion'
import styled from 'react-emotion'
import { compose, bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as actionCreators from '../logic/reducer'
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
   componentDidMount() {
      this.props.actions.startGame()
   }

   render() {
      return (
         <GameRoot>
            <Board
               tiles={this.props.tiles}
               rowCount={this.props.rules.ROW_COUNT}
            />
            <TileRack tiles={this.props.players[0].tiles} />
         </GameRoot>
      )
   }
}

export default compose(
   hot(module),
   connect(
      state => state,
      dispatch => ({
         actions: bindActionCreators(actionCreators, dispatch),
      }),
   )
)(Acquire)

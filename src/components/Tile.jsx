import React from 'react'
import PropTypes from 'prop-types'
import styled from 'react-emotion'
import { rowToLetter } from '../logic/util'

const TILE_SIZE = 60

const TileRoot = styled.div`
   background-color: ${props => (props.placed ? '#888' : '#000')};
   border-color: #222;
   border-style: solid;
   border-width: 1px;
   color: #eee;
   margin: -1px 0 0 -1px;
   display: flex;
   justify-content: center;
   align-items: center;
   font-size: ${TILE_SIZE / 3}px;
   height: ${TILE_SIZE}px;
   width: ${TILE_SIZE}px;
`

const RowIndicator = styled.span`
   font-size: 0.8em;
`

export default class Tile extends React.Component {
   static propTypes = {
      row: PropTypes.number.isRequired,
      col: PropTypes.number.isRequired,
   }

   render() {
      return (
         <TileRoot
            className={this.props.className}
            placed={this.props.placer !== undefined}
         >
            <span>
               {this.props.col + 1}
               <RowIndicator>{rowToLetter(this.props.row)}</RowIndicator>
            </span>
         </TileRoot>
      )
   }
}

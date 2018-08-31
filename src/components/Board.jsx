import React from 'react'
import PropTypes from 'prop-types'
import styled from 'react-emotion'
import Tile from './Tile'
import { getTileName } from '../logic/util'

const TileRow = styled.div`
   display: flex;
`

export default class Board extends React.Component {
   static propTypes = {
      tiles: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
   }

   render() {
      return (
         <div>
            {this.props.tiles.map((row, rowIndex) => (
               <TileRow key={rowIndex}>
                  {row.map((tile, colIndex) => (
                     <Tile
                        key={getTileName(rowIndex, colIndex)}
                        row={rowIndex}
                        col={colIndex}
                        owner={tile}
                     />
                  ))}
               </TileRow>
            ))}
         </div>
      )
   }
}

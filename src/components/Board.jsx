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
      rowCount: PropTypes.number.isRequired,
      tiles: PropTypes.arrayOf(
         PropTypes.shape({
            dead: PropTypes.bool,
            chain: PropTypes.number,
            holder: PropTypes.number,
            placer: PropTypes.number,
         })
      ).isRequired,
   }

   render() {
      const colCount = this.props.tiles.length / this.props.rowCount
      return (
         <div>
            {Array(this.props.rowCount)
               .fill()
               .map((_, rowIndex) => (
                  <TileRow key={rowIndex}>
                     {this.props.tiles
                        .slice(
                           rowIndex * colCount,
                           rowIndex * colCount + colCount
                        )
                        .map((tile, colIndex) => (
                           <Tile
                              key={getTileName(rowIndex, colIndex)}
                              row={rowIndex}
                              col={colIndex}
                              {...(tile || {})}
                           />
                        ))}
                  </TileRow>
               ))}
         </div>
      )
   }
}

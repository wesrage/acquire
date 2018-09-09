import React from 'react'
import PropTypes from 'prop-types'
import styled from 'react-emotion'
import Tile from './Tile'

const TileRackRoot = styled.div`
   display: flex;
`

const TileRackTile = styled(Tile)``

export default class TileRack extends React.Component {
   static propTypes = {
      tiles: PropTypes.arrayOf(PropTypes.number),
      colCount: PropTypes.number.isRequired,
   }

   static defaultProps = {
      // TODO: For testing only
      tiles: [8, 21, 33, 38, 59, 97],
   }

   render() {
      return (
         <TileRackRoot>
            {this.props.tiles.map((tile, index) => {
               const tileRow = Math.floor(tile / this.props.colCount)
               const tileCol = tile % this.props.colCount
               return <TileRackTile key={tile} row={tileRow} col={tileCol} />
            })}
         </TileRackRoot>
      )
   }
}

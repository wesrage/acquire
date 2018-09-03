export function getTileName(row, col) {
   return `${col + 1}${rowToLetter(row)}`
}

export function rowToLetter(row) {
   return String.fromCharCode(65 + row)
}

export function findChainsInBlock(blockTiles) {
   return blockTiles.reduce(
      (result, tile) =>
         tile.chain === undefined
            ? result
            : {
                 ...result,
                 [tile.chain]: (result[tile.chain] || 0) + 1,
              },
      {}
   )
}

export function determineBonusShareholders(stocks) {
   const majorityShareholderStockCount = Math.max(...stocks)
   if (majorityShareholderStockCount === 0) {
      return {
         majority: [],
         minority: [],
      }
   }
   const majorityShareholders = stocks
      .map((count, playerId) => ({ count, playerId }))
      .filter(({ count }) => count === majorityShareholderStockCount)
      .map(({ playerId }) => playerId)
   const minorityShareholderStockCount = Math.max(
      ...stocks.filter(quantity => quantity < majorityShareholderStockCount)
   )
   if (majorityShareholders.length > 1 || minorityShareholderStockCount <= 0) {
      return {
         majority: majorityShareholders,
         minority: majorityShareholders,
      }
   }
   const minorityShareholders = stocks
      .map((count, playerId) => ({ count, playerId }))
      .filter(({ count }) => count === minorityShareholderStockCount)
      .map(({ playerId }) => playerId)
   return {
      majority: majorityShareholders,
      minority: minorityShareholders,
   }
}

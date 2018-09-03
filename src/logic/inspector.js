import { determineBonusShareholders, findChainsInBlock } from './util'

export default function createInspector(rules, state) {
   function getChainById(chainId) {
      const id = chainId
      const chain = rules.CHAINS[chainId]
      const name = chain.name
      const tier = chain.tier
      const tiles = state.tiles
         .map((tile, tileId) => ({ ...tile, tileId }))
         .filter(tile => tile && tile.chain === chainId)
         .map(({ tileId }) => tileId)
      const size = tiles.length
      const active = size > 0
      const stocks = state.stocks[chainId]
      const availableStock =
         rules.MAX_STOCK - stocks.reduce((sum, quantity) => sum + quantity)
      const price =
         size >= rules.TIERS[tier].length
            ? rules.TIERS[tier].slice(-1)[0]
            : rules.TIERS[tier][size]
      const safe = size >= rules.SAFE_CHAIN_SIZE
      const bonuses = determineBonuses(chainId)
      return {
         id,
         name,
         tier,
         tiles,
         size,
         stocks,
         availableStock,
         price,
         safe,
         bonuses,
         active,
      }
   }

   function getPlayerById(playerId) {
      const money = state.players[playerId].money
      const stocks = state.stocks.map(
         stocksByPlayer => stocksByPlayer[playerId]
      )
      const tiles = state.tiles
         .map((tile, tileId) => ({ ...tile, tileId }))
         .filter(tile => tile && tile.holder === playerId)
         .map(({ tileId }) => tileId)
      return {
         money,
         stocks,
         tiles,
      }
   }

   function canGameBeEnded() {
      const chainSizes = rules.CHAINS.map((_, chainId) =>
         state.tiles.filter(tile => tile && tile.chain === chainId).length
      )
      const maxChainSize = Math.max(...chainSizes)
      const minNonZeroChainSize = Math.min(...chainSizes.filter(Boolean))
      return (
         maxChainSize >= rules.GAME_END_CHAIN_SIZE ||
         minNonZeroChainSize >= rules.SAFE_CHAIN_SIZE
      )
   }

   function getChains() {
      return rules.CHAINS.map((_, chainId) => getChainById(chainId))
   }

   function isTilePlayable(tileId) {
      return (
         !isTilePermanentlyUnplayable(tileId) &&
         !isTileTemporarilyUnplayable(tileId)
      )
   }

   function isTilePermanentlyUnplayable(tileId) {
      const tiles = state.tiles
      const blockTiles = getTileBlock(tileId)
      const blockChains = findChainsInBlock(blockTiles)
      const chainSizes = Object.values(blockChains).sort((a, b) => b - a)
      return (
         (!tiles[tileId] || tiles[tileId].chain === undefined) &&
         chainSizes.length > 1 &&
         chainSizes[1] >= rules.SAFE_CHAIN_SIZE
      )
   }

   function isTileTemporarilyUnplayable(tileId) {
      const chains = rules.CHAINS || []
      const tiles = state.tiles
      const blockTiles = getTileBlock(tileId)
      const blockChains = findChainsInBlock(blockTiles)
      return (
         blockTiles.length >= rules.MIN_CHAIN_SIZE &&
         !Object.keys(blockChains).length &&
         !getInactiveChains({ chains, tiles }).length
      )
   }

   function getInactiveChains() {
      return rules.CHAINS.map((_, chainId) => chainId).filter(
         chainId => !state.tiles.some(tile => tile && tile.chain === chainId)
      )
   }

   function getTileBlock(tileId) {
      return recursiveBlock(state.tiles, tileId)
         .sort((a, b) => a - b)
         .map(tileId => ({
            tileId,
            ...state.tiles[tileId],
         }))
   }

   function recursiveBlock(tiles, tileId, visitedTiles = {}) {
      const tile = tiles[tileId]
      if (
         !Object.keys(visitedTiles).length ||
         (tile && tile.placer !== undefined && !visitedTiles[tileId])
      ) {
         visitedTiles[tileId] = true
         return [
            tileId,
            ...getAdjacentTiles(tileId).reduce(
               (acc, adjacentTileId) => [
                  ...acc,
                  ...recursiveBlock(tiles, adjacentTileId, visitedTiles),
               ],
               []
            ),
         ]
      }
      return []
   }

   function getAdjacentTiles(tileId) {
      const tileCount = state.tiles.length
      const colCount = rules.COL_COUNT
      return [
         tileId,
         tileId % colCount ? tileId - 1 : -1,
         (tileId + 1) % colCount ? tileId + 1 : -1,
         tileId - colCount,
         tileId + colCount,
      ].filter(i => i >= 0 && i < tileCount)
   }

   function determineBonuses(chainId) {
      const stocks = state.stocks[chainId]
      const tier = rules.CHAINS[chainId].tier
      const tiles = state.tiles
         .map((tile, tileId) => ({ ...tile, tileId }))
         .filter(tile => tile && tile.chain === chainId)
         .map(({ tileId }) => tileId)
      const size = tiles.length
      if (!size) {
         return stocks.map(() => 0)
      }
      const price =
         size >= rules.TIERS[tier].length
            ? rules.TIERS[tier].slice(-1)[0]
            : rules.TIERS[tier][size]
      const {
         majority: majorityShareholders,
         minority: minorityShareholders,
      } = determineBonusShareholders(stocks)
      return stocks.map((_, playerId) => {
         const majorityBonus = majorityShareholders.includes(playerId)
            ? (price * rules.MAJORITY_BONUS_FACTOR) /
              majorityShareholders.length
            : 0
         const minorityBonus = minorityShareholders.includes(playerId)
            ? (price * rules.MINORITY_BONUS_FACTOR) /
              minorityShareholders.length
            : 0
         const totalBonus = majorityBonus + minorityBonus
         return Math.ceil(totalBonus / rules.DOLLAR_LCD) * rules.DOLLAR_LCD
      })
   }

   function getInactiveChains() {
      return rules.CHAINS.map((_, chainId) => chainId).filter(
         chainId => !state.tiles.some(tile => tile && tile.chain === chainId)
      )
   }

   return {
      getChainById,
      getPlayerById,
      canGameBeEnded,
      getChains,
      isTilePlayable,
      isTilePermanentlyUnplayable,
      isTileTemporarilyUnplayable,
      getTileBlock,
      determineBonuses,
      getInactiveChains,
   }
}

import { getInitialState } from './setup'
import { findChainsInBlock } from './util'
import createInspector from './inspector'
import GameState from './GameState'

export default function createActions(rules) {
   function placeInitialTiles(state) {
      const actions = state.players.reduce(
         (result, _, playerId) => [
            ...result,
            drawTile(playerId),
            placeDrawnTile(playerId),
         ],
         []
      )
      return pipe(...actions)(state)
   }

   function placeDrawnTile(playerId) {
      return state => {
         const drawnTileId = state.tiles
            .map((tile, tileId) => ({ tile, tileId }))
            .filter(({ tile }) => tile)
            .find(({ tile }) => tile.holder === playerId).tileId
         return placeTile(drawnTileId)(state)
      }
   }

   function determineFirstTurn(state) {
      return {
         ...state,
         turn: state.tiles.find(tile => tile && tile.placer).placer,
      }
   }

   function drawFullTileRacks(state) {
      const actions = state.players.map((_, playerId) =>
         drawFullTileRack(playerId)
      )
      return pipe(...actions)(state)
   }

   function drawFullTileRack(playerId) {
      return state => {
         const actions = Array(rules.TILE_RACK_SIZE)
            .fill(0)
            .map(() => drawTile(playerId))
         return pipe(...actions)(state)
      }
   }

   function revealPlayerTiles(state) {
      return {
         ...state,
         tiles: state.tiles.map(
            tile =>
               tile && tile.holder === state.turn
                  ? { revealer: state.turn }
                  : tile
         ),
      }
   }

   function newGame() {
      return getInitialState(rules)
   }

   function startGame(state) {
      if (state.step === GameState.SETUP) {
         return pipe(
            placeInitialTiles,
            determineFirstTurn,
            drawFullTileRacks,
            startTurn
         )(state)
      }
      return state
   }

   function startTurn(state) {
      return ensurePlayableTiles(state)
   }

   function ensurePlayableTiles(state) {
      const inspector = createInspector(rules, state)
      const playerTiles = inspector.getPlayerById(state.turn).tiles
      const playablePlayerTiles = playerTiles.filter(inspector.isTilePlayable)
      const nextState = {
         ...state,
         step: GameState.PLACE_TILE,
      }
      if (playablePlayerTiles.length) {
         return nextState
      }
      return playablePlayerTiles.length ? nextState : refreshTileRack(nextState)
   }

   function refreshTileRack(state) {
      return pipe(
         revealPlayerTiles,
         drawFullTileRack(state.turn)
      )(state)
   }

   function drawTile(playerId) {
      return state => {
         const playerTiles = state.tiles.filter(
            tile => tile && tile.holder === playerId
         )
         if (playerTiles.length >= rules.TILE_RACK_SIZE) {
            return state
         }
         const availableTileIds = state.tiles
            .map((tile, index) => ({ tile, index }))
            .filter(({ tile }) => !tile)
            .map(({ index }) => index)
         if (!availableTileIds.length) {
            return state
         }
         const drawnTileIndex = Math.floor(
            Math.random() * availableTileIds.length
         )
         const tileId = availableTileIds[drawnTileIndex]
         return {
            ...state,
            tiles: [
               ...state.tiles.slice(0, tileId),
               { holder: playerId },
               ...state.tiles.slice(tileId + 1),
            ],
         }
      }
   }

   function placeTile(tileId) {
      return state => {
         const holder = state.tiles[tileId].holder
         const tiles = [
            ...state.tiles.slice(0, tileId),
            { placer: holder },
            ...state.tiles.slice(tileId + 1),
         ]
         if (state.step === GameState.SETUP) {
            return {
               ...state,
               tiles,
            }
         }
         const inspector = createInspector(rules, state)
         if (inspector.isTilePlayable(tileId) && holder === state.turn) {
            return checkForMerger({
               ...state,
               tiles,
               lastTile: tileId,
            })
         }
         return state
      }
   }

   function checkForMerger(state) {
      const inspector = createInspector(rules, state)
      const blockTiles = inspector.getTileBlock(state.lastTile)
      if (blockTiles.length >= rules.MIN_CHAIN_SIZE) {
         const blockChains = findChainsInBlock(blockTiles)
         const adjacentChainCount = Object.keys(blockChains).length
         if (adjacentChainCount > 1) {
            // Start a merger
            return determineControllingChain({
               ...state,
               merger: {
                  chains: Object.keys(blockChains).map(Number),
               },
            })
         }
         if (adjacentChainCount === 1) {
            // Expand the chain
            return {
               ...state,
               tiles: [
                  ...state.tiles.slice(0, state.lastTile),
                  {
                     ...state.tiles[state.lastTile],
                     chain: Object.keys(blockChains)[0],
                  },
                  ...state.tiles.slice(state.lastTile + 1),
               ],
               step: GameState.BUY_STOCK,
            }
         }
         // Create a new chain
         return determineNewChain(state)
      }
      // Nothing happens
      return {
         ...state,
         step: GameState.BUY_STOCK,
      }
   }

   function determineNewChain(state) {
      const inspector = createInspector(rules, state)
      const inactiveChains = inspector.getChains().filter(chain => !chain.active)
      if (inactiveChains.length === 1) {
         return foundChain(inactiveChains[0].id)(state)
      }
      return {
         ...state,
         step: GameState.SELECT_CHAIN_TO_FOUND,
      }
   }

   function foundChain(chainId) {
      return state => {
         const inspector = createInspector(rules, state)
         const chainToFound = inspector.getChainById(chainId)
         const blockTileIds = inspector
            .getTileBlock(state.lastTile)
            .map(({ tileId }) => tileId)
         if (
            chainToFound.active ||
            blockTileIds.length < rules.MIN_CHAIN_SIZE
         ) {
            return state
         }
         const ownedStock = state.stocks[chainId].reduce(
            (sum, quantity) => sum + quantity
         )
         const availableStock = rules.MAX_STOCK - ownedStock
         return {
            ...state,
            tiles: state.tiles.map(
               (tile, tileId) =>
                  blockTileIds.includes(tileId)
                     ? { ...tile, chain: chainId }
                     : tile
            ),
            stocks: [
               ...state.stocks.slice(0, chainId),
               [
                  ...state.stocks[chainId].slice(0, state.turn),
                  state.stocks[chainId][state.turn] + (availableStock ? 1 : 0),
                  ...state.stocks[chainId].slice(state.turn + 1),
               ],
               ...state.stocks.slice(chainId + 1),
            ],
            step: GameState.BUY_STOCK,
         }
      }
   }

   function determineControllingChain(state) {
      const inspector = createInspector(rules, state)
      const mergingChains = state.merger.chains
         .map(inspector.getChainById)
         .sort((a, b) => b.size - a.size)
      if (mergingChains[0].size > mergingChains[1].size) {
         const controllingChainId = mergingChains[0].id
         return determineChainToDefunct({
            ...state,
            tiles: [
               ...state.tiles.slice(0, state.lastTile),
               {
                  ...state.tiles[state.lastTile],
                  chain: controllingChainId,
               },
               ...state.tiles.slice(state.lastTile + 1),
            ],
            merger: {
               ...state.merger,
               controllingChain: controllingChainId,
               chains: state.merger.chains.filter(
                  chainId => chainId !== controllingChainId
               ),
            },
         })
      }
      return {
         ...state,
         step: GameState.SELECT_CHAIN_TO_CONTROL,
      }
   }

   function setControllingChain(controllingChainId) {
      return state => {
         const inspector = createInspector(rules, state)
         const mergingChains = state.merger.chains.map(inspector.getChainById)
         const largestMergingChainSize = Math.max(
            ...mergingChains.map(chain => chain.size)
         )
         const selectedChain = mergingChains.find(
            chain => chain.id === controllingChainId
         )
         if (selectedChain && selectedChain.size === largestMergingChainSize) {
            return determineChainToDefunct({
               ...state,
               merger: {
                  ...state.merger,
                  controllingChain: controllingChainId,
                  chains: state.merger.chains.filter(
                     chainId => chainId !== controllingChainId
                  ),
               },
            })
         }
         return state
      }
   }

   function determineChainToDefunct(state) {
      if (!state.merger.chains.length) {
         return {
            ...state,
            step: GameState.BUY_STOCK,
            merger: undefined,
         }
      }
      const inspector = createInspector(rules, state)
      const mergingChains = state.merger.chains
         .map(inspector.getChainById)
         .sort((a, b) => b.size - a.size)
      if (
         mergingChains.length === 1 ||
         mergingChains[0].size > mergingChains[1].size
      ) {
         return defunctChain(mergingChains[0].id)(state)
      }
      return {
         ...state,
         step: GameState.SELECT_CHAIN_TO_DEFUNCT,
      }
   }

   function defunctChain(defunctChainId) {
      return state => {
         const inspector = createInspector(rules, state)
         const controllingChainId = state.merger.controllingChain
         const chainToDefunct = inspector.getChainById(defunctChainId)
         return checkDefunctStock({
            ...state,
            tiles: state.tiles.map(
               (tile, tileId) =>
                  chainToDefunct.tiles.includes(tileId)
                     ? { ...tile, chain: controllingChainId }
                     : tile
            ),
            players: state.players.map((player, playerId) => ({
               ...player,
               money:
                  state.players[playerId].money +
                  chainToDefunct.bonuses[playerId],
            })),
            merger: {
               ...state.merger,
               defunctChain: {
                  id: defunctChainId,
                  size: chainToDefunct.size,
               },
               chains: state.merger.chains.filter(
                  chainId => chainId !== defunctChainId
               ),
               turn: state.turn,
            },
         })
      }
   }

   function checkDefunctStock(state) {
      if (state.stocks[state.merger.defunctChain.id][state.merger.turn]) {
         return {
            ...state,
            step: GameState.HANDLE_DEFUNCT_STOCK,
         }
      }
      const nextMergerTurn = (state.merger.turn + 1) % rules.PLAYER_COUNT
      if (nextMergerTurn === state.turn) {
         return determineChainToDefunct(state)
      }
      return checkDefunctStock({
         ...state,
         merger: {
            ...state.merger,
            turn: nextMergerTurn,
         },
      })
   }

   function setDefunctChain(defunctChainId) {
      return state => {
         const inspector = createInspector(rules, state)
         const chainToDefunct = inspector.getChainById(defunctChainId)
         const mergingChains = state.merger.chains.map(chainId =>
            inspector.getChainById(chainId)
         )
         const mergingChainSizes = mergingChains
            .map(chain => chain.size)
            .sort((a, b) => a - b)
         if (chainToDefunct.size === mergingChainSizes[1]) {
            return defunctChain(defunctChainId)(state)
         }
         return state
      }
   }

   function buyStock(chainsToPurchase) {
      return state => {
         const inspector = createInspector(rules, state)
         const chains = Object.keys(chainsToPurchase)
            .map(Number)
            .map(inspector.getChainById)
         const totalCost = chains.reduce(
            (sum, chain) => sum + chain.price * chainsToPurchase[chain.id],
            0
         )
         const notAllChainsActive = () => chains.some(chain => !chain.active)
         const tooManyCertificates = () => {
            const totalCount = Object.values(chainsToPurchase).reduce(
               (sum, quantity) => sum + quantity,
               0
            )
            return totalCount > rules.MAX_STOCK_PURCHASE
         }
         const insufficientQuantity = () =>
            chains.some(
               chain => chain.availableStock < chainsToPurchase[chain.id]
            )
         const tooExpensive = () => totalCost > state.players[state.turn].money
         if (
            notAllChainsActive() ||
            tooManyCertificates() ||
            insufficientQuantity() ||
            tooExpensive()
         ) {
            return state
         }
         return checkTurnEnd({
            ...state,
            stocks: state.stocks.map((chainStocks, chainId) => [
               ...chainStocks.slice(0, state.turn),
               chainStocks[state.turn] + (chainsToPurchase[chainId] || 0),
               ...chainStocks.slice(state.turn + 1),
            ]),
            players: [
               ...state.players.slice(0, state.turn),
               {
                  ...state.players[state.turn],
                  money: state.players[state.turn].money - totalCost,
               },
               ...state.players.slice(state.turn + 1),
            ],
         })
      }
   }

   function checkTurnEnd(state) {
      const inspector = createInspector(rules, state)
      if (inspector.canGameBeEnded()) {
         return {
            ...state,
            step: GameState.TURN_END,
         }
      }
      return endTurn(state)
   }

   function endTurn(state) {
      const nextTurn = (state.turn + 1) % rules.PLAYER_COUNT
      return startTurn({
         ...state,
         turn: nextTurn,
      })
   }

   function handleDefunctStock({ sell = 0, trade = 0 } = {}) {
      return state => {
         if (trade % 2) {
            return state
         }
         const inspector = createInspector(rules, state)
         const controllingChain = inspector.getChainById(
            state.merger.controllingChain
         )
         const stockCountDelta = chainId =>
            chainId === state.merger.defunctChain.id
               ? -(sell + trade)
               : chainId === state.merger.controllingChain
                  ? trade / 2
                  : 0
         if (
            sell + trade >
            state.stocks[state.merger.defunctChain.id][state.merger.turn]
         ) {
            return state
         }
         if (trade / 2 > controllingChain.availableStock) {
            return state
         }
         const size = state.merger.defunctChain.size
         const tier = rules.CHAINS[state.merger.defunctChain.id].tier
         const price =
            size >= rules.TIERS[tier].length
               ? rules.TIERS[tier].slice(-1)[0]
               : rules.TIERS[tier][size]
         const moneyDelta = sell * price
         const nextMergerTurn = (state.merger.turn + 1) % rules.PLAYER_COUNT
         const nextAction =
            nextMergerTurn === state.turn
               ? determineChainToDefunct
               : checkDefunctStock
         return nextAction({
            ...state,
            stocks: state.stocks.map((chainStocks, chainId) => [
               ...chainStocks.slice(0, state.merger.turn),
               chainStocks[state.merger.turn] + stockCountDelta(chainId),
               ...chainStocks.slice(state.merger.turn + 1),
            ]),
            players: [
               ...state.players.slice(0, state.merger.turn),
               {
                  ...state.players[state.merger.turn],
                  money: state.players[state.merger.turn].money + moneyDelta,
               },
               ...state.players.slice(state.merger.turn + 1),
            ],
            merger: {
               ...state.merger,
               turn: nextMergerTurn,
            },
         })
      }
   }

   function endGame(state) {
      const inspector = createInspector(rules, state)
      if (!inspector.canGameBeEnded()) {
         return state
      }
      const chains = inspector.getChains()
      const bonusesByChain = chains.map(chain => chain.bonuses)
      const bonusesByPlayer = state.players.map((_, playerId) =>
         bonusesByChain.reduce((sum, bonuses) => sum + bonuses[playerId], 0)
      )
      const salesByPlayer = state.players.map((_, playerId) =>
         chains
            .filter(chain => chain.active)
            .reduce(
               (sum, chain) => sum + chain.stocks[playerId] * chain.price,
               0
            )
      )
      return {
         ...state,
         players: state.players.map((player, playerId) => ({
            ...player,
            money:
               player.money +
               bonusesByPlayer[playerId] +
               salesByPlayer[playerId],
         })),
         stocks: chains.map(
            chain =>
               chain.active
                  ? state.players.map(() => 0)
                  : state.stocks[chain.id]
         ),
         step: GameState.GAME_OVER,
      }
   }

   return {
      newGame,
      startGame,
      startTurn,
      // not public
      refreshTileRack,
      placeTile,
      foundChain,
      setControllingChain,
      setDefunctChain,
      handleDefunctStock,
      buyStock,
      // not public
      drawTile,
      endGame,
   }
}

const pipe = (...fns) =>
   fns.reverse().reduce((f, g) => (...args) => f(g(...args)))

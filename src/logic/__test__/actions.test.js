import createActions from '../actions'
import { getInitialState } from '../setup'
import createInspector from '../inspector'
import GameState from '../GameState'

describe('startGame', () => {
   it('determines turn order', () => {
      const rules = {
         ROW_COUNT: 9,
         COL_COUNT: 12,
         PLAYER_COUNT: 4,
         TILE_RACK_SIZE: 6,
      }
      const actions = createActions(rules)
      const state = getInitialState(rules)
      const nextState = actions.startGame(state)
      expect(nextState.turn).not.toBeUndefined()
   })

   it('draws tiles for each player', () => {
      const rules = {
         ROW_COUNT: 9,
         COL_COUNT: 12,
         PLAYER_COUNT: 4,
         TILE_RACK_SIZE: 6,
      }
      const actions = createActions(rules)
      const state = getInitialState(rules)
      const nextState = actions.startGame(state)
      const inspector = createInspector(rules, nextState)
      expect(inspector.getPlayerById(0).tiles).toHaveLength(6)
      expect(inspector.getPlayerById(1).tiles).toHaveLength(6)
      expect(inspector.getPlayerById(2).tiles).toHaveLength(6)
      expect(inspector.getPlayerById(3).tiles).toHaveLength(6)
   })

   it('places initial tiles on the board', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         ROW_COUNT: 4,
         COL_COUNT: 2,
         PLAYER_COUNT: 4,
         TILE_RACK_SIZE: 2,
         MIN_CHAIN_SIZE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         step: GameState.SETUP,
      }
      const nextState = actions.startGame(state)
      const placedTileCount = nextState.tiles.filter(
         tile => tile && tile.placer !== undefined
      ).length
      expect(placedTileCount).toBe(4)
   })

   it('does not change a started game', () => {
      const actions = createActions({})
      const state = {
         ...getInitialState({}),
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.startGame(state)
      expect(nextState).toEqual(state)
   })
})

describe('newGame', () => {
   it('resets to initialState', () => {
      const actions = createActions({})
      const state = getInitialState({})
      const nextState = actions.newGame()
      expect(nextState).toEqual(state)
   })
})

// TODO: These tests should be handled by other tests since this isn't a public action
describe('drawTile', () => {
   it('draws a random live tile', () => {
      const rules = {
         ROW_COUNT: 1,
         COL_COUNT: 3,
      }
      const actions = createActions(rules)
      const TILE_1B = { chain: 'Sackson' }
      const TILE_3B = { chain: 'Worldwide' }
      const state = {
         ...getInitialState(rules),
         tiles: [TILE_1B, null, TILE_3B],
      }
      const nextState = actions.drawTile(0)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [TILE_1B, { holder: 0 }, TILE_3B],
      })
   })
   it('disallows drawing when tile rack is full', () => {
      const rules = {
         TILE_RACK_SIZE: 6,
         COL_COUNT: 6,
         ROW_COUNT: 2,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            null,
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
         ],
      }
      const nextState0 = actions.drawTile(0)(state)
      const nextState1 = actions.drawTile(1)(state)
      expect(nextState0).toEqual({
         ...state,
         tiles: [
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 0 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
            { holder: 1 },
         ],
      })
      expect(nextState1).toEqual(state)
   })
   it('disallows drawing tile from empty bag', () => {
      const rules = {
         ROW_COUNT: 2,
         COL_COUNT: 2,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { holder: 0 },
            { chain: 'Sackson' },
            { holder: 2 },
            { dead: true },
         ],
      }
      const nextState = actions.drawTile(0)(state)
      expect(nextState).toEqual(state)
   })
})

describe('placeTile', () => {
   it('sets tile to be placed by holding player', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 2,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         PLAYER_COUNT: 4,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 11,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [null, { holder: 0 }, { holder: 1 }, null],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(1)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [null, { placer: 0 }, { holder: 1 }, null],
         lastTile: 1,
         step: GameState.BUY_STOCK,
      })
   })

   it('disallows placing tiles not held by a player', () => {
      const rules = {
         ROW_COUNT: 2,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         PLAYER_COUNT: 4,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [null, { holder: 0 }, { holder: 1 }, null],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(2)(state)
      expect(nextState).toEqual(state)
   })

   it("disallows placing tile on other's turn", () => {
      const rules = {
         ROW_COUNT: 2,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         PLAYER_COUNT: 4,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [null, { holder: 0 }, { holder: 1 }, null],
         turn: 1,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(1)(state)
      expect(nextState).toEqual(state)
   })

   it('disallows placing a permanently unplayable tile', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         ROW_COUNT: 2,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 1,
         SAFE_CHAIN_SIZE: 1,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [{ chain: 0 }, { holder: 0 }, null, { chain: 1 }],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(1)(state)
      expect(nextState).toEqual(state)
   })

   it('disallows placing a temporarily unplayable tile', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         ROW_COUNT: 2,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 1,
         SAFE_CHAIN_SIZE: 1,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [{ chain: 0 }, null, null, { chain: 1 }, { holder: 0 }, null],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(4)(state)
      expect(nextState).toEqual(state)
   })

   it('gives player chain founding option', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
         ],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 2,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            { placer: 0 },
            { holder: 0 },
         ],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(5)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            { placer: 0 },
            { placer: 0 },
         ],
         lastTile: 5,
         step: GameState.SELECT_CHAIN_TO_FOUND,
      })
   })

   it('automatically founds a chain if there is only one available', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
         ],
         TIERS: [[100]],
         ROW_COUNT: 5,
         COL_COUNT: 2,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 2,
         PLAYER_COUNT: 1,
         MAX_STOCK: 10,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            { placer: 0 },
            { holder: 0 },
            null,
            null,
            { chain: 2 },
            { chain: 2 },
         ],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(5)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { chain: 2 },
            { chain: 2 },
         ],
         stocks: [[0], [1], [0]],
         lastTile: 5,
         step: GameState.BUY_STOCK,
      })
   })

   it('automatically merges chains when one chain is bigger than the others', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 3,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 11,
         PLAYER_COUNT: 1,
         MAX_STOCK: 10,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { holder: 0 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
         ],
         stocks: [[0], [1]],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(4)(state)
      expect(nextState).toEqual({
         ...state,
         players: [{ money: 1500 }],
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
         ],
         stocks: [[0], [1]],
         lastTile: 4,
         merger: {
            chains: [],
            controllingChain: 0,
            defunctChain: {
               id: 1,
               size: 2,
            },
            turn: 0,
         },
         step: GameState.HANDLE_DEFUNCT_STOCK,
      })
   })

   it('gives player controlling chain option when two chains are tied for the biggest', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 3,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 11,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { holder: 0 },
            { placer: 0, chain: 1 },
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
         ],
         stocks: [[0], [1]],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(4)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { placer: 0 },
            { placer: 0, chain: 1 },
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
         ],
         lastTile: 4,
         merger: {
            chains: [0, 1],
         },
         step: GameState.SELECT_CHAIN_TO_CONTROL,
      })
   })

   it('gives player buy option when no one owns defunct stock', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 3,
         TILE_RACK_SIZE: 1,
         MIN_CHAIN_SIZE: 2,
         SAFE_CHAIN_SIZE: 11,
         PLAYER_COUNT: 1,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         INITIAL_MONEY: 0,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { holder: 0 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
         ],
         stocks: [[0], [0]],
         turn: 0,
         step: GameState.PLACE_TILE,
      }
      const nextState = actions.placeTile(4)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
         ],
         lastTile: 4,
         step: GameState.BUY_STOCK,
      })
   })
})

describe('foundChain', () => {
   it('claims all recursively adjacent tiles for given hotel chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 3,
         MIN_CHAIN_SIZE: 2,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         // 110
         // 010
         // 011
         tiles: [
            { placer: 0 },
            { placer: 0 },
            null,
            null,
            { placer: 0 },
            null,
            null,
            { placer: 0 },
            { placer: 0 },
         ],
         turn: 0,
         lastTile: 4,
      }
      const nextState = actions.foundChain(1)(state)
      expect(nextState).toMatchObject({
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
         ],
      })
   })

   it('awards one free stock certificate to chain founder', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 1,
         COL_COUNT: 2,
         MIN_CHAIN_SIZE: 2,
         PLAYER_COUNT: 1,
         MAX_STOCK: 10,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [{ placer: 0 }, { placer: 0 }],
         turn: 0,
         lastTile: 1,
      }
      const nextState = actions.foundChain(0)(state)
      expect(nextState).toEqual({
         ...state,
         stocks: [[1]],
         tiles: [{ placer: 0, chain: 0 }, { placer: 0, chain: 0 }],
         step: GameState.BUY_STOCK,
      })
   })

   it('does not award free stock to chain founder if none are available', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 1,
         COL_COUNT: 2,
         MIN_CHAIN_SIZE: 2,
         PLAYER_COUNT: 2,
         MAX_STOCK: 5,
      }
      const actions = createActions(rules)
      const initialState = getInitialState(rules)
      const state = {
         ...initialState,
         stocks: [[2, 3]],
         tiles: [{ placer: 0 }, { placer: 0 }],
         turn: 0,
         lastTile: 1,
      }
      const nextState = actions.foundChain(0)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [{ placer: 0, chain: 0 }, { placer: 0, chain: 0 }],
         step: GameState.BUY_STOCK,
      })
   })

   it('disallows founding chains below minimum size', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 1,
         COL_COUNT: 2,
         MIN_CHAIN_SIZE: 3,
         PLAYER_COUNT: 1,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [{ placer: 0 }, { placer: 0 }],
         turn: 0,
         lastTile: 1,
      }
      const nextState = actions.foundChain(0)(state)
      expect(nextState).toEqual(state)
   })

   it('disallows founding a chain that is already in play', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 0 }],
         TIERS: [[100]],
         ROW_COUNT: 3,
         COL_COUNT: 3,
         MIN_CHAIN_SIZE: 2,
         PLAYER_COUNT: 2,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            null,
            { placer: 0 },
            { placer: 0 },
            null,
         ],
         turn: 0,
         lastTile: 6,
      }
      const nextState = actions.foundChain(0)(state)
      expect(nextState).toEqual(state)
   })
})

describe('setControllingChain', () => {
   it('advances if chosen chain is tied for the biggest chain in the merger', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 8,
         ROW_COUNT: 5,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            // ----000-
            // ----0---
            // 1111-333
            // ----2---
            // --222---
            null,
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            { placer: 0, chain: 3 },
            { placer: 0, chain: 3 },
            { placer: 0, chain: 3 },
            null,
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            null,
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            null,
            null,
            null,
         ],
         turn: 0,
         step: GameState.SELECT_CHAIN_TO_CONTROL,
         merger: {
            chains: [0, 1, 2, 3],
         },
      }
      const nextState = actions.setControllingChain(1)(state)
      expect(nextState).toEqual({
         ...state,
         step: GameState.SELECT_CHAIN_TO_DEFUNCT,
         merger: {
            chains: [0, 2, 3],
            controllingChain: 1,
         },
      })
   })

   it('does not advance if chosen chain is not tied for the biggest chain in the merger', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 8,
         ROW_COUNT: 5,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            // ----000-
            // ----0---
            // 1111-333
            // ----2---
            // --222---
            null,
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            { placer: 0, chain: 3 },
            { placer: 0, chain: 3 },
            { placer: 0, chain: 3 },
            null,
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            null,
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            null,
            null,
            null,
         ],
         turn: 0,
         step: GameState.SELECT_CHAIN_TO_CONTROL,
         merger: {
            chains: [0, 1, 2, 3],
         },
      }
      const nextState = actions.setControllingChain(3)(state)
      expect(nextState).toEqual(state)
   })
})

describe('setDefunctChain', () => {
   it('advances if chosen chain is tied for the biggest chain in the merger', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 8,
         ROW_COUNT: 5,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            // -000
            // -0--
            // 1-22
            // 1---
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 1 },
            null,
            null,
            null,
         ],
         stocks: [[0, 0, 0, 0], [3, 4, 2, 5], [0, 0, 0, 0], [0, 0, 0, 0]],
         turn: 0,
         step: GameState.SELECT_CHAIN_TO_DEFUNCT,
         lastTile: 9,
         merger: {
            chains: [1, 2],
            controllingChain: 0,
         },
      }
      const nextState = actions.setDefunctChain(1)(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
         ],
         players: [
            { money: 0 },
            { money: 1000 },
            { money: 0 },
            { money: 2000 },
         ],
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            chains: [2],
            controllingChain: 0,
            defunctChain: {
               id: 1,
               size: 2,
            },
            turn: 0,
         },
      })
   })

   it('does not advance if chosen chain is smaller than the second biggest chain in the merger', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 8,
         ROW_COUNT: 5,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            // -000
            // -0--
            // 1-22
            // 1--2
            null,
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 0 },
            null,
            null,
            { placer: 0, chain: 1 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 2 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 2 },
         ],
         turn: 0,
         step: GameState.SELECT_CHAIN_TO_DEFUNCT,
         lastTile: 9,
         merger: {
            chains: [1, 2],
            controllingChain: 0,
         },
      }
      const nextState = actions.setDefunctChain(1)(state)
      expect(nextState).toEqual(state)
   })
})

describe('buyStock', () => {
   it('disallows purchase of more than the maximum single-purchase quantity', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 1,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 5000,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            { placer: 0, chain: 3 },
         ],
         stocks: [[0], [0], [0], [0]],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const result1 = actions.buyStock({ 1: 4 })(state)
      const result2 = actions.buyStock({ 0: 3, 2: 1 })(state)
      const result3 = actions.buyStock({ 2: 2, 3: 2 })(state)
      const result4 = actions.buyStock({ 1: 2, 2: 1, 3: 1 })(state)
      const result5 = actions.buyStock({ 0: 1, 1: 1, 2: 1, 3: 1 })(state)
      expect(result1).toEqual(state)
      expect(result2).toEqual(state)
      expect(result3).toEqual(state)
      expect(result4).toEqual(state)
      expect(result5).toEqual(state)
   })

   it('disallows purchase if player cannot afford the total cost', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            { placer: 0, chain: 3 },
         ],
         stocks: [[0], [0], [0], [0]],
         players: [{ money: 500 }],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const result = actions.buyStock({ 1: 3 })(state)
      expect(result).toEqual(state)
   })

   it('disallows purchase if one of the chosen chains has no available stock certificates remaining', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 5,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            { placer: 0, chain: 3 },
         ],
         players: [{ money: 5000 }],
         turn: 0,
         stocks: [[0], [3], [2], [4]],
         step: GameState.BUY_STOCK,
      }
      const result1 = actions.buyStock({ 1: 3 })(state)
      const result2 = actions.buyStock({ 0: 1, 3: 2 })(state)
      expect(result1).toEqual(state)
      expect(result2).toEqual(state)
   })

   it('disallows purchase if one of the chosen chains is not on the board', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            null,
         ],
         stocks: [[0], [0], [0], [0]],
         players: [{ money: 5000 }],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const result = actions.buyStock({ 1: 1, 2: 1, 3: 1 })(state)
      expect(result).toEqual(state)
   })

   it('allows user to purchase no stock', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 4,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            { placer: 0, chain: 3 },
         ],
         stocks: [[0], [0], [0], [0]],
         players: [{ money: 5000 }, { money: 0 }, { money: 0 }, { money: 0 }],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const result = actions.buyStock({})(state)
      expect(result.turn).toEqual(1)
      expect(result.step).toEqual(GameState.PLACE_TILE)
   })

   it('allows purchase of up to three stock certificates', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 0 },
            { name: 'Festival', tier: 0 },
            { name: 'Imperial', tier: 0 },
         ],
         TIERS: [[200]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         DOLLAR_LCD: 100,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            null,
            { placer: 0, chain: 1 },
            null,
            null,
            null,
            { placer: 0, chain: 2 },
            null,
            { placer: 0, chain: 3 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const result1 = actions.buyStock({ 0: 1 })(state)
      const result2 = actions.buyStock({ 1: 2 })(state)
      const result3 = actions.buyStock({ 2: 3 })(state)
      const result4 = actions.buyStock({ 1: 1, 2: 2 })(state)
      const result5 = actions.buyStock({ 0: 1, 2: 1, 3: 1 })(state)
      const result6 = actions.buyStock({ 1: 1, 2: 1 })({
         ...state,
         turn: 1,
      })
      expect(result1).toMatchObject({
         stocks: [[1, 0], [0, 0], [0, 0], [0, 0]],
         players: [{ money: 4800 }, { money: 3000 }],
         step: GameState.PLACE_TILE,
         turn: 1,
      })
      expect(result2).toMatchObject({
         stocks: [[0, 0], [2, 0], [0, 0], [0, 0]],
         players: [{ money: 4600 }, { money: 3000 }],
         step: GameState.PLACE_TILE,
         turn: 1,
      })
      expect(result3).toMatchObject({
         stocks: [[0, 0], [0, 0], [3, 0], [0, 0]],
         players: [{ money: 4400 }, { money: 3000 }],
         step: GameState.PLACE_TILE,
         turn: 1,
      })
      expect(result4).toMatchObject({
         stocks: [[0, 0], [1, 0], [2, 0], [0, 0]],
         players: [{ money: 4400 }, { money: 3000 }],
         step: GameState.PLACE_TILE,
         turn: 1,
      })
      expect(result5).toMatchObject({
         stocks: [[1, 0], [0, 0], [1, 0], [1, 0]],
         players: [{ money: 4400 }, { money: 3000 }],
         step: GameState.PLACE_TILE,
         turn: 1,
      })
      expect(result6).toMatchObject({
         stocks: [[0, 0], [0, 1], [0, 1], [0, 0]],
         players: [{ money: 5000 }, { money: 2600 }],
         step: GameState.PLACE_TILE,
         turn: 0,
      })
   })
})

describe('handleDefunctStock', () => {
   it('disallows selling and trading more stock than the player owns', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 1 }],
         TIERS: [[200], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[4, 2], [3, 4], [5, 2], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            defunctChain: {
               id: 0,
               size: 2,
            },
            turn: 0,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 2 })(state)
      expect(nextState).toEqual(state)
   })

   it('disallows trading for more stock than is available', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 1 }],
         TIERS: [[100, 150, 200, 250, 300], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[7, 2], [3, 4], [5, 2], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            defunctChain: {
               id: 0,
               size: 2,
            },
            turn: 0,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 4, trade: 4 })(state)
      expect(nextState).toEqual(state)
   })

   it('allows selling and trading owned stock', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 1 }],
         TIERS: [[100, 150, 200, 250, 300], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[7, 2], [3, 4], [5, 2], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            defunctChain: {
               id: 0,
               size: 2,
            },
            turn: 0,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 2 })(state)
      expect(nextState).toEqual({
         ...state,
         players: [{ money: 5600 }, { money: 3000 }],
         stocks: [[2, 2], [4, 4], [5, 2], [7, 8]],
         merger: {
            ...state.merger,
            turn: 1,
         },
      })
   })

   it('disallows trading an odd number of stock certificates', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 1 }],
         TIERS: [[100, 150, 200, 250, 300], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[7, 2], [3, 4], [5, 2], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            defunctChain: {
               id: 0,
               size: 2,
            },
            turn: 0,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 3 })(state)
      expect(nextState).toEqual(state)
   })

   it('skips handling defunct stock for players without stock', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }, { name: 'Worldwide', tier: 1 }],
         TIERS: [[100, 150, 200, 250, 300], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[7, 0], [3, 4], [5, 2], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            chains: [],
            defunctChain: {
               id: 0,
               size: 2,
            },
            turn: 0,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 2 })(state)
      expect(nextState).toEqual({
         ...state,
         merger: undefined,
         players: [{ money: 5600 }, { money: 3000 }],
         stocks: [[2, 0], [4, 4], [5, 2], [7, 8]],
         step: GameState.BUY_STOCK,
      })
   })

   it('automatically defuncts the next chain when all players have handled defunct stock', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 1 },
            { name: 'Festival', tier: 1 },
         ],
         TIERS: [[0, 100, 200, 300, 400], [500]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 2 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[2, 7], [3, 4], [5, 3], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            chains: [2],
            defunctChain: {
               id: 0,
               size: 1,
            },
            turn: 1,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 2 })(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         merger: {
            controllingChain: 1,
            chains: [],
            defunctChain: {
               id: 2,
               size: 1,
            },
            turn: 0,
         },
         players: [{ money: 10000 }, { money: 5800 }],
         stocks: [[2, 2], [3, 5], [5, 3], [7, 8]],
         step: GameState.HANDLE_DEFUNCT_STOCK,
      })
   })

   it('skips to choosing the next chain to defunct when there is a tie and all players have handled defunct stock', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 1 },
            { name: 'Festival', tier: 1 },
            { name: 'Imperial', tier: 2 },
         ],
         TIERS: [[0, 100, 200, 300, 400], [500], [800]],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 11,
         INITIAL_MONEY: 0,
         GAME_END_CHAIN_SIZE: 3,
         MAX_STOCK: 25,
         MIN_CHAIN_SIZE: 1,
         MAX_STOCK_PURCHASE: 3,
      }
      const actions = createActions(rules)
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 2 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 3 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         players: [{ money: 5000 }, { money: 3000 }],
         stocks: [[2, 7], [3, 4], [5, 3], [7, 8]],
         turn: 0,
         step: GameState.HANDLE_DEFUNCT_STOCK,
         merger: {
            controllingChain: 1,
            chains: [2, 3],
            defunctChain: {
               id: 0,
               size: 1,
            },
            turn: 1,
         },
      }
      const nextState = actions.handleDefunctStock({ sell: 3, trade: 2 })(state)
      expect(nextState).toEqual({
         ...state,
         tiles: [
            { placer: 0, chain: 2 },
            { placer: 0, chain: 1 },
            { placer: 0, chain: 3 },
            null,
            null,
            { placer: 0, chain: 1 },
            null,
            { placer: 1, chain: 1 },
            { placer: 1, chain: 1 },
         ],
         merger: {
            controllingChain: 1,
            chains: [2, 3],
            defunctChain: {
               id: 0,
               size: 1,
            },
            turn: 0,
         },
         players: [{ money: 5000 }, { money: 3300 }],
         stocks: [[2, 2], [3, 5], [5, 3], [7, 8]],
         step: GameState.SELECT_CHAIN_TO_DEFUNCT,
      })
   })
})

describe('endGame', () => {
   it('disallows ending if conditions are not met', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 1 },
            { name: 'Festival', tier: 1 },
         ],
         TIERS: [[0, 100, 200, 300, 400], [500]],
         COL_COUNT: 4,
         ROW_COUNT: 4,
         PLAYER_COUNT: 2,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 3,
         GAME_END_CHAIN_SIZE: 5,
         MIN_CHAIN_SIZE: 1,
      }
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            null,
            { placer: 1, chain: 1 },
            null,
            null,
            null,
            { placer: 1, chain: 1 },
            null,
            null,
            null,
         ],
         turn: 0,
         step: GameState.BUY_STOCK,
      }
      const actions = createActions(rules)
      const nextState = actions.endGame(state)
      expect(nextState).toEqual(state)
   })

   it('ends the game if a chain is big enough', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 1 },
            { name: 'Festival', tier: 1 },
         ],
         TIERS: [[0, 100, 200, 300, 400], [500]],
         COL_COUNT: 4,
         ROW_COUNT: 4,
         PLAYER_COUNT: 3,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 3,
         GAME_END_CHAIN_SIZE: 5,
         MIN_CHAIN_SIZE: 1,
      }
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            { placer: 0, chain: 0 },
            { placer: 1, chain: 0 },
            { placer: 1, chain: 1 },
            null,
            null,
            null,
            { placer: 1, chain: 1 },
            null,
            null,
            null,
         ],
         players: [{ money: 2500 }, { money: 3100 }, { money: 600 }],
         stocks: [[1, 2, 2], [3, 2, 2], [1, 1, 2]],
         turn: 2,
         step: GameState.BUY_STOCK,
      }
      const actions = createActions(rules)
      const nextState = actions.endGame(state)
      // Initial:
      //                [2500, 3100,  600]
      // Bonuses:
      //    SACKSON:    [   0, 3000, 3000]
      //    WORLDWIDE:  [5000, 1300, 1300]
      //    FESTIVAL:   [   0,    0,    0]
      // Sales:
      //    SACKSON:    [ 400,  800,  800]
      //    WORLDWIDE:  [1500, 1000, 1000]
      //    FESTIVAL:   [   0,    0,    0]
      expect(nextState).toEqual({
         ...state,
         players: [{ money: 9400 }, { money: 9200 }, { money: 6700 }],
         stocks: [[0, 0, 0], [0, 0, 0], [1, 1, 2]],
         step: GameState.GAME_OVER,
      })
   })

   it('ends the game if all active chains are safe', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson', tier: 0 },
            { name: 'Worldwide', tier: 1 },
            { name: 'Festival', tier: 1 },
         ],
         TIERS: [[0, 100, 200, 300, 400], [500, 600]],
         COL_COUNT: 4,
         ROW_COUNT: 4,
         PLAYER_COUNT: 3,
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         SAFE_CHAIN_SIZE: 3,
         GAME_END_CHAIN_SIZE: 5,
         MIN_CHAIN_SIZE: 1,
      }
      const state = {
         ...getInitialState(rules),
         tiles: [
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            null,
            null,
            null,
            null,
            null,
            { placer: 1, chain: 1 },
            { placer: 0, chain: 1 },
            null,
            null,
            { placer: 1, chain: 1 },
            null,
            null,
            null,
         ],
         players: [{ money: 2500 }, { money: 3100 }, { money: 600 }],
         stocks: [[1, 2, 2], [3, 2, 2], [1, 1, 2]],
         turn: 2,
         step: GameState.BUY_STOCK,
      }
      const actions = createActions(rules)
      const nextState = actions.endGame(state)
      // Initial:
      //                [2500, 3100,  600]
      // Bonuses:
      //    SACKSON:    [   0, 2300, 2300]
      //    WORLDWIDE:  [6000, 1500, 1500]
      //    FESTIVAL:   [   0,    0,    0]
      // Sales:
      //    SACKSON:    [ 300,  600,  600]
      //    WORLDWIDE:  [1800, 1200, 1200]
      //    FESTIVAL:   [   0,    0,    0]
      expect(nextState).toEqual({
         ...state,
         players: [{ money: 10600 }, { money: 8700 }, { money: 6200 }],
         stocks: [[0, 0, 0], [0, 0, 0], [1, 1, 2]],
         step: GameState.GAME_OVER,
      })
   })
})

// TODO: These tests should be handled by other tests since this isn't a public action
describe('refreshTileRack', () => {
   it("completely refreshes the player's tile rack if all of their tiles are dead", () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson' },
            { name: 'Worldwide' },
            { name: 'Festival' },
         ],
         COL_COUNT: 3,
         ROW_COUNT: 5,
         SAFE_CHAIN_SIZE: 1,
         MIN_CHAIN_SIZE: 1,
         PLAYER_COUNT: 1,
         TILE_RACK_SIZE: 4,
      }
      const state = {
         ...getInitialState(rules),
         // 0--
         // -1-
         // 2--
         // ---
         // ---
         tiles: [
            { placer: 0, chain: 0 },
            { holder: 0 },
            null,
            { holder: 0 },
            { placer: 0, chain: 1 },
            { holder: 0 },
            { placer: 0, chain: 2 },
            { holder: 0 },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
         ],
         turn: 0,
      }
      const actions = createActions(rules)
      const nextState = actions.refreshTileRack(state)
      expect(nextState.tiles[1]).toEqual({ revealer: 0 })
      expect(nextState.tiles[3]).toEqual({ revealer: 0 })
      expect(nextState.tiles[5]).toEqual({ revealer: 0 })
      expect(nextState.tiles[7]).toEqual({ revealer: 0 })
      const heldTiles = nextState.tiles.filter(
         tile => tile && tile.holder === 0
      )
      expect(heldTiles).toHaveLength(4)
   })

   it('gives the player all remaining tiles if less than a full rack is available', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson' },
            { name: 'Worldwide' },
            { name: 'Festival' },
         ],
         COL_COUNT: 3,
         ROW_COUNT: 3,
         SAFE_CHAIN_SIZE: 1,
         MIN_CHAIN_SIZE: 1,
         PLAYER_COUNT: 1,
         TILE_RACK_SIZE: 4,
      }
      const state = {
         ...getInitialState(rules),
         // 0--
         // -1-
         // 2--
         tiles: [
            { placer: 0, chain: 0 },
            { holder: 0 },
            null,
            { holder: 0 },
            { placer: 0, chain: 1 },
            { holder: 0 },
            { placer: 0, chain: 2 },
            { holder: 0 },
            null,
         ],
         turn: 0,
      }
      const actions = createActions(rules)
      const nextState = actions.refreshTileRack(state)
      expect(nextState.tiles[1]).toEqual({ revealer: 0 })
      expect(nextState.tiles[3]).toEqual({ revealer: 0 })
      expect(nextState.tiles[5]).toEqual({ revealer: 0 })
      expect(nextState.tiles[7]).toEqual({ revealer: 0 })
      const heldTiles = nextState.tiles.filter(
         tile => tile && tile.holder === 0
      )
      expect(heldTiles).toHaveLength(2)
   })
})

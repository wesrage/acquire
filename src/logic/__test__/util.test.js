import createInspector from '../inspector'
import { findChainsInBlock, determineBonusShareholders } from '../util'

describe('getTileBlock', () => {
   it('returns self tile when there are no adjacent tiles', () => {
      const rules = { COL_COUNT: 3 }
      const state = {
         // ---
         // -x-
         // ---
         tiles: [null, null, null, null, { placer: 0 }, null, null, null, null],
      }
      const inspector = createInspector(rules, state)
      const adjacentTiles = inspector.getTileBlock(4)
      expect(adjacentTiles).toEqual([{ tileId: 4, placer: 0 }])
   })

   it('works for two tiles horizontally', () => {
      const rules = { COL_COUNT: 3 }
      const state = {
         // ---
         // -xx
         // ---
         tiles: [
            null,
            null,
            null,
            null,
            { placer: 0 },
            { placer: 0 },
            null,
            null,
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const adjacentTiles = inspector.getTileBlock(4)
      expect(adjacentTiles).toEqual([
         { tileId: 4, placer: 0 },
         { tileId: 5, placer: 0 },
      ])
   })

   it('works for two tiles vertically', () => {
      const rules = { COL_COUNT: 3 }
      const state = {
         // ---
         // --x
         // --x
         tiles: [
            null,
            null,
            null,
            null,
            null,
            { placer: 0 },
            null,
            null,
            { placer: 0 },
         ],
      }
      const inspector = createInspector(rules, state)
      const adjacentTiles = inspector.getTileBlock(8)
      expect(adjacentTiles).toEqual([
         { tileId: 5, placer: 0 },
         { tileId: 8, placer: 0 },
      ])
   })

   it('works recursively for tiles in all directions', () => {
      const rules = { COL_COUNT: 5 }
      const state = {
         // --x--
         // --x--
         // -xxxx
         // ---x-
         tiles: [
            null,
            null,
            { placer: 0 },
            null,
            null,
            null,
            null,
            { placer: 0 },
            null,
            null,
            null,
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            null,
            null,
            null,
            { placer: 0 },
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const tileBlock = inspector.getTileBlock(14)
      expect(tileBlock).toEqual([
         { tileId: 2, placer: 0 },
         { tileId: 7, placer: 0 },
         { tileId: 11, placer: 0 },
         { tileId: 12, placer: 0 },
         { tileId: 13, placer: 0 },
         { tileId: 14, placer: 0 },
         { tileId: 18, placer: 0 },
      ])
   })

   it('works recursively for complex arrangements', () => {
      const rules = { COL_COUNT: 6 }
      const state = {
         // x--xxx
         // -x---x
         // xx-x-x
         // x--xxx
         // xx-x-x
         // -xxx-x
         tiles: [
            { placer: 0 },
            null,
            null,
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            null,
            { placer: 0 },
            null,
            null,
            null,
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            null,
            { placer: 0 },
            null,
            { placer: 0 },
            { placer: 0 },
            { holder: 0 },
            { holder: 0 },
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            null,
            { placer: 0 },
            null,
            { placer: 0 },
            { holder: 0 },
            { placer: 0 },
            { placer: 0 },
            { placer: 0 },
            null,
            { placer: 0 },
         ],
      }
      const inspector = createInspector(rules, state)
      const tileBlock = inspector.getTileBlock(21)
      expect(tileBlock).toEqual([
         { tileId: 3, placer: 0 },
         { tileId: 4, placer: 0 },
         { tileId: 5, placer: 0 },
         { tileId: 7, placer: 0 },
         { tileId: 11, placer: 0 },
         { tileId: 12, placer: 0 },
         { tileId: 13, placer: 0 },
         { tileId: 15, placer: 0 },
         { tileId: 17, placer: 0 },
         { tileId: 18, placer: 0 },
         { tileId: 21, placer: 0 },
         { tileId: 22, placer: 0 },
         { tileId: 23, placer: 0 },
         { tileId: 24, placer: 0 },
         { tileId: 25, placer: 0 },
         { tileId: 27, placer: 0 },
         { tileId: 29, placer: 0 },
         { tileId: 31, placer: 0 },
         { tileId: 32, placer: 0 },
         { tileId: 33, placer: 0 },
         { tileId: 35, placer: 0 },
      ])
   })
})

describe('findChainsInBlock', () => {
   it('returns empty object when there are no adjacent chains', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
      }
      const state = {
         // xx-
         // -x-
         // -xx
         tiles: [
            { placer: 0 },
            { placer: 0 },
            { holder: 0 },
            null,
            { placer: 0 },
            { holder: 0 },
            { holder: 0 },
            { placer: 0 },
            { placer: 0 },
         ],
      }
      const inspector = createInspector(rules, state)
      const blockTiles = inspector.getTileBlock(4)
      const chains = findChainsInBlock(blockTiles)
      expect(chains).toEqual({})
   })

   it('returns single adjacent chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
      }
      const state = {
         // 11-
         // -x-
         // -xx
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { holder: 0 },
            null,
            { placer: 0 },
            { holder: 0 },
            { holder: 0 },
            { placer: 0 },
            { placer: 0 },
         ],
      }
      const inspector = createInspector(rules, state)
      const blockTiles = inspector.getTileBlock(4)
      const chains = findChainsInBlock(blockTiles)
      expect(chains).toEqual({
         1: 2,
      })
   })

   it('returns all adjacent chains', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson' },
            { name: 'Worldwide' },
            { name: 'Festival' },
         ],
         COL_COUNT: 4,
      }
      const state = {
         // 11-0
         // -x-0
         // -000
         tiles: [
            { placer: 0, chain: 1 },
            { placer: 0, chain: 1 },
            { holder: 0 },
            { placer: 0, chain: 0 },
            null,
            { placer: 0 },
            null,
            { placer: 0, chain: 0 },
            { holder: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
            { placer: 0, chain: 0 },
         ],
      }
      const inspector = createInspector(rules, state)
      const blockTiles = inspector.getTileBlock(5)
      const chains = findChainsInBlock(blockTiles)
      expect(chains).toEqual({
         0: 5,
         1: 2,
      })
   })
})

describe('isTilePermanentlyUnplayable', () => {
   it('returns false if the tile belongs to a chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }],
         COL_COUNT: 1,
         SAFE_CHAIN_SIZE: 2,
      }
      const state = {
         tiles: [{ chain: 0 }],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(0)
      expect(result).toBeFalsy()
   })

   it('returns false if the tile is not adjacent to any chains', () => {
      const rules = {
         chains: [{ name: 'Sackson' }],
         COL_COUNT: 3,
         SAFE_CHAIN_SIZE: 11,
      }
      const state = {
         tiles: [null, null, null, null, { placer: 0 }, null, null, null, null],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(4)
      expect(result).toBeFalsy()
   })

   it('returns false if the tile is only adjacent to one chain', () => {
      const rules = {
         chains: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
         SAFE_CHAIN_SIZE: 4,
      }
      const state = {
         tiles: [
            { chain: 0 },
            { chain: 0 },
            { chain: 0 },
            null,
            { placer: 0 },
            { chain: 0 },
            null,
            null,
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(4)
      expect(result).toBeFalsy()
   })

   it('returns false if the tile is adjacent to two or more non-safe chains', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson' },
            { name: 'Worldwide' },
            { name: 'Festival' },
         ],
         COL_COUNT: 3,
         SAFE_CHAIN_SIZE: 3,
      }
      const state = {
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            null,
            null,
            null,
            { chain: 1 },
            { chain: 1 },
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(4)
      expect(result).toBeFalsy()
   })

   it('returns false if the tile is adjacent to one safe chain and one non-safe chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
         SAFE_CHAIN_SIZE: 2,
      }
      const state = {
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            null,
            null,
            null,
            { chain: 1 },
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(4)
      expect(result).toBeFalsy()
   })

   it('returns true if the tile is adjacent to two safe chains', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
         SAFE_CHAIN_SIZE: 2,
      }
      const state = {
         tiles: [
            { chain: 0 },
            { chain: 0 },
            null,
            null,
            { placer: 0 },
            null,
            null,
            { chain: 1 },
            { chain: 1 },
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTilePermanentlyUnplayable(4)
      expect(result).toBeFalsy()
   })
})

describe('isTileTemporarilyUnplayable', () => {
   it('returns false if there is at least one inactive chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
         MIN_CHAIN_SIZE: 2,
      }
      const state = {
         tiles: [
            null,
            null,
            null,
            null,
            null,
            { placer: 0 },
            null,
            { chain: 0 },
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTileTemporarilyUnplayable(4)
      expect(result).toBeFalsy()
   })

   it('returns false if the tile would not form a new chain', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         COL_COUNT: 3,
         MIN_CHAIN_SIZE: 2,
      }
      const state = {
         tiles: [
            null,
            null,
            null,
            null,
            { chain: 0 },
            null,
            { chain: 1 },
            null,
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTileTemporarilyUnplayable(2)
      expect(result).toBeFalsy()
   })

   it('returns true if the tile would form a new chain and all chains are active', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson' }, { name: 'Worldwide' }],
         MIN_CHAIN_SIZE: 2,
         COL_COUNT: 3,
      }
      const state = {
         tiles: [
            null,
            null,
            null,
            { chain: 0 },
            null,
            { placer: 0 },
            null,
            { chain: 1 },
            null,
         ],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.isTileTemporarilyUnplayable(2)
      expect(result).toBeTruthy()
   })
})

describe('determineBonusShareholders', () => {
   it('returns empty lists when no one holds stock', () => {
      const stocks = [0, 0, 0, 0]
      const result = determineBonusShareholders(stocks)
      expect(result).toEqual({
         majority: [],
         minority: [],
      })
   })

   it('returns sole shareholder as majority and minority', () => {
      const stocks = [0, 0, 5, 0]
      const result = determineBonusShareholders(stocks)
      expect(result).toEqual({
         majority: [2],
         minority: [2],
      })
   })

   it('returns tied majority shareholders as majority and minority', () => {
      const stocks = [2, 1, 1, 2]
      const result = determineBonusShareholders(stocks)
      expect(result).toEqual({
         majority: [0, 3],
         minority: [0, 3],
      })
   })

   it('returns single majority and minority shareholders', () => {
      const stocks = [3, 6, 1, 4]
      const result = determineBonusShareholders(stocks)
      expect(result).toEqual({
         majority: [1],
         minority: [3],
      })
   })

   it('returns single majority and tied minority shareholders', () => {
      const stocks = [4, 2, 2, 2]
      const result = determineBonusShareholders(stocks)
      expect(result).toEqual({
         majority: [0],
         minority: [1, 2, 3],
      })
   })
})

describe('determineBonuses', () => {
   it('gives no bonuses when no one holds stock', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[500]],
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         COL_COUNT: 1,
         PLAYER_COUNT: 4,
      }
      const state = {
         tiles: [{ chain: 0 }],
         stocks: [[0, 0, 0, 0]],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.determineBonuses(0)
      expect(result).toEqual([0, 0, 0, 0])
   })

   it('gives all bonuses for sole shareholder', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[500]],
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         COL_COUNT: 1,
         PLAYER_COUNT: 4,
      }
      const state = {
         tiles: [{ chain: 0 }],
         stocks: [[0, 0, 5, 0]],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.determineBonuses(0)
      expect(result).toEqual([0, 0, 7500, 0])
   })

   it('splits all bonuses between tied majority shareholders', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[500]],
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         COL_COUNT: 1,
         PLAYER_COUNT: 4,
      }
      const state = {
         tiles: [{ chain: 0 }],
         stocks: [[2, 1, 1, 2]],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.determineBonuses(0)
      expect(result).toEqual([3800, 0, 0, 3800])
   })

   it('gives majority and minority bonuses when there are no ties', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[500]],
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         COL_COUNT: 1,
         PLAYER_COUNT: 4,
      }
      const state = {
         tiles: [{ chain: 0 }],
         stocks: [[3, 6, 1, 4]],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.determineBonuses(0)
      expect(result).toEqual([0, 5000, 0, 2500])
   })

   it('gives majority and tied minority bonuses', () => {
      const rules = {
         CHAINS: [{ name: 'Sackson', tier: 0 }],
         TIERS: [[500]],
         MAJORITY_BONUS_FACTOR: 10,
         MINORITY_BONUS_FACTOR: 5,
         DOLLAR_LCD: 100,
         COL_COUNT: 1,
         PLAYER_COUNT: 4,
      }
      const state = {
         tiles: [{ chain: 0 }],
         stocks: [[4, 2, 2, 2]],
      }
      const inspector = createInspector(rules, state)
      const result = inspector.determineBonuses(0)
      expect(result).toEqual([5000, 900, 900, 900])
   })
})

describe('getInactiveChains', () => {
   it('returns empty list when there are no chains', () => {
      const rules = {
         CHAINS: [],
      }
      const state = {
         tiles: [],
      }
      const inspector = createInspector(rules, state)
      const inactiveChains = inspector.getInactiveChains()
      expect(inactiveChains).toHaveLength(0)
   })

   it('returns chains not on the board', () => {
      const rules = {
         CHAINS: [
            { name: 'Sackson' },
            { name: 'Worldwide' },
            { name: 'Festival' },
            { name: 'Imperial' },
         ],
      }
      const state = {
         tiles: [{ chain: 0 }, { chain: 2 }],
      }
      const inspector = createInspector(rules, state)
      const inactiveChains = inspector.getInactiveChains()
      expect(inactiveChains).toEqual([1, 3])
   })
})

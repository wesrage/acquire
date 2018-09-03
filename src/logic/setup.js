import GameState from './GameState'

export function getInitialState(rules) {
   return {
      players: Array(rules.PLAYER_COUNT)
         .fill(0)
         .map(() => ({
            money: rules.INITIAL_MONEY,
         })),
      stocks: (rules.CHAINS || []).map(() => Array(rules.PLAYER_COUNT).fill(0)),
      tiles: Array((rules.ROW_COUNT || 0) * (rules.COL_COUNT || 0)).fill(null),
      step: GameState.SETUP,
   }
}

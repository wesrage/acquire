import rules from './rules'

export const initialState = {
   players: Array(rules.PLAYER_COUNT)
      .fill()
      .map((_, index) => ({
         id: index,
         money: rules.INITIAL_MONEY,
         tiles: [],
         stocks: rules.CHAINS.reduce(
            (acc, chain) => ({
               ...acc,
               [chain.name]: 0,
            }),
            {}
         ),
      })),
   tiles: Array(rules.ROW_COUNT)
      .fill()
      .map(() => Array(rules.COL_COUNT).fill(null)),
}

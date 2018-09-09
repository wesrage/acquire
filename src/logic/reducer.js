import keymirror from 'keymirror'
import createActions from './actions'
import rules from './rules'

const actions = createActions(rules)

const ActionType = keymirror({
   INITIALIZE_GAME: null,
   START_GAME: null,
   PLACE_TILE: null,
   FOUND_CHAIN: null,
   SET_CONTROLLING_CHAIN: null,
   SET_DEFUNCT_CHAIN: null,
   BUY_STOCK: null,
   HANDLE_DEFUNCT_STOCK: null,
   END_TURN: null,
   END_GAME: null,
})

const identity = x => x

export default function reducer(state, action) {
   return ({
      [ActionType.INITIALIZE_GAME]: actions.newGame,
      [ActionType.START_GAME]: actions.startGame,
      [ActionType.PLACE_TILE]: actions.placeTile(action.tileId),
      [ActionType.FOUND_CHAIN]: actions.foundChain(action.chainId),
      [ActionType.SET_CONTROLLING_CHAIN]: actions.setControllingChain(
         action.chainId
      ),
      [ActionType.SET_DEFUNCT_CHAIN]: actions.setDefunctChain(action.chainId),
      [ActionType.BUY_STOCK]: actions.buyStock(action.chains),
      [ActionType.HANDLE_DEFUNCT_STOCK]: actions.handleDefunctStock({
         sell: action.sell,
         trade: action.trade,
      }),
      [ActionType.END_TURN]: actions.endTurn,
      [ActionType.END_GAME]: actions.endGame,
   }[action.type] || identity)(state)
}

export const initializeGame = () => ({ type: ActionType.INITIALIZE_GAME })
export const startGame = () => ({ type: ActionType.START_GAME })
export const placeTile = tileId => ({
   type: ActionType.PLACE_TILE,
   tileId,
})
export const foundChain = chainId => ({
   type: ActionType.FOUND_CHAIN,
   chainId,
})
export const setControllingChain = chainId => ({
   type: ActionType.SET_CONTROLLING_CHAIN,
   chainId,
})
export const setDefunctChain = chainId => ({
   type: ActionType.SET_DEFUNCT_CHAIN,
   chainId,
})
export const buyStock = chains => ({
   type: ActionType.BUY_STOCK,
   chains,
})
export const handleDefunctStock = ({ sell, trade }) => ({
   type: ActionType.HANDLE_DEFUNCT_STOCK,
   sell,
   trade,
})
export const endTurn = () => ({ type: ActionType.END_TURN })
export const endGame = () => ({ type: ActionType.END_GAME })

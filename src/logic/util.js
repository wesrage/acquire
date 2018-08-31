export function getTileName(row, col) {
   return `${col + 1}${rowToLetter(row)}`
}

export function rowToLetter(row) {
   return String.fromCharCode(65 + row)
}

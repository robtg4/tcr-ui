import utils from 'ethers/utils'

// Trim to 3 trailing decimals
export const trimDecimalsThree = n =>
  (+n).toFixed(3).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1')
// Adds commas every 3 digits
export const withCommas = number => {
  let sides = []
  sides = number.toString().split('.')
  sides[0] = sides[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return sides.join('.')
}

// Random integer for salt
export const randInt = (min, max) => {
  if (max === undefined) {
    max = min
    min = 0
  }
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new TypeError('All args should have been numbers')
  }
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const getVoteSaltHash = (vote, salt) =>
  utils.solidityKeccak256(['uint', 'uint'], [vote, salt])

export const getListingHash = listing =>
  utils.solidityKeccak256(['string'], [listing])
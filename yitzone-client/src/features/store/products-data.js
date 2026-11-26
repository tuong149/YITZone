/**
 * @typedef {Object} StoreProductDetail
 * @property {string} shortSummary
 * @property {string} description
 * @property {string[]} highlights
 * @property {string} materialOrIngredients
 * @property {string} pickupNote
 * @property {string} exchangePolicy
 * @property {any} [sizeGuide]
 */

export const FACULTY_MERCH_PRODUCTS = [];

export const FUNDRAISING_XTN_PRODUCTS = [];

export const ALL_STORE_PRODUCTS = [];

export function getStoreProductById(productId) {
  if (!productId) return undefined;
  return ALL_STORE_PRODUCTS.find((p) => p.id === productId);
}

export function getRelatedStoreProducts(product, limit = 3) {
  return ALL_STORE_PRODUCTS.filter(
    (p) => p.id !== product.id && p.productType === product.productType
  ).slice(0, limit);
}

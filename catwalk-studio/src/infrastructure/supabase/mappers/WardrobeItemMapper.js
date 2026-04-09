import { WardrobeItem } from '../../../domain/entities/WardrobeItem.js';

/**
 * WardrobeItem Mapper
 * Maps between database rows (wardrobe_items table) and WardrobeItem entities
 *
 * Database columns → Entity props:
 *   item_id            → id
 *   user_id            → userId
 *   title              → title
 *   category           → category
 *   brand              → brand
 *   style              → style
 *   colour             → colour
 *   keywords           → keywords
 *   thumbnail_url      → thumbnailUrl
 *   high_res_image_url → highResImageUrl
 *   buy_url            → buyUrl
 *   is_stock           → isStock
 *   is_user_uploaded   → isUserUploaded
 *   image_id           → imageId
 *   alt_text           → altText
 *   colour_hex         → colourHex
 *   description        → description
 *   gender             → gender
 *   can_buy            → canBuy
 *   created_at         → createdAt
 *   updated_at         → updatedAt
 */
export class WardrobeItemMapper {
    /**
     * Convert database row to WardrobeItem entity
     * @param {Object} row - Database row from wardrobe_items table
     * @returns {WardrobeItem} WardrobeItem entity
     */
    static toDomain(row) {
        if (!row) return null;

        const props = {
            userId: row.user_id || null,
            title: row.title || '',
            category: row.category || null,
            brand: row.brand || null,
            style: row.style || null,
            colour: row.colour || null,
            keywords: row.keywords || [],
            thumbnailUrl: row.thumbnail_url || null,
            highResImageUrl: row.high_res_image_url || null,
            buyUrl: row.buy_url || null,
            isStock: row.is_stock || false,
            isUserUploaded: row.is_user_uploaded || false,
            imageId: row.image_id || null,
            altText: row.alt_text || null,
            colourHex: row.colour_hex || null,
            description: row.description || null,
            gender: row.gender || null,
            canBuy: row.can_buy || false,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
        };

        return WardrobeItem.create(props, row.item_id);
    }

    /**
     * Convert WardrobeItem entity to database row
     * @param {WardrobeItem} wardrobeItem - WardrobeItem entity
     * @param {boolean} [isUpdate=false] - Whether this is an update operation
     * @returns {Object} Database row for wardrobe_items table
     */
    static toDatabase(wardrobeItem, isUpdate = false) {
        const row = {
            title: wardrobeItem.title,
            category: wardrobeItem.category || null,
            brand: wardrobeItem.brand || null,
            style: wardrobeItem.style || null,
            colour: wardrobeItem.colour || null,
            keywords: wardrobeItem.keywords || [],
            thumbnail_url: wardrobeItem.thumbnailUrl || null,
            high_res_image_url: wardrobeItem.highResImageUrl || null,
            buy_url: wardrobeItem.buyUrl || null,
            is_stock: wardrobeItem.isStock,
            is_user_uploaded: wardrobeItem.isUserUploaded,
            image_id: wardrobeItem.imageId || null,
            alt_text: wardrobeItem.altText || null,
            colour_hex: wardrobeItem.colourHex || null,
            description: wardrobeItem.description || null,
            gender: wardrobeItem.gender || null,
            can_buy: wardrobeItem.canBuy,
            updated_at: new Date().toISOString(),
        };

        // Only include item_id for updates, let database generate UUID for new records
        if (isUpdate && wardrobeItem.id) {
            row.item_id = wardrobeItem.id;
        }

        if (wardrobeItem.userId) {
            row.user_id = wardrobeItem.userId;
        }

        return row;
    }
}

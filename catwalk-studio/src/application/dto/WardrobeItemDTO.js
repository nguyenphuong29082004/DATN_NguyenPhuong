/**
 * WardrobeItem Data Transfer Objects (DTOs)
 */

/**
 * WardrobeItem DTO
 * Used for returning wardrobe item data to the UI
 */
export class WardrobeItemDTO {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId || null;
        this.title = data.title;
        this.category = data.category;
        this.brand = data.brand || null;
        this.style = data.style || null;
        this.colour = data.colour || null;
        this.keywords = data.keywords || [];
        this.thumbnailUrl = data.thumbnailUrl || null;
        this.highResImageUrl = data.highResImageUrl || null;
        this.buyUrl = data.buyUrl || null;
        this.isStock = data.isStock || false;
        this.isUserUploaded = data.isUserUploaded || false;
        this.imageId = data.imageId || null;
        this.altText = data.altText || null;
        this.colourHex = data.colourHex || null;
        this.description = data.description || null;
        this.gender = data.gender || null;
        this.canBuy = data.canBuy || false;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(wardrobeItem) {
        return new WardrobeItemDTO({
            id: wardrobeItem.id,
            userId: wardrobeItem.userId,
            title: wardrobeItem.title,
            category: wardrobeItem.category,
            brand: wardrobeItem.brand,
            style: wardrobeItem.style,
            colour: wardrobeItem.colour,
            keywords: wardrobeItem.keywords,
            thumbnailUrl: wardrobeItem.thumbnailUrl,
            highResImageUrl: wardrobeItem.highResImageUrl,
            buyUrl: wardrobeItem.buyUrl,
            isStock: wardrobeItem.isStock,
            isUserUploaded: wardrobeItem.isUserUploaded,
            imageId: wardrobeItem.imageId,
            altText: wardrobeItem.altText,
            colourHex: wardrobeItem.colourHex,
            description: wardrobeItem.description,
            gender: wardrobeItem.gender,
            canBuy: wardrobeItem.canBuy,
            createdAt: wardrobeItem.createdAt,
            updatedAt: wardrobeItem.updatedAt,
        });
    }
}

export const colorsInfo = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Lime", hex: "#00FF00" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Yellow", hex: "#FFFF00" },
    { name: "Cyan", hex: "#00FFFF" },
    { name: "Magenta", hex: "#FF00FF" },
    { name: "Silver", hex: "#C0C0C0" },
    { name: "Gray", hex: "#808080" },
    { name: "Maroon", hex: "#800000" },
    { name: "Olive", hex: "#808000" },
    { name: "Green", hex: "#008000" },
    { name: "Purple", hex: "#800080" },
    { name: "Teal", hex: "#008080" },
    { name: "Navy Blue", hex: "#000080" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Brown", hex: "#A52A2A" },
    { name: "Pink", hex: "#FFC0CB" },
    { name: "Gold", hex: "#FFD700" },
    { name: "Beige", hex: "#F5F5DC" },
    { name: "Burgundy", hex: "#800020" },
    { name: "Coral", hex: "#FF7F50" },
    { name: "Ivory", hex: "#FFFFF0" },
    { name: "Khaki", hex: "#F0E68C" },
    { name: "Lavender", hex: "#E6E6FA" },
    { name: "Lilac", hex: "#C8A2C8" },
    { name: "Mint", hex: "#3EB489" },
    { name: "Mustard", hex: "#FFDB58" },
    { name: "Peach", hex: "#FFE5B4" },
    { name: "Plum", hex: "#DDA0DD" },
    { name: "Rose", hex: "#FF007F" },
    { name: "Ruby", hex: "#E0115F" },
    { name: "Sapphire", hex: "#0F52BA" },
    { name: "Emerald", hex: "#50C878" },
    { name: "Turquoise", hex: "#40E0D0" },
    { name: "Vanilla", hex: "#F3E5AB" },
    { name: "Charcoal", hex: "#36454F" },
    { name: "Cyan", hex: "#00B7EB" },
    { name: "Indigo", hex: "#4B0082" }
];

function hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function getNearestColorName(hexStr) {
    if (!hexStr) return '';
    const rgb = hexToRgb(hexStr);
    if (!rgb) return hexStr; // fallback to the input if invalid

    let minDistance = Infinity;
    let closestColor = hexStr; // fallback

    for (const color of colorsInfo) {
        const cRgb = hexToRgb(color.hex);
        if (!cRgb) continue;

        // Simple Euclidean distance in RGB space
        const distance = Math.pow(rgb.r - cRgb.r, 2) + Math.pow(rgb.g - cRgb.g, 2) + Math.pow(rgb.b - cRgb.b, 2);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color.name;
        }
    }

    return closestColor;
}

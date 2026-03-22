// Cuelinks removed — direct retailer URLs used instead
export function buildDirectRetailerUrl(
  retailer: string,
  garmentType: string,
  colorName: string,
): string {
  const q = encodeURIComponent(`${garmentType} ${colorName}`);
  const g = encodeURIComponent(garmentType);
  const cn = encodeURIComponent(colorName);
  switch (retailer) {
    case "amazon":
      return `https://www.amazon.in/s?k=${g}+${cn}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${g}+${cn}`;
    case "myntra":
      return `https://www.myntra.com/${g}?rawQuery=${q}`;
    case "ajio":
      return `https://www.ajio.com/search/?text=${q}`;
    case "meesho":
      return `https://www.meesho.com/search?q=${q}`;
    default:
      return `https://www.amazon.in/s?k=${q}`;
  }
}

/**
 * Menu utility helpers — shared across menu page components.
 * Extracted to avoid duplication (was copy-pasted 3x in menu/page.tsx).
 */

/**
 * Determines whether a category string represents a coffee-related category.
 * Used for determining which customization options (milk, sweetness) to show.
 */
export function isCoffeeCat(category: string): boolean {
  const lower = category.toLowerCase();
  return (
    lower.includes('coffee') ||
    lower.includes('espresso') ||
    lower.includes('milk-based') ||
    lower.includes('specialty') ||
    lower.includes('filter') ||
    lower.includes('pour-over') ||
    lower.includes('egyptian') ||
    lower.includes('traditional')
  );
}

/**
 * Determines whether a menu item supports milk customization
 * based on its category and tags.
 */
export function supportsMilk(category: string, tags: string[]): boolean {
  return (
    isCoffeeCat(category) ||
    category.toLowerCase().includes('tea') ||
    category.toLowerCase().includes('frappe') ||
    tags.includes('milk')
  );
}

/**
 * Determines whether a menu item supports sweetness customization
 * based on its category.
 */
export function supportsSweetness(category: string): boolean {
  const lower = category.toLowerCase();
  return (
    isCoffeeCat(lower) ||
    lower.includes('tea') ||
    lower.includes('frappe') ||
    lower.includes('juice') ||
    lower.includes('mojito') ||
    lower.includes('smoothie') ||
    lower.includes('cocktail') ||
    lower.includes('milkshake')
  );
}

/**
 * Returns a category description string based on keyword matching.
 * Used in the menu's category header sections.
 */
export function getCategoryDescription(category: string): string {
  const lower = category.toLowerCase();
  if (isCoffeeCat(lower)) return 'Artisanal roasts and classic blends.';
  if (lower.includes('tea')) return 'Fragrant infusions and aromatic spiced brews.';
  if (lower.includes('frappe')) return 'Sweet frosty blends of rich cream and flavor.';
  if (lower.includes('juice')) return 'Freshly squeezed premium raw fruits.';
  if (lower.includes('sweet') || lower.includes('corner') || lower.includes('حلويات')) {
    return 'Premium waffles, artisanal ice creams, and fresh yogurt creations.';
  }
  if (lower.includes('waffle')) return 'Warm golden delicacies with sweet premium toppings.';
  if (lower.includes('yogurt')) return 'Healthy light creations made fresh daily.';
  if (lower.includes('cocktail')) return 'Refreshing fruity blends to brighten your day.';
  if (lower.includes('milkshake')) return 'Rich, creamy shakes with premium toppings and flavors.';
  return 'Delectable curated choices for your pleasure.';
}

/**
 * Simple RAF-based scroll throttle.
 * Ensures the callback fires at most once per animation frame.
 */
export function throttleRAF(callback: () => void): () => void {
  let ticking = false;
  return () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
    }
  };
}

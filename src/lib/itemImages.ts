/**
 * Maps menu item English names (exact DB nameEn, lowercase) →
 * /public/items/<category>/<filename>.jpeg
 * Used by both the customer menu and admin inventory pages.
 */
const ITEM_IMAGE_MAP: Record<string, string> = {
  // ── Frappe ──
  'frappe vanilla':       '/items/frappe/frappe_vanilla.jpeg',
  'frappe caramel':       '/items/frappe/frappe_caramel.jpeg',
  'frappe mocha':         '/items/frappe/frappe_mocha.jpeg',
  'frappe nutella':       '/items/frappe/frappe_notilla.jpeg',
  'frappe hazelnut':      '/items/frappe/frappe_hazelnut.jpeg',
  'frappe lotus':         '/items/frappe/frappe_lotus.jpeg',
  'frappe pistachio':     '/items/frappe/fappe_psitachio.jpeg',
  'frappuchino classic':  '/items/frappe/frappuccino_classic.jpeg',
  'frappuccino classic':  '/items/frappe/frappuccino_classic.jpeg',
  'frappuchino flavor':   '/items/frappe/frappuccino_flavor.jpeg',
  'frappuccino flavor':   '/items/frappe/frappuccino_flavor.jpeg',

  // ── Smoothie ──
  'kiwi smoothie':              '/items/smoothie/kiwi_smoothie.jpeg',
  'mango smoothie':             '/items/smoothie/mango_smoothie.jpeg',
  'blue berry smoothie':        '/items/smoothie/blueberry_smoothie.jpeg',
  'blueberry smoothie':         '/items/smoothie/blueberry_smoothie.jpeg',
  'rasp berry smoothie':        '/items/smoothie/raspberry_smoothie.jpeg',
  'raspberry smoothie':         '/items/smoothie/raspberry_smoothie.jpeg',
  'passion fruit smoothie':     '/items/smoothie/passion_fruit_smoothie.jpeg',
  'strawberry smoothie':        '/items/smoothie/strawberry_smoothie.jpeg',
  'lemon smoothie':             '/items/smoothie/lemon_smoothie.jpeg',
  'lemon mint smoothie':        '/items/smoothie/lemon_mint_smoothie.jpeg',
  'blue lemon smoothie':        '/items/smoothie/blue_lemon_smoothie.jpeg',
  'pineapple smoothie':         '/items/smoothie/pineapple_smoothie.jpeg',
  'peach smoothie':             '/items/smoothie/peach_smoothie.jpeg',
  'watermelon smoothie':        '/items/smoothie/watermelon_smoothie.jpeg',
  'green apple smoothie':       '/items/smoothie/green_apple_smoothie.jpeg',
  // DB name: "Mango Passion Fruit"
  'mango passion fruit':        '/items/smoothie/mango_passion_fruit_smoothie.jpeg',
  'mango passion fruit smoothie': '/items/smoothie/mango_passion_fruit_smoothie.jpeg',
  // DB name: "Strawberry Watermelon"
  'strawberry watermelon':      '/items/smoothie/strawberry_watermelon_smoothie.jpeg',
  'strawberry watermelon smoothie': '/items/smoothie/strawberry_watermelon_smoothie.jpeg',

  // ── Tea & Herbs ──
  'tea':            '/items/tea_herbs/tea.jpeg',
  'flavor tea':     '/items/tea_herbs/tea_flavor.jpeg',
  'karak tea':      '/items/tea_herbs/karak_tea.jpeg',
  'green tea':      '/items/tea_herbs/green_tea.jpeg',
  'milk tea':       '/items/tea_herbs/milk_tea.jpeg',
  'herbal mix tea': '/items/tea_herbs/herbla_mix.jpeg',
  'herbal mix':     '/items/tea_herbs/herbla_mix.jpeg',
  'cinnamon milk':  '/items/tea_herbs/cinnamon_milk.jpeg',
  // DB name: "Lemon Herbs"
  'lemon herbs':    '/items/tea_herbs/lemon.jpeg',
  'lemon tea':      '/items/tea_herbs/lemon.jpeg',
  // DB name: "Anise"
  'anise':          '/items/tea_herbs/anise.jpeg',
  'anise tea':      '/items/tea_herbs/anise.jpeg',
  // DB name: "Ginger"
  'ginger':         '/items/tea_herbs/ginger.jpeg',
  'ginger tea':     '/items/tea_herbs/ginger.jpeg',
  'mint tea':       '/items/tea_herbs/mint.jpeg',

  // ── Fresh Juice ──
  'mango juice':          '/items/juice/mango_juice.jpeg',
  'strawberry juice':     '/items/juice/strawberry_juice.jpeg',
  'orange juice':         '/items/juice/orange_juice.jpeg',
  'kiwi juice':           '/items/juice/kiwi_juice.jpeg',
  'lemon juice':          '/items/juice/lemon_juice.jpeg',
  'lemon mint juice':     '/items/juice/lemon_mint_juice.jpeg',
  // DB name: "French Lemon"
  'french lemon':         '/items/juice/french_lemon_juice.jpeg',
  'french lemon juice':   '/items/juice/french_lemon_juice.jpeg',
  'watermelon juice':     '/items/juice/watermelon_juice.jpeg',
  'pomegranate juice':    '/items/juice/pomegranate_juice.jpeg',
  'banana milk':          '/items/juice/banana_milk_juice.jpeg',
  'dates milk':           '/items/juice/date_milk_juice.jpeg',
  'guava milk':           '/items/juice/guava_milk_juice.jpeg',
  'guava juice':          '/items/juice/guava_juice.jpeg',
  // DB name: "Strawberry Milk Juice"
  'strawberry milk juice':'/items/juice/strawberry_milk_juice.jpeg',
  'strawberry milk':      '/items/juice/strawberry_milk_juice.jpeg',
  'avocado juice':        '/items/juice/avocado_juice.jpeg',

  // ── Cocktails ──
  'blue lemon cocktail':    '/items/cocktails/blue_lemon.jpeg',
  // DB name: "Florida"
  'florida':                '/items/cocktails/florida.jpeg',
  'florida cocktail':       '/items/cocktails/florida.jpeg',
  // DB name: "Three Flowers"
  'three flowers':          '/items/cocktails/three_flowers.jpeg',
  'three flowers cocktail': '/items/cocktails/three_flowers.jpeg',
  // DB name: "Froment"
  'froment':                '/items/cocktails/froment.jpeg',
  'froment cocktail':       '/items/cocktails/froment.jpeg',
  // DB name: "Mango Energy"
  'mango energy':           '/items/cocktails/mango_energy.jpeg',
  'mango energy cocktail':  '/items/cocktails/mango_energy.jpeg',
  // DB name: "Lemus"
  'lemus':                  '/items/cocktails/lemus.jpeg',
  'lemus cocktail':         '/items/cocktails/lemus.jpeg',

  // ── Waffles ──
  'nutella waffle':         '/items/waffle/waffle_nutella.jpeg',
  'lotus waffle':           '/items/waffle/waffle_lotus.jpeg',
  'pistachio waffle':       '/items/waffle/waffle_pistachio.jpeg',
  'white chocolate waffle': '/items/waffle/waffle_white_chocolate.jpeg',
  'waffle mix sauce':       '/items/waffle/waffle_mixed.jpeg',

  // ── Yogurt ──
  'honey yogurt':  '/items/yogurt/honey_yogurt.jpeg',
  'flavor yogurt': '/items/yogurt/flavor_yogurt.jpeg',

  // ── Ice Cream ──
  'ice cream 2 scoop': '/items/ice_cream/2scoops.jpeg',
  'ice cream 3 scoop': '/items/ice_cream/3scoops.jpeg',
  'ice cream 4 scoop': '/items/ice_cream/4scoops.jpeg',
};

/**
 * Returns the best available image path for a menu item.
 * Priority: backend imageUrl → exact name match → partial name match → null
 */
export function getItemImage(nameEn: string, backendImageUrl?: string | null): string | null {
  if (backendImageUrl) return backendImageUrl;
  const key = nameEn.toLowerCase().trim();
  if (ITEM_IMAGE_MAP[key]) return ITEM_IMAGE_MAP[key];
  // Partial match (longest key wins to avoid false positives)
  let bestMatch: string | null = null;
  let bestLen = 0;
  for (const [k, v] of Object.entries(ITEM_IMAGE_MAP)) {
    if ((key.includes(k) || k.includes(key)) && k.length > bestLen) {
      bestMatch = v;
      bestLen = k.length;
    }
  }
  return bestMatch;
}

export default ITEM_IMAGE_MAP;

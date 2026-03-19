/* AIScan v9 — Nyckel AI + colour fallback */
const AIScan = (() => {
  console.log('[AIScan] ✅ v9 loaded — Nyckel AI');

  let _overlay   = null;
  let _imageData = null;
  let _stream    = null;

const DRINK_MAP = {

  // ═══════════════════════════════════════════════════════════════
  // WATER — all varieties
  // ═══════════════════════════════════════════════════════════════
  'water':                    { name:'Water',                  emoji:'💧', hydration:100, advice:'Pure hydration — the perfect choice!' },
  'plain water':              { name:'Plain Water',            emoji:'💧', hydration:100, advice:'Nothing beats plain water for hydration!' },
  'mineral water':            { name:'Mineral Water',          emoji:'💧', hydration:100, advice:'Rich in minerals, perfect hydration.' },
  'sparkling water':          { name:'Sparkling Water',        emoji:'💧', hydration:96,  advice:'Carbonation slightly reduces hydration rate.' },
  'carbonated water':         { name:'Carbonated Water',       emoji:'💧', hydration:96,  advice:'Bubbly but still very hydrating.' },
  'soda water':               { name:'Soda Water',             emoji:'💧', hydration:95,  advice:'Good hydration, watch sodium content.' },
  'tonic water':              { name:'Tonic Water',            emoji:'💧', hydration:80,  advice:'Contains sugar and quinine — moderate choice.' },
  'distilled water':          { name:'Distilled Water',        emoji:'💧', hydration:100, advice:'Pure H₂O — excellent hydration.' },
  'alkaline water':           { name:'Alkaline Water',         emoji:'💧', hydration:100, advice:'High pH water — very hydrating.' },
  'infused water':            { name:'Infused Water',          emoji:'💧', hydration:98,  advice:'Flavoured naturally — great hydration.' },
  'cucumber water':           { name:'Cucumber Water',         emoji:'💧', hydration:98,  advice:'Refreshing and very hydrating.' },
  'lemon water':              { name:'Lemon Water',            emoji:'🍋', hydration:97,  advice:'Great hydration with a vitamin C boost.' },
  'detox water':              { name:'Detox Water',            emoji:'💧', hydration:97,  advice:'Hydrating with added fruit benefits.' },
  'spring water':             { name:'Spring Water',           emoji:'💧', hydration:100, advice:'Natural spring water — perfect.' },
  'well water':               { name:'Well Water',             emoji:'💧', hydration:100, advice:'Natural water — excellent hydration.' },
  'ice water':                { name:'Ice Water',              emoji:'💧', hydration:100, advice:'Cold water — very refreshing and hydrating.' },
  'drinking fountain':        { name:'Fountain Water',         emoji:'💧', hydration:100, advice:'Fresh water — perfect choice!' },
  // Indian water brands
  'bisleri':                  { name:'Bisleri',                emoji:'💧', hydration:100, advice:'India\'s most trusted mineral water.' },
  'kinley':                   { name:'Kinley Water',           emoji:'💧', hydration:100, advice:'Coca-Cola\'s purified water brand.' },
  'aquafina':                 { name:'Aquafina',               emoji:'💧', hydration:100, advice:'PepsiCo\'s purified drinking water.' },
  'himalayan water':          { name:'Himalayan Water',        emoji:'💧', hydration:100, advice:'Natural mineral water from the Himalayas.' },
  'bailley':                  { name:'Bailey Water',           emoji:'💧', hydration:100, advice:'Parle\'s natural mineral water.' },
  'oxyrich':                  { name:'Oxyrich Water',          emoji:'💧', hydration:100, advice:'Oxygen-enriched water.' },
  'vedica':                   { name:'Vedica Water',           emoji:'💧', hydration:100, advice:'Natural Himalayan spring water.' },
  'evian':                    { name:'Evian',                  emoji:'💧', hydration:100, advice:'French natural spring water.' },
  'fiji water':               { name:'Fiji Water',             emoji:'💧', hydration:100, advice:'Natural artesian water from Fiji.' },
  'volvic':                   { name:'Volvic',                 emoji:'💧', hydration:100, advice:'French volcanic water — very pure.' },
  'perrier':                  { name:'Perrier',                emoji:'💧', hydration:96,  advice:'French sparkling mineral water.' },
  'san pellegrino':           { name:'San Pellegrino',         emoji:'💧', hydration:96,  advice:'Italian sparkling mineral water.' },

  // ═══════════════════════════════════════════════════════════════
  // TEA — all varieties
  // ═══════════════════════════════════════════════════════════════
  'tea':                      { name:'Tea',                    emoji:'🍵', hydration:90,  advice:'Excellent hydration with antioxidants.' },
  'black tea':                { name:'Black Tea',              emoji:'🍵', hydration:88,  advice:'Rich in antioxidants — moderate caffeine.' },
  'green tea':                { name:'Green Tea',              emoji:'🍵', hydration:92,  advice:'One of the most hydrating and healthy drinks.' },
  'white tea':                { name:'White Tea',              emoji:'🍵', hydration:93,  advice:'Delicate and very hydrating.' },
  'oolong tea':               { name:'Oolong Tea',             emoji:'🍵', hydration:90,  advice:'Semi-oxidised — great antioxidant drink.' },
  'herbal tea':               { name:'Herbal Tea',             emoji:'🌿', hydration:94,  advice:'Caffeine-free and very hydrating.' },
  'chamomile tea':            { name:'Chamomile Tea',          emoji:'🌸', hydration:95,  advice:'Calming and excellent for hydration.' },
  'peppermint tea':           { name:'Peppermint Tea',         emoji:'🌿', hydration:95,  advice:'Refreshing, caffeine-free, very hydrating.' },
  'ginger tea':               { name:'Ginger Tea',             emoji:'🫚', hydration:92,  advice:'Great for digestion and hydration.' },
  'lemon tea':                { name:'Lemon Tea',              emoji:'🍋', hydration:91,  advice:'Refreshing with vitamin C boost.' },
  'masala chai':              { name:'Masala Chai',            emoji:'🍵', hydration:82,  advice:'Spiced milk tea — moderate caffeine.' },
  'chai':                     { name:'Chai',                   emoji:'🍵', hydration:82,  advice:'Indian spiced tea — warming and hydrating.' },
  'adrak chai':               { name:'Adrak Chai',             emoji:'🍵', hydration:83,  advice:'Ginger tea — great for immunity and hydration.' },
  'tulsi tea':                { name:'Tulsi Tea',              emoji:'🌿', hydration:94,  advice:'Holy basil tea — excellent for health and hydration.' },
  'elaichi chai':             { name:'Elaichi Chai',           emoji:'🍵', hydration:82,  advice:'Cardamom tea — fragrant and hydrating.' },
  'kashmiri kahwa':           { name:'Kashmiri Kahwa',         emoji:'🍵', hydration:90,  advice:'Saffron-spiced Kashmiri green tea.' },
  'noon chai':                { name:'Noon Chai',              emoji:'🍵', hydration:82,  advice:'Kashmiri pink salty tea.' },
  'matcha':                   { name:'Matcha',                 emoji:'🍵', hydration:90,  advice:'Concentrated green tea — rich in antioxidants.' },
  'matcha latte':             { name:'Matcha Latte',           emoji:'🍵', hydration:82,  advice:'Matcha with milk — moderate hydration.' },
  'rooibos tea':              { name:'Rooibos Tea',            emoji:'🍵', hydration:95,  advice:'Caffeine-free South African tea — very hydrating.' },
  'hibiscus tea':             { name:'Hibiscus Tea',           emoji:'🌺', hydration:94,  advice:'Tart floral tea rich in antioxidants.' },
  'jasmine tea':              { name:'Jasmine Tea',            emoji:'🌸', hydration:91,  advice:'Floral green tea — very hydrating.' },
  'earl grey':                { name:'Earl Grey',              emoji:'🍵', hydration:88,  advice:'Bergamot-flavoured black tea.' },
  'darjeeling tea':           { name:'Darjeeling Tea',         emoji:'🍵', hydration:90,  advice:'India\'s prized tea — excellent flavour.' },
  'assam tea':                { name:'Assam Tea',              emoji:'🍵', hydration:88,  advice:'Strong Indian black tea.' },
  'nilgiri tea':              { name:'Nilgiri Tea',            emoji:'🍵', hydration:89,  advice:'South Indian blue mountain tea.' },
  'iced tea':                 { name:'Iced Tea',               emoji:'🥤', hydration:85,  advice:'Refreshing cold tea — great in summer.' },
  'lemon iced tea':           { name:'Lemon Iced Tea',         emoji:'🍋', hydration:83,  advice:'Refreshing but watch added sugar.' },
  'peach iced tea':           { name:'Peach Iced Tea',         emoji:'🍑', hydration:82,  advice:'Fruity iced tea — moderate hydration.' },
  'bubble tea':               { name:'Bubble Tea',             emoji:'🧋', hydration:70,  advice:'Tapioca pearls add calories — moderate hydration.' },
  'boba tea':                 { name:'Boba Tea',               emoji:'🧋', hydration:70,  advice:'Milk tea with pearls — tasty but sugary.' },
  'taro bubble tea':          { name:'Taro Bubble Tea',        emoji:'🧋', hydration:68,  advice:'Purple taro milk tea — high in sugar.' },
  'brown sugar boba':         { name:'Brown Sugar Boba',       emoji:'🧋', hydration:65,  advice:'High sugar content — have water alongside.' },

  // ═══════════════════════════════════════════════════════════════
  // COFFEE — all varieties
  // ═══════════════════════════════════════════════════════════════
  'coffee':                   { name:'Coffee',                 emoji:'☕', hydration:80,  advice:'Mild diuretic but still hydrating net.' },
  'black coffee':             { name:'Black Coffee',           emoji:'☕', hydration:78,  advice:'Strong and hydrating — no added calories.' },
  'espresso':                 { name:'Espresso',               emoji:'☕', hydration:75,  advice:'Concentrated — drink water alongside.' },
  'double espresso':          { name:'Double Espresso',        emoji:'☕', hydration:72,  advice:'Strong shot — pair with water.' },
  'americano':                { name:'Americano',              emoji:'☕', hydration:82,  advice:'Diluted espresso — good hydration.' },
  'latte':                    { name:'Latte',                  emoji:'☕', hydration:80,  advice:'Espresso with milk — moderate hydration.' },
  'cappuccino':               { name:'Cappuccino',             emoji:'☕', hydration:78,  advice:'Frothy espresso drink — moderate hydration.' },
  'macchiato':                { name:'Macchiato',              emoji:'☕', hydration:75,  advice:'Strong espresso with a touch of milk.' },
  'flat white':               { name:'Flat White',             emoji:'☕', hydration:79,  advice:'Rich espresso with steamed milk.' },
  'mocha':                    { name:'Mocha',                  emoji:'☕', hydration:74,  advice:'Coffee-chocolate — watch sugar content.' },
  'cold coffee':              { name:'Cold Coffee',            emoji:'🧋', hydration:75,  advice:'Refreshing — caffeine is mildly diuretic.' },
  'cold-coffee':              { name:'Cold Coffee',            emoji:'🧋', hydration:75,  advice:'Refreshing — caffeine is mildly diuretic.' },
  'iced coffee':              { name:'Iced Coffee',            emoji:'🧋', hydration:75,  advice:'Cold brew or iced latte — hydrating.' },
  'cold brew':                { name:'Cold Brew',              emoji:'🧋', hydration:76,  advice:'Smooth cold brew — less acidic.' },
  'frappuccino':              { name:'Frappuccino',            emoji:'🧋', hydration:68,  advice:'Blended coffee drink — high in sugar.' },
  'cafe au lait':             { name:'Café au Lait',           emoji:'☕', hydration:80,  advice:'Coffee with hot milk — good hydration.' },
  'cortado':                  { name:'Cortado',                emoji:'☕', hydration:76,  advice:'Balanced espresso and milk.' },
  'ristretto':                { name:'Ristretto',              emoji:'☕', hydration:72,  advice:'Short pull espresso — very concentrated.' },
  'lungo':                    { name:'Lungo',                  emoji:'☕', hydration:80,  advice:'Long pull espresso — more water.' },
  'affogato':                 { name:'Affogato',               emoji:'☕', hydration:60,  advice:'Espresso over ice cream — enjoy occasionally.' },
  'irish coffee':             { name:'Irish Coffee',           emoji:'☕', hydration:-10, advice:'Coffee with whiskey — alcohol dehydrates.' },
  'filter coffee':            { name:'Filter Coffee',          emoji:'☕', hydration:80,  advice:'South Indian drip coffee — classic.' },
  'south indian coffee':      { name:'South Indian Coffee',    emoji:'☕', hydration:79,  advice:'Filter kaapi — rich and aromatic.' },
  'kaapi':                    { name:'Filter Kaapi',           emoji:'☕', hydration:79,  advice:'Authentic South Indian filter coffee.' },
  'instant coffee':           { name:'Instant Coffee',         emoji:'☕', hydration:79,  advice:'Convenient — moderate hydration.' },
  'nescafe':                  { name:'Nescafé',                emoji:'☕', hydration:79,  advice:'Popular instant coffee brand.' },
  'bru coffee':               { name:'Bru Coffee',             emoji:'☕', hydration:79,  advice:'Chicory-blend coffee — South Indian favourite.' },
  'dalgona coffee':           { name:'Dalgona Coffee',         emoji:'☕', hydration:74,  advice:'Whipped coffee — watch sugar content.' },
  'Vietnamese iced coffee':   { name:'Vietnamese Iced Coffee', emoji:'☕', hydration:72,  advice:'Strong drip coffee with condensed milk.' },
  'turkish coffee':           { name:'Turkish Coffee',         emoji:'☕', hydration:72,  advice:'Very strong unfiltered coffee — drink water alongside.' },

  // ═══════════════════════════════════════════════════════════════
  // MILK — all varieties
  // ═══════════════════════════════════════════════════════════════
  'milk':                     { name:'Milk',                   emoji:'🥛', hydration:88,  advice:'Great hydration with protein and calcium.' },
  'whole milk':               { name:'Whole Milk',             emoji:'🥛', hydration:87,  advice:'Full-fat milk — nutritious and hydrating.' },
  'skim milk':                { name:'Skim Milk',              emoji:'🥛', hydration:90,  advice:'Low-fat milk — high water content.' },
  'low fat milk':             { name:'Low Fat Milk',           emoji:'🥛', hydration:89,  advice:'Lighter milk — good hydration.' },
  'toned milk':               { name:'Toned Milk',             emoji:'🥛', hydration:89,  advice:'Popular in India — good hydration.' },
  'double toned milk':        { name:'Double Toned Milk',      emoji:'🥛', hydration:90,  advice:'Lower fat, high water content.' },
  'buffalo milk':             { name:'Buffalo Milk',           emoji:'🥛', hydration:84,  advice:'Richer than cow milk — creamier texture.' },
  'cow milk':                 { name:'Cow Milk',               emoji:'🥛', hydration:88,  advice:'Classic dairy milk — well hydrating.' },
  'almond milk':              { name:'Almond Milk',            emoji:'🥛', hydration:91,  advice:'Low calorie plant milk — great hydration.' },
  'oat milk':                 { name:'Oat Milk',               emoji:'🥛', hydration:90,  advice:'Creamy plant milk — good hydration.' },
  'soy milk':                 { name:'Soy Milk',               emoji:'🥛', hydration:88,  advice:'Protein-rich plant milk.' },
  'rice milk':                { name:'Rice Milk',              emoji:'🥛', hydration:90,  advice:'Light plant milk — very hydrating.' },
  'coconut milk':             { name:'Coconut Milk',           emoji:'🥥', hydration:72,  advice:'Rich coconut flavour — moderate hydration.' },
  'cashew milk':              { name:'Cashew Milk',            emoji:'🥛', hydration:90,  advice:'Creamy plant-based milk.' },
  'hemp milk':                { name:'Hemp Milk',              emoji:'🥛', hydration:89,  advice:'Nutritious plant milk.' },
  'flax milk':                { name:'Flax Milk',              emoji:'🥛', hydration:90,  advice:'Omega-3 rich plant milk.' },
  'hot milk':                 { name:'Hot Milk',               emoji:'🥛', hydration:87,  advice:'Warm milk — comforting and hydrating.' },
  'flavoured milk':           { name:'Flavoured Milk',         emoji:'🥛', hydration:83,  advice:'Added sugar — moderate hydration.' },
  'chocolate milk':           { name:'Chocolate Milk',         emoji:'🍫', hydration:82,  advice:'Good post-workout recovery drink.' },
  'strawberry milk':          { name:'Strawberry Milk',        emoji:'🍓', hydration:83,  advice:'Sweet flavoured milk — moderate hydration.' },
  'condensed milk':           { name:'Condensed Milk',         emoji:'🥛', hydration:30,  advice:'Very high sugar — use sparingly.' },
  'evaporated milk':          { name:'Evaporated Milk',        emoji:'🥛', hydration:70,  advice:'Concentrated milk — dilute before drinking.' },
  'buttermilk':               { name:'Buttermilk',             emoji:'🥛', hydration:87,  advice:'Great natural probiotic hydration.' },
  'kefir':                    { name:'Kefir',                  emoji:'🥛', hydration:85,  advice:'Fermented milk — excellent for gut health.' },

  // ═══════════════════════════════════════════════════════════════
  // JUICES — Citrus
  // ═══════════════════════════════════════════════════════════════
  'juice':                    { name:'Juice',                  emoji:'🧃', hydration:85,  advice:'Good hydration — watch the sugar content.' },
  'orange juice':             { name:'Orange Juice',           emoji:'🍊', hydration:87,  advice:'Great hydration with vitamin C.' },
  'fresh orange juice':       { name:'Fresh Orange Juice',     emoji:'🍊', hydration:90,  advice:'Freshly squeezed — excellent nutrition.' },
  'mosambi juice':            { name:'Mosambi Juice',          emoji:'🍋', hydration:90,  advice:'Sweet lime juice — very hydrating and Indian favourite.' },
  'sweet lime juice':         { name:'Sweet Lime Juice',       emoji:'🍋', hydration:90,  advice:'Refreshing and hydrating citrus juice.' },
  'lemon juice':              { name:'Lemon Juice',            emoji:'🍋', hydration:90,  advice:'Vitamin C rich and very hydrating.' },
  'lime juice':               { name:'Lime Juice',             emoji:'🍋', hydration:90,  advice:'Tangy and refreshing.' },
  'grapefruit juice':         { name:'Grapefruit Juice',       emoji:'🍊', hydration:88,  advice:'Tart and hydrating with vitamin C.' },
  'tangerine juice':          { name:'Tangerine Juice',        emoji:'🍊', hydration:87,  advice:'Sweet citrus juice.' },
  'clementine juice':         { name:'Clementine Juice',       emoji:'🍊', hydration:87,  advice:'Sweet and easy to digest citrus juice.' },
  'kinnow juice':             { name:'Kinnow Juice',           emoji:'🍊', hydration:88,  advice:'Punjabi mandarin juice — very popular in North India.' },
  'pomelo juice':             { name:'Pomelo Juice',           emoji:'🍋', hydration:87,  advice:'Large citrus fruit juice — refreshing.' },

  // ─── Juices — Tropical ───
  'mango juice':              { name:'Mango Juice',            emoji:'🥭', hydration:83,  advice:'King of fruits — hydrating but sugary.' },
  'mango drink':              { name:'Mango Drink',            emoji:'🥭', hydration:75,  advice:'Fruity but sugary — have water too.' },
  'mango lassi':              { name:'Mango Lassi',            emoji:'🥭', hydration:80,  advice:'Mango yogurt drink — popular and hydrating.' },
  'pineapple juice':          { name:'Pineapple Juice',        emoji:'🍍', hydration:87,  advice:'Tropical and hydrating — watch sugar.' },
  'guava juice':              { name:'Guava Juice',            emoji:'🍈', hydration:86,  advice:'High in vitamin C — very hydrating.' },
  'papaya juice':             { name:'Papaya Juice',           emoji:'🍈', hydration:88,  advice:'Digestive enzymes and great hydration.' },
  'coconut water':            { name:'Coconut Water',          emoji:'🥥', hydration:95,  advice:'Excellent natural electrolyte drink.' },
  'tender coconut':           { name:'Tender Coconut Water',   emoji:'🥥', hydration:97,  advice:'Best natural electrolyte drink available.' },
  'passion fruit juice':      { name:'Passion Fruit Juice',    emoji:'🍈', hydration:85,  advice:'Exotic and hydrating.' },
  'lychee juice':             { name:'Lychee Juice',           emoji:'🍈', hydration:84,  advice:'Sweet tropical juice.' },
  'jackfruit juice':          { name:'Jackfruit Juice',        emoji:'🍈', hydration:83,  advice:'Tropical fruit juice — nutritious.' },
  'dragon fruit juice':       { name:'Dragon Fruit Juice',     emoji:'🍈', hydration:88,  advice:'Exotic antioxidant-rich juice.' },
  'starfruit juice':          { name:'Starfruit Juice',        emoji:'⭐', hydration:87,  advice:'Tangy tropical juice.' },
  'watermelon juice':         { name:'Watermelon Juice',       emoji:'🍉', hydration:96,  advice:'95% water — one of the most hydrating juices!' },
  'cucumber juice':           { name:'Cucumber Juice',         emoji:'🥒', hydration:97,  advice:'Almost pure water — supremely hydrating.' },

  // ─── Juices — Berry ───
  'apple juice':              { name:'Apple Juice',            emoji:'🍎', hydration:86,  advice:'Good hydration — watch added sugar.' },
  'grape juice':              { name:'Grape Juice',            emoji:'🍇', hydration:84,  advice:'Rich in antioxidants — moderate hydration.' },
  'pomegranate juice':        { name:'Pomegranate Juice',      emoji:'❤️', hydration:83,  advice:'Antioxidant powerhouse — great for health.' },
  'cranberry juice':          { name:'Cranberry Juice',        emoji:'🫐', hydration:82,  advice:'Great for urinary health — tart and hydrating.' },
  'blueberry juice':          { name:'Blueberry Juice',        emoji:'🫐', hydration:85,  advice:'Rich in antioxidants.' },
  'strawberry juice':         { name:'Strawberry Juice',       emoji:'🍓', hydration:88,  advice:'High vitamin C — very hydrating.' },
  'cherry juice':             { name:'Cherry Juice',           emoji:'🍒', hydration:85,  advice:'Great for muscle recovery and hydration.' },
  'blackcurrant juice':       { name:'Blackcurrant Juice',     emoji:'🫐', hydration:84,  advice:'Very high vitamin C content.' },
  'mixed berry juice':        { name:'Mixed Berry Juice',      emoji:'🫐', hydration:85,  advice:'Antioxidant-rich blend.' },
  'acai juice':               { name:'Açaí Juice',             emoji:'🫐', hydration:82,  advice:'Superfood juice — rich in antioxidants.' },
  'noni juice':               { name:'Noni Juice',             emoji:'🍈', hydration:80,  advice:'Wellness juice — strong flavour.' },
  'amla juice':               { name:'Amla Juice',             emoji:'🟢', hydration:87,  advice:'Indian gooseberry — very high vitamin C.' },
  'aloe vera juice':          { name:'Aloe Vera Juice',        emoji:'🌵', hydration:94,  advice:'Soothing and highly hydrating.' },
  'wheatgrass juice':         { name:'Wheatgrass Juice',       emoji:'🌿', hydration:93,  advice:'Detoxifying and hydrating green juice.' },

  // ─── Juices — Vegetable ───
  'vegetable juice':          { name:'Vegetable Juice',        emoji:'🥤', hydration:90,  advice:'Nutritious and very hydrating.' },
  'tomato juice':             { name:'Tomato Juice',           emoji:'🍅', hydration:88,  advice:'Rich in lycopene — hydrating.' },
  'carrot juice':             { name:'Carrot Juice',           emoji:'🥕', hydration:89,  advice:'Beta-carotene rich — great for health.' },
  'beetroot juice':           { name:'Beetroot Juice',         emoji:'❤️', hydration:88,  advice:'Great for stamina and blood health.' },
  'spinach juice':            { name:'Spinach Juice',          emoji:'🥬', hydration:92,  advice:'Iron-rich green juice.' },
  'celery juice':             { name:'Celery Juice',           emoji:'🌿', hydration:95,  advice:'Trending wellness juice — very hydrating.' },
  'bitter gourd juice':       { name:'Bitter Gourd Juice',     emoji:'🥒', hydration:92,  advice:'Karela juice — great for blood sugar.' },
  'ash gourd juice':          { name:'Ash Gourd Juice',        emoji:'🥒', hydration:95,  advice:'Petha juice — highly hydrating, ayurvedic.' },
  'green juice':              { name:'Green Juice',            emoji:'🥬', hydration:92,  advice:'Vegetable blend — nutritious and hydrating.' },

  // ─── Indian Packaged Juices / Drinks ───
  'frooti':                   { name:'Frooti',                 emoji:'🥭', hydration:72,  advice:'Parle\'s mango drink — moderate hydration.' },
  'maaza':                    { name:'Maaza',                  emoji:'🥭', hydration:70,  advice:'Coca-Cola\'s mango nectar drink.' },
  'slice':                    { name:'Slice',                  emoji:'🥭', hydration:70,  advice:'PepsiCo\'s mango drink with added sugar.' },
  'real juice':               { name:'Real Juice',             emoji:'🧃', hydration:80,  advice:'Dabur\'s packaged juice — watch sugar content.' },
  'tropicana':                { name:'Tropicana',              emoji:'🍊', hydration:82,  advice:'PepsiCo\'s fruit juice range.' },
  'minute maid':              { name:'Minute Maid',            emoji:'🍊', hydration:82,  advice:'Coca-Cola\'s juice drink.' },
  'paper boat':               { name:'Paper Boat',             emoji:'🍹', hydration:78,  advice:'Traditional Indian drink brand.' },
  'b natural':                { name:'B Natural',              emoji:'🧃', hydration:82,  advice:'ITC\'s fruit juice — no added preservatives.' },
  'raw pressery':             { name:'Raw Pressery',           emoji:'🧃', hydration:85,  advice:'Cold-pressed juice — very nutritious.' },
  'appy fizz':                { name:'Appy Fizz',              emoji:'🍎', hydration:60,  advice:'Sparkling apple drink — limited hydration.' },
  'appy':                     { name:'Appy',                   emoji:'🍎', hydration:75,  advice:'Apple drink from Parle.' },
  'jumpin':                   { name:'Jumpin',                 emoji:'🧃', hydration:75,  advice:'Godrej\'s fruit drink.' },
  'onjus':                    { name:'Onjus',                  emoji:'🍊', hydration:80,  advice:'Dabur\'s orange juice.' },

  // ═══════════════════════════════════════════════════════════════
  // SMOOTHIES & SHAKES
  // ═══════════════════════════════════════════════════════════════
  'smoothie':                 { name:'Smoothie',               emoji:'🥤', hydration:85,  advice:'Nutritious and hydrating blend.' },
  'fruit smoothie':           { name:'Fruit Smoothie',         emoji:'🥤', hydration:85,  advice:'Great hydration with natural sugars.' },
  'green smoothie':           { name:'Green Smoothie',         emoji:'🥬', hydration:88,  advice:'Vegetable-fruit blend — very nutritious.' },
  'berry smoothie':           { name:'Berry Smoothie',         emoji:'🫐', hydration:86,  advice:'Antioxidant-rich and hydrating.' },
  'mango smoothie':           { name:'Mango Smoothie',         emoji:'🥭', hydration:82,  advice:'Tropical smoothie — moderate hydration.' },
  'banana smoothie':          { name:'Banana Smoothie',        emoji:'🍌', hydration:78,  advice:'Energy-rich — moderate hydration.' },
  'avocado smoothie':         { name:'Avocado Smoothie',       emoji:'🥑', hydration:75,  advice:'Healthy fats — moderate hydration.' },
  'spinach smoothie':         { name:'Spinach Smoothie',       emoji:'🥬', hydration:88,  advice:'Iron-rich green smoothie.' },
  'kale smoothie':            { name:'Kale Smoothie',          emoji:'🥬', hydration:87,  advice:'Nutritious and hydrating.' },
  'protein smoothie':         { name:'Protein Smoothie',       emoji:'🥤', hydration:78,  advice:'Post-workout blend — watch sugar.' },
  'acai bowl smoothie':       { name:'Açaí Smoothie',          emoji:'🫐', hydration:82,  advice:'Superfood smoothie.' },
  'peanut butter smoothie':   { name:'Peanut Butter Smoothie', emoji:'🥜', hydration:70,  advice:'Calorie-dense — drink water alongside.' },
  'milkshake':                { name:'Milkshake',              emoji:'🥛', hydration:70,  advice:'Milk-based but sugary — moderate hydration.' },
  'chocolate milkshake':      { name:'Chocolate Milkshake',    emoji:'🍫', hydration:68,  advice:'Treat drink — have water alongside.' },
  'strawberry milkshake':     { name:'Strawberry Milkshake',   emoji:'🍓', hydration:70,  advice:'Fruity shake — moderate hydration.' },
  'vanilla milkshake':        { name:'Vanilla Milkshake',      emoji:'🍦', hydration:70,  advice:'Classic shake — moderate hydration.' },
  'mango milkshake':          { name:'Mango Milkshake',        emoji:'🥭', hydration:71,  advice:'Indian summer favourite.' },
  'banana milkshake':         { name:'Banana Milkshake',       emoji:'🍌', hydration:69,  advice:'Energy-dense shake.' },
  'oreo milkshake':           { name:'Oreo Milkshake',         emoji:'🍫', hydration:62,  advice:'Indulgent treat — drink water alongside.' },
  'pineapple milkshake':      { name:'Pineapple Milkshake',    emoji:'🍍', hydration:71,  advice:'Tropical shake.' },
  'protein shake':            { name:'Protein Shake',          emoji:'🥤', hydration:75,  advice:'Good post-workout but watch sugar content.' },
  'whey shake':               { name:'Whey Shake',             emoji:'🥤', hydration:75,  advice:'Muscle recovery drink — hydrating.' },
  'meal replacement shake':   { name:'Meal Replacement Shake', emoji:'🥤', hydration:72,  advice:'Nutrient-dense — drink water alongside.' },
  'herbalife shake':          { name:'Herbalife Shake',        emoji:'🥤', hydration:72,  advice:'Nutrition shake — drink water alongside.' },
  'slim fast':                { name:'SlimFast Shake',         emoji:'🥤', hydration:72,  advice:'Meal replacement — stay hydrated.' },

  // ═══════════════════════════════════════════════════════════════
  // INDIAN TRADITIONAL DRINKS
  // ═══════════════════════════════════════════════════════════════
  'lassi':                    { name:'Lassi',                  emoji:'🥛', hydration:85,  advice:'Probiotic-rich yogurt drink — well hydrating.' },
  'sweet lassi':              { name:'Sweet Lassi',            emoji:'🥛', hydration:82,  advice:'Sweetened yogurt drink — Punjabi classic.' },
  'salted lassi':             { name:'Salted Lassi',           emoji:'🥛', hydration:88,  advice:'Electrolytes from salt — very hydrating.' },
  'plain lassi':              { name:'Plain Lassi',            emoji:'🥛', hydration:87,  advice:'Simple yogurt drink — great hydration.' },
  'chaas':                    { name:'Chaas',                  emoji:'🥛', hydration:90,  advice:'Spiced buttermilk — excellent for cooling.' },
  'masala chaas':             { name:'Masala Chaas',           emoji:'🥛', hydration:90,  advice:'Spiced buttermilk — great for digestion.' },
  'nimbu pani':               { name:'Nimbu Pani',             emoji:'🍋', hydration:92,  advice:'Indian lemonade — excellent natural hydration.' },
  'shikanji':                 { name:'Shikanji',               emoji:'🍋', hydration:91,  advice:'Spiced lemonade — popular North Indian drink.' },
  'jaljeera':                 { name:'Jaljeera',               emoji:'💧', hydration:90,  advice:'Cumin spiced water — great for digestion.' },
  'aam panna':                { name:'Aam Panna',              emoji:'🥭', hydration:87,  advice:'Raw mango drink — great summer coolant.' },
  'thandai':                  { name:'Thandai',                emoji:'🥛', hydration:82,  advice:'Holi special milk-based cooling drink.' },
  'bhaang thandai':           { name:'Bhaang Thandai',         emoji:'🥛', hydration:75,  advice:'Festive drink — consume very responsibly.' },
  'sharbat':                  { name:'Sharbat',                emoji:'🍹', hydration:80,  advice:'Sweet syrup drink — moderately hydrating.' },
  'rooh afza':                { name:'Rooh Afza',              emoji:'🌹', hydration:78,  advice:'Rose-based sharbat — popular in Ramadan.' },
  'rooh afza milk':           { name:'Rooh Afza Milk',         emoji:'🌹', hydration:82,  advice:'Rose syrup with milk — cooling drink.' },
  'sugarcane juice':          { name:'Sugarcane Juice',        emoji:'🌿', hydration:90,  advice:'Natural electrolytes — great hydration.' },
  'fresh sugarcane juice':    { name:'Fresh Sugarcane Juice',  emoji:'🌿', hydration:92,  advice:'Street-fresh — instantly energising.' },
  'sol kadhi':                { name:'Sol Kadhi',              emoji:'🌸', hydration:88,  advice:'Kokum and coconut milk drink from Goa/Maharashtra.' },
  'kokum juice':              { name:'Kokum Juice',            emoji:'🌸', hydration:88,  advice:'Cooling summer drink from Konkan coast.' },
  'kokum sharbat':            { name:'Kokum Sharbat',          emoji:'🌸', hydration:85,  advice:'Sweet-sour cooling drink.' },
  'kanji':                    { name:'Kanji',                  emoji:'🟣', hydration:88,  advice:'Fermented carrot drink — probiotic and hydrating.' },
  'gajar kanji':              { name:'Gajar Kanji',            emoji:'🥕', hydration:88,  advice:'Fermented black carrot drink — Holi special.' },
  'panakam':                  { name:'Panakam',                emoji:'💛', hydration:88,  advice:'Jaggery and ginger drink — Tamil Nadu temple offering.' },
  'nannari sharbat':          { name:'Nannari Sharbat',        emoji:'🌿', hydration:87,  advice:'Indian sarsaparilla root drink — cooling.' },
  'piyush':                   { name:'Piyush',                 emoji:'🥛', hydration:83,  advice:'Sweet yogurt and cream drink from Maharashtra.' },
  'mastani':                  { name:'Mastani',                emoji:'🍓', hydration:72,  advice:'Pune\'s famous fruit milkshake with ice cream.' },
  'falooda':                  { name:'Falooda',                emoji:'🌹', hydration:70,  advice:'Rose-milk dessert drink — occasional treat.' },
  'rose falooda':             { name:'Rose Falooda',           emoji:'🌹', hydration:70,  advice:'Rose-flavoured falooda — festive favourite.' },
  'basil seed drink':         { name:'Basil Seed Drink',       emoji:'🌿', hydration:92,  advice:'Sabja seeds expand with water — very hydrating.' },
  'sattu drink':              { name:'Sattu Drink',            emoji:'💛', hydration:85,  advice:'Roasted gram flour drink — Bihar/UP staple.' },
  'sattu sharbat':            { name:'Sattu Sharbat',          emoji:'💛', hydration:87,  advice:'Natural cooling energy drink.' },
  'aam ras':                  { name:'Aam Ras',                emoji:'🥭', hydration:80,  advice:'Pure mango pulp — thick and nutritious.' },
  'panha':                    { name:'Panha',                  emoji:'🥭', hydration:87,  advice:'Maharashtra\'s raw mango drink — great coolant.' },
  'jal zeera':                { name:'Jal Zeera',              emoji:'💧', hydration:90,  advice:'Spiced water — digestive and hydrating.' },
  'bel sherbet':              { name:'Bel Sherbet',            emoji:'🍈', hydration:88,  advice:'Wood apple drink — great for summers.' },
  'imli pani':                { name:'Imli Pani',              emoji:'🍫', hydration:82,  advice:'Tamarind water — tangy and cooling.' },
  'tamarind juice':           { name:'Tamarind Juice',         emoji:'🍫', hydration:82,  advice:'Tangy tamarind — digestive benefits.' },
  'rose milk':                { name:'Rose Milk',              emoji:'🌹', hydration:82,  advice:'Rose syrup and milk — cooling summer drink.' },
  'badam milk':               { name:'Badam Milk',             emoji:'🥛', hydration:80,  advice:'Almond milk with saffron — nutritious.' },
  'haldi doodh':              { name:'Haldi Doodh',            emoji:'💛', hydration:82,  advice:'Turmeric golden milk — anti-inflammatory.' },
  'golden milk':              { name:'Golden Milk',            emoji:'💛', hydration:82,  advice:'Turmeric latte — excellent wellness drink.' },
  'kesar milk':               { name:'Kesar Milk',             emoji:'💛', hydration:82,  advice:'Saffron milk — luxurious and nutritious.' },
  'ashwagandha milk':         { name:'Ashwagandha Milk',       emoji:'🌿', hydration:82,  advice:'Adaptogen milk — great for stress and sleep.' },
  'brahmi juice':             { name:'Brahmi Juice',           emoji:'🌿', hydration:88,  advice:'Ayurvedic herb juice — brain tonic.' },
  'triphala juice':           { name:'Triphala Juice',         emoji:'🌿', hydration:85,  advice:'Ayurvedic herbal juice — digestive health.' },
  'giloy juice':              { name:'Giloy Juice',            emoji:'🌿', hydration:88,  advice:'Immunity-boosting Ayurvedic drink.' },
  'neem juice':               { name:'Neem Juice',             emoji:'🌿', hydration:87,  advice:'Bitter Ayurvedic detox — powerful health benefits.' },
  'karela juice':             { name:'Karela Juice',           emoji:'🥒', hydration:90,  advice:'Bitter gourd — excellent for blood sugar.' },
  'lauki juice':              { name:'Lauki Juice',            emoji:'🥒', hydration:95,  advice:'Bottle gourd — very hydrating and cooling.' },

  // ═══════════════════════════════════════════════════════════════
  // YOGURT DRINKS
  // ═══════════════════════════════════════════════════════════════
  'yogurt drink':             { name:'Yogurt Drink',           emoji:'🥛', hydration:85,  advice:'Probiotic-rich and hydrating.' },
  'yakult':                   { name:'Yakult',                 emoji:'🥛', hydration:85,  advice:'Probiotic drink — beneficial gut bacteria.' },
  'activ8':                   { name:'Activ8',                 emoji:'🥛', hydration:83,  advice:'Probiotic dairy drink.' },
  'activia drink':            { name:'Activia Drink',          emoji:'🥛', hydration:83,  advice:'Danone probiotic drink.' },
  'ayran':                    { name:'Ayran',                  emoji:'🥛', hydration:90,  advice:'Turkish salted yogurt drink — very hydrating.' },
  'doogh':                    { name:'Doogh',                  emoji:'🥛', hydration:90,  advice:'Persian yogurt drink — refreshing.' },
  'kefir drink':              { name:'Kefir Drink',            emoji:'🥛', hydration:85,  advice:'Fermented dairy — gut health benefits.' },
  'probiotic drink':          { name:'Probiotic Drink',        emoji:'🥛', hydration:85,  advice:'Good for gut health.' },

  // ═══════════════════════════════════════════════════════════════
  // SODAS & CARBONATED DRINKS
  // ═══════════════════════════════════════════════════════════════
  'soda':                     { name:'Soda',                   emoji:'🥤', hydration:55,  advice:'Sugar and carbonation reduce hydration value.' },
  'cola':                     { name:'Cola',                   emoji:'🥫', hydration:55,  advice:'Caffeine is mildly diuretic — balance with water.' },
  'coca cola':                { name:'Coca-Cola',              emoji:'🥫', hydration:55,  advice:'Classic cola — caffeine and sugar.' },
  'coke':                     { name:'Coke',                   emoji:'🥫', hydration:55,  advice:'High caffeine cola — drink water alongside.' },
  'diet coke':                { name:'Diet Coke',              emoji:'🥫', hydration:57,  advice:'Zero sugar but caffeine — drink water too.' },
  'coke zero':                { name:'Coke Zero',              emoji:'🥫', hydration:57,  advice:'Zero sugar cola — moderate choice.' },
  'pepsi':                    { name:'Pepsi',                  emoji:'🥤', hydration:55,  advice:'Cola drink — moderate caffeine.' },
  'diet pepsi':               { name:'Diet Pepsi',             emoji:'🥤', hydration:57,  advice:'Zero calorie cola.' },
  'pepsi black':              { name:'Pepsi Black',            emoji:'🥤', hydration:55,  advice:'Strong cola flavour.' },
  'thums up':                 { name:'Thums Up',               emoji:'🥤', hydration:50,  advice:'High caffeine Indian cola — drink water too.' },
  'sprite':                   { name:'Sprite',                 emoji:'🍋', hydration:58,  advice:'Lemon-lime soda — carbonation limits absorption.' },
  'sprite zero':              { name:'Sprite Zero',            emoji:'🍋', hydration:60,  advice:'Zero calorie lemon soda.' },
  '7up':                      { name:'7UP',                    emoji:'🍋', hydration:58,  advice:'Crisp lemon-lime soda.' },
  'mountain dew':             { name:'Mountain Dew',           emoji:'🍋', hydration:52,  advice:'Very high caffeine — drink water alongside.' },
  'fanta':                    { name:'Fanta',                  emoji:'🍊', hydration:55,  advice:'Sugary carbonated drink — moderate hydration.' },
  'fanta orange':             { name:'Fanta Orange',           emoji:'🍊', hydration:55,  advice:'Orange soda — watch sugar.' },
  'fanta grape':              { name:'Fanta Grape',            emoji:'🍇', hydration:55,  advice:'Grape soda.' },
  'limca':                    { name:'Limca',                  emoji:'🍋', hydration:55,  advice:'Coca-Cola\'s lemon soda — Indian favourite.' },
  'mirinda':                  { name:'Mirinda',                emoji:'🍊', hydration:55,  advice:'PepsiCo\'s orange soda.' },
  'mirinda lemon':            { name:'Mirinda Lemon',          emoji:'🍋', hydration:55,  advice:'Lemon-flavoured soda.' },
  'canada dry':               { name:'Canada Dry',             emoji:'💧', hydration:60,  advice:'Ginger ale — mild and refreshing.' },
  'ginger ale':               { name:'Ginger Ale',             emoji:'💧', hydration:62,  advice:'Settling for nausea — moderate hydration.' },
  'dr pepper':                { name:'Dr Pepper',              emoji:'🥤', hydration:53,  advice:'Unique spiced cola flavour.' },
  'root beer':                { name:'Root Beer',              emoji:'🥤', hydration:55,  advice:'Sassafras-flavoured soda.' },
  'cream soda':               { name:'Cream Soda',             emoji:'🥤', hydration:55,  advice:'Sweet vanilla soda.' },
  'grapefruit soda':          { name:'Grapefruit Soda',        emoji:'🍊', hydration:57,  advice:'Bitter-sweet citrus soda.' },
  'kombucha':                 { name:'Kombucha',               emoji:'🍵', hydration:82,  advice:'Fermented tea — great probiotics.' },
  'jun tea':                  { name:'Jun Tea',                emoji:'🍵', hydration:82,  advice:'Honey green tea kombucha.' },

  // ═══════════════════════════════════════════════════════════════
  // ENERGY & SPORTS DRINKS
  // ═══════════════════════════════════════════════════════════════
  'energy drink':             { name:'Energy Drink',           emoji:'⚡', hydration:60,  advice:'High caffeine — drink water too.' },
  'red bull':                 { name:'Red Bull',               emoji:'⚡', hydration:58,  advice:'Caffeine + taurine — follow with water.' },
  'red bull sugar free':      { name:'Red Bull Sugar Free',    emoji:'⚡', hydration:60,  advice:'Zero sugar but still caffeinated.' },
  'monster':                  { name:'Monster Energy',         emoji:'⚡', hydration:55,  advice:'Very high caffeine — stay hydrated.' },
  'monster ultra':            { name:'Monster Ultra',          emoji:'⚡', hydration:58,  advice:'Zero sugar energy drink.' },
  'rockstar':                 { name:'Rockstar Energy',        emoji:'⚡', hydration:55,  advice:'High caffeine energy drink.' },
  'bang energy':              { name:'Bang Energy',            emoji:'⚡', hydration:55,  advice:'Extreme caffeine — not for kids.' },
  'reign energy':             { name:'Reign Energy',           emoji:'⚡', hydration:55,  advice:'High performance energy drink.' },
  'celsius':                  { name:'Celsius',                emoji:'⚡', hydration:60,  advice:'Fitness energy drink.' },
  '5 hour energy':            { name:'5-Hour Energy',          emoji:'⚡', hydration:55,  advice:'Concentrated caffeine shot — drink water.' },
  'prime energy':             { name:'Prime Energy',           emoji:'⚡', hydration:62,  advice:'Caffeinated energy drink — watch intake.' },
  'sting':                    { name:'Sting Energy',           emoji:'⚡', hydration:58,  advice:'PepsiCo\'s energy drink — popular in India.' },
  'thunderbolt':              { name:'Thunderbolt',            emoji:'⚡', hydration:58,  advice:'Coca-Cola\'s energy drink for India.' },
  'cloud 9':                  { name:'Cloud 9',                emoji:'⚡', hydration:57,  advice:'Indian energy drink brand.' },
  'charged':                  { name:'Charged',                emoji:'⚡', hydration:57,  advice:'Rum-based energy drink variant.' },
  'sports drink':             { name:'Sports Drink',           emoji:'⚡', hydration:92,  advice:'Good for post-workout rehydration.' },
  'gatorade':                 { name:'Gatorade',               emoji:'⚡', hydration:93,  advice:'Electrolyte drink — great post-workout.' },
  'gatorade zero':            { name:'Gatorade Zero',          emoji:'⚡', hydration:94,  advice:'Zero sugar electrolyte drink.' },
  'powerade':                 { name:'Powerade',               emoji:'⚡', hydration:92,  advice:'Coca-Cola\'s sports drink.' },
  'pocari sweat':             { name:'Pocari Sweat',           emoji:'⚡', hydration:93,  advice:'Japanese electrolyte drink — excellent rehydration.' },
  'electrolit':               { name:'Electrolit',             emoji:'⚡', hydration:94,  advice:'Medical-grade electrolyte drink.' },
  'pedialyte':                { name:'Pedialyte',              emoji:'⚡', hydration:95,  advice:'Excellent rehydration — great for illness recovery.' },
  'ora hydration':            { name:'ORS',                    emoji:'⚡', hydration:97,  advice:'Oral rehydration salts — best for dehydration.' },
  'ors':                      { name:'ORS Drink',              emoji:'💧', hydration:97,  advice:'Oral rehydration solution — clinically proven.' },
  'electral':                 { name:'Electral',               emoji:'💧', hydration:97,  advice:'Popular ORS brand in India.' },
  'prime hydration':          { name:'Prime Hydration',        emoji:'⚡', hydration:94,  advice:'Electrolyte hydration drink.' },
  'lucozade':                 { name:'Lucozade Sport',         emoji:'⚡', hydration:88,  advice:'UK sports drink — good hydration.' },

  // ═══════════════════════════════════════════════════════════════
  // MALT & HEALTH DRINKS (Indian)
  // ═══════════════════════════════════════════════════════════════
  'horlicks':                 { name:'Horlicks',               emoji:'🥛', hydration:80,  advice:'GSK\'s malt milk drink — good hydration.' },
  'boost':                    { name:'Boost',                  emoji:'🥛', hydration:80,  advice:'GSK\'s chocolate malt drink — popular in South India.' },
  'bournvita':                { name:'Bournvita',              emoji:'🍫', hydration:78,  advice:'Cadbury\'s chocolate malt drink.' },
  'complan':                  { name:'Complan',                emoji:'🥛', hydration:80,  advice:'Heinz\'s milk-based nutrition drink.' },
  'milo':                     { name:'Milo',                   emoji:'🍫', hydration:79,  advice:'Nestlé\'s chocolate malt drink — popular globally.' },
  'ovaltine':                 { name:'Ovaltine',               emoji:'🍫', hydration:79,  advice:'Swiss malt nutrition drink.' },
  'pediasure':                { name:'PediaSure',              emoji:'🥛', hydration:80,  advice:'Children\'s nutrition drink.' },
  'ensure':                   { name:'Ensure',                 emoji:'🥛', hydration:82,  advice:'Abbott\'s adult nutrition drink.' },
  'protinex':                 { name:'Protinex',               emoji:'🥛', hydration:80,  advice:'High-protein nutrition drink.' },
  'junior horlicks':          { name:'Junior Horlicks',        emoji:'🥛', hydration:80,  advice:'Child nutrition drink.' },
  'mothers horlicks':         { name:'Mother\'s Horlicks',     emoji:'🥛', hydration:80,  advice:'Nutrition drink for mothers.' },
  'women horlicks':           { name:'Women\'s Horlicks',      emoji:'🥛', hydration:80,  advice:'Women\'s health nutrition drink.' },

  // ═══════════════════════════════════════════════════════════════
  // HOT DRINKS
  // ═══════════════════════════════════════════════════════════════
  'hot chocolate':            { name:'Hot Chocolate',          emoji:'🍫', hydration:72,  advice:'Warming and moderately hydrating.' },
  'hot cocoa':                { name:'Hot Cocoa',              emoji:'🍫', hydration:72,  advice:'Classic warming drink.' },
  'drinking chocolate':       { name:'Drinking Chocolate',     emoji:'🍫', hydration:70,  advice:'Rich chocolate drink.' },
  'cadbury hot chocolate':    { name:'Cadbury Hot Chocolate',  emoji:'🍫', hydration:71,  advice:'Classic Cadbury cocoa drink.' },
  'cider':                    { name:'Hot Cider',              emoji:'🍎', hydration:70,  advice:'Warm apple cider — seasonal favourite.' },
  'mulled wine':              { name:'Mulled Wine',            emoji:'🍷', hydration:-30, advice:'Spiced wine — follow with water.' },
  'hot toddy':                { name:'Hot Toddy',              emoji:'🍵', hydration:-20, advice:'Whiskey-based remedy — moderate consumption.' },
  'bone broth':               { name:'Bone Broth',             emoji:'🍲', hydration:90,  advice:'Mineral-rich broth — excellent hydration.' },
  'miso soup':                { name:'Miso Soup',              emoji:'🍲', hydration:88,  advice:'Japanese fermented soy soup.' },
  'soup':                     { name:'Soup',                   emoji:'🍲', hydration:85,  advice:'Broth soups are great for hydration.' },
  'tomato soup':              { name:'Tomato Soup',            emoji:'🍅', hydration:85,  advice:'Lycopene-rich warm soup.' },
  'chicken broth':            { name:'Chicken Broth',          emoji:'🍲', hydration:90,  advice:'Clear broth — excellent for hydration.' },
  'rasam':                    { name:'Rasam',                  emoji:'🍲', hydration:90,  advice:'South Indian spiced broth — medicinal and hydrating.' },
  'sambar':                   { name:'Sambar',                 emoji:'🍲', hydration:85,  advice:'South Indian lentil stew — nutritious.' },

  // ═══════════════════════════════════════════════════════════════
  // ALCOHOL — Beer
  // ═══════════════════════════════════════════════════════════════
  'beer':                     { name:'Beer',                   emoji:'🍺', hydration:-30, advice:'Alcohol dehydrates — drink water after.' },
  'lager':                    { name:'Lager',                  emoji:'🍺', hydration:-28, advice:'Light beer — still dehydrating.' },
  'ale':                      { name:'Ale',                    emoji:'🍺', hydration:-32, advice:'Stronger beer — drink water alongside.' },
  'stout':                    { name:'Stout',                  emoji:'🍺', hydration:-35, advice:'Dark beer — high alcohol, very dehydrating.' },
  'guinness':                 { name:'Guinness',               emoji:'🍺', hydration:-35, advice:'Irish stout — drink plenty of water.' },
  'wheat beer':               { name:'Wheat Beer',             emoji:'🍺', hydration:-28, advice:'Light wheat beer — moderately dehydrating.' },
  'ipa':                      { name:'IPA',                    emoji:'🍺', hydration:-38, advice:'High hop beer — very dehydrating.' },
  'craft beer':               { name:'Craft Beer',             emoji:'🍺', hydration:-32, advice:'Artisan beer — drink water alongside.' },
  'kingfisher':               { name:'Kingfisher Beer',        emoji:'🍺', hydration:-30, advice:'India\'s most popular beer — drink water after.' },
  'budweiser':                { name:'Budweiser',              emoji:'🍺', hydration:-30, advice:'American lager — stay hydrated.' },
  'heineken':                 { name:'Heineken',               emoji:'🍺', hydration:-30, advice:'Dutch lager — drink water alongside.' },
  'corona':                   { name:'Corona',                 emoji:'🍺', hydration:-30, advice:'Mexican lager — popular worldwide.' },
  'tuborg':                   { name:'Tuborg',                 emoji:'🍺', hydration:-30, advice:'Danish beer — popular in India.' },
  'carlsberg':                { name:'Carlsberg',              emoji:'🍺', hydration:-30, advice:'Danish lager.' },
  'fosters':                  { name:'Foster\'s',              emoji:'🍺', hydration:-30, advice:'Australian beer brand.' },
  'haywards 5000':            { name:'Haywards 5000',          emoji:'🍺', hydration:-40, advice:'Strong beer — drink water after.' },
  'strong beer':              { name:'Strong Beer',            emoji:'🍺', hydration:-40, advice:'High alcohol content — very dehydrating.' },
  'bira 91':                  { name:'Bira 91',                emoji:'🍺', hydration:-28, advice:'Indian craft beer — moderate consumption.' },
  'desperados':               { name:'Desperados',             emoji:'🍺', hydration:-30, advice:'Tequila-flavoured beer.' },
  'shandy':                   { name:'Shandy',                 emoji:'🍺', hydration:-15, advice:'Beer mixed with lemonade — less dehydrating.' },
  'radler':                   { name:'Radler',                 emoji:'🍺', hydration:-15, advice:'Beer with fruit juice — lighter option.' },

  // ─── Alcohol — Wine ───
  'wine':                     { name:'Wine',                   emoji:'🍷', hydration:-40, advice:'High alcohol content — follow with water.' },
  'red wine':                 { name:'Red Wine',               emoji:'🍷', hydration:-40, advice:'Rich tannins — drink water alongside.' },
  'white wine':               { name:'White Wine',             emoji:'🥂', hydration:-38, advice:'Crisper option — still dehydrating.' },
  'rose wine':                { name:'Rosé Wine',              emoji:'🥂', hydration:-36, advice:'Pink wine — moderate dehydration.' },
  'sparkling wine':           { name:'Sparkling Wine',         emoji:'🥂', hydration:-38, advice:'Bubbles speed up alcohol absorption.' },
  'champagne':                { name:'Champagne',              emoji:'🥂', hydration:-35, advice:'Celebrate with water on the side!' },
  'prosecco':                 { name:'Prosecco',               emoji:'🥂', hydration:-35, advice:'Italian sparkling wine — follow with water.' },
  'cava':                     { name:'Cava',                   emoji:'🥂', hydration:-35, advice:'Spanish sparkling wine.' },
  'port wine':                { name:'Port Wine',              emoji:'🍷', hydration:-55, advice:'Fortified wine — very high alcohol.' },
  'sherry':                   { name:'Sherry',                 emoji:'🍷', hydration:-50, advice:'Fortified wine — high alcohol content.' },
  'sangria':                  { name:'Sangria',                emoji:'🍷', hydration:-30, advice:'Wine punch — the fruit doesn\'t offset dehydration.' },
  'wine spritzer':            { name:'Wine Spritzer',          emoji:'🥂', hydration:-20, advice:'Wine diluted with soda — less dehydrating.' },

  // ─── Alcohol — Spirits ───
  'whiskey':                  { name:'Whiskey',                emoji:'🥃', hydration:-70, advice:'Very dehydrating — drink plenty of water.' },
  'whisky':                   { name:'Whisky',                 emoji:'🥃', hydration:-70, advice:'Strong spirit — alternate with water.' },
  'scotch':                   { name:'Scotch Whisky',          emoji:'🥃', hydration:-70, advice:'Peated Scotch — extremely dehydrating.' },
  'bourbon':                  { name:'Bourbon',                emoji:'🥃', hydration:-70, advice:'American whiskey — drink water alongside.' },
  'vodka':                    { name:'Vodka',                  emoji:'🍸', hydration:-70, advice:'High alcohol — strongly dehydrating.' },
  'rum':                      { name:'Rum',                    emoji:'🥃', hydration:-65, advice:'Sugarcane spirit — very dehydrating.' },
  'gin':                      { name:'Gin',                    emoji:'🍸', hydration:-70, advice:'Juniper spirit — very dehydrating.' },
  'tequila':                  { name:'Tequila',                emoji:'🥃', hydration:-70, advice:'Agave spirit — shots dehydrate quickly.' },
  'brandy':                   { name:'Brandy',                 emoji:'🥃', hydration:-60, advice:'Distilled wine — dehydrating.' },
  'cognac':                   { name:'Cognac',                 emoji:'🥃', hydration:-65, advice:'Premium brandy — very dehydrating.' },
  'tequila shot':             { name:'Tequila Shot',           emoji:'🥃', hydration:-70, advice:'Drink water between shots.' },
  'vodka shot':               { name:'Vodka Shot',             emoji:'🍸', hydration:-72, advice:'Very dehydrating — drink water after.' },
  'sake':                     { name:'Sake',                   emoji:'🍶', hydration:-45, advice:'Japanese rice wine — moderately dehydrating.' },
  'soju':                     { name:'Soju',                   emoji:'🍶', hydration:-55, advice:'Korean spirit — strong and dehydrating.' },
  'baijiu':                   { name:'Baijiu',                 emoji:'🍶', hydration:-80, advice:'Chinese spirit — extremely strong.' },
  'arrack':                   { name:'Arrack',                 emoji:'🥃', hydration:-60, advice:'Asian spirit from coconut/anise.' },
  'old monk':                 { name:'Old Monk',               emoji:'🥃', hydration:-65, advice:'Iconic Indian dark rum.' },
  'royal stag':               { name:'Royal Stag',             emoji:'🥃', hydration:-70, advice:'Indian whisky.' },
  'imperial blue':            { name:'Imperial Blue',          emoji:'🥃', hydration:-70, advice:'Popular Indian whisky brand.' },
  'officer\'s choice':        { name:'Officer\'s Choice',      emoji:'🥃', hydration:-70, advice:'India\'s best-selling whisky.' },
  'mcdownell no 1':           { name:'McDowell\'s No.1',       emoji:'🥃', hydration:-65, advice:'Indian whisky and rum brand.' },
  'blenders pride':           { name:'Blenders Pride',         emoji:'🥃', hydration:-70, advice:'Seagram\'s premium Indian whisky.' },

  // ─── Alcohol — Cocktails ───
  'cocktail':                 { name:'Cocktail',               emoji:'🍸', hydration:-50, advice:'Heavily dehydrating — alternate with water.' },
  'mojito':                   { name:'Mojito',                 emoji:'🍸', hydration:-35, advice:'Rum with mint and lime — dehydrating.' },
  'margarita':                { name:'Margarita',              emoji:'🍸', hydration:-45, advice:'Tequila cocktail — drink water alongside.' },
  'pina colada':              { name:'Piña Colada',            emoji:'🍹', hydration:-35, advice:'Tropical rum cocktail — dehydrating.' },
  'daiquiri':                 { name:'Daiquiri',               emoji:'🍸', hydration:-40, advice:'Rum and citrus — dehydrating.' },
  'long island iced tea':     { name:'Long Island Iced Tea',   emoji:'🍸', hydration:-70, advice:'Multiple spirits — very dehydrating!' },
  'cosmopolitan':             { name:'Cosmopolitan',           emoji:'🍸', hydration:-45, advice:'Vodka cocktail — drink water between sips.' },
  'negroni':                  { name:'Negroni',                emoji:'🍸', hydration:-55, advice:'Strong Italian cocktail.' },
  'old fashioned':            { name:'Old Fashioned',          emoji:'🥃', hydration:-60, advice:'Whiskey cocktail — very dehydrating.' },
  'aperol spritz':            { name:'Aperol Spritz',          emoji:'🥂', hydration:-20, advice:'Lighter cocktail with prosecco.' },
  'gin and tonic':            { name:'Gin & Tonic',            emoji:'🍸', hydration:-45, advice:'Classic mix — dehydrating.' },
  'rum and coke':             { name:'Rum & Coke',             emoji:'🍸', hydration:-50, advice:'Both dehydrating — drink water alongside.' },
  'vodka tonic':              { name:'Vodka Tonic',            emoji:'🍸', hydration:-45, advice:'Dehydrating mix.' },
  'screwdriver':              { name:'Screwdriver',            emoji:'🍸', hydration:-35, advice:'Vodka and orange juice.' },
  'bloody mary':              { name:'Bloody Mary',            emoji:'🍅', hydration:-30, advice:'Tomato juice helps slightly — still dehydrating.' },
  'whiskey sour':             { name:'Whiskey Sour',           emoji:'🥃', hydration:-55, advice:'Citrus helps but still dehydrating.' },
  'beer cocktail':            { name:'Beer Cocktail',          emoji:'🍺', hydration:-35, advice:'Mixed beer drink — dehydrating.' },
  'breeze':                   { name:'Breeze',                 emoji:'🍹', hydration:-40, advice:'Vodka and cranberry mix.' },
  'tequila sunrise':          { name:'Tequila Sunrise',        emoji:'🍹', hydration:-40, advice:'Tequila with orange juice.' },
  'sex on the beach':         { name:'Sex on the Beach',       emoji:'🍹', hydration:-38, advice:'Vodka and peach schnapps.' },
  'harvey wallbanger':        { name:'Harvey Wallbanger',      emoji:'🍹', hydration:-40, advice:'Vodka and Galliano cocktail.' },
  'punch':                    { name:'Fruit Punch',            emoji:'🍹', hydration:-20, advice:'May contain alcohol — check before serving.' },
  'cocktail shaker':          { name:'Cocktail',               emoji:'🍸', hydration:-50, advice:'Mixed drink — stay hydrated alongside.' },

  // ─── Alcohol — Low/No Alcohol ───
  'non alcoholic beer':       { name:'Non-Alcoholic Beer',     emoji:'🍺', hydration:70,  advice:'Good alcohol-free option.' },
  'alcohol free wine':        { name:'Alcohol-Free Wine',      emoji:'🍷', hydration:75,  advice:'Wine without the dehydrating alcohol.' },
  'mocktail':                 { name:'Mocktail',               emoji:'🍹', hydration:75,  advice:'Fun drink without alcohol!' },
  'virgin mojito':            { name:'Virgin Mojito',          emoji:'🍹', hydration:82,  advice:'Refreshing non-alcoholic mojito.' },
  'virgin mary':              { name:'Virgin Mary',            emoji:'🍅', hydration:85,  advice:'Tomato juice mocktail — very hydrating.' },
  'shirley temple':           { name:'Shirley Temple',         emoji:'🍹', hydration:72,  advice:'Ginger ale and grenadine — non-alcoholic.' },

  // ═══════════════════════════════════════════════════════════════
  // PLANT-BASED & WELLNESS DRINKS
  // ═══════════════════════════════════════════════════════════════
  'green drink':              { name:'Green Drink',            emoji:'🥬', hydration:90,  advice:'Vegetable blend — very nutritious.' },
  'chlorophyll water':        { name:'Chlorophyll Water',      emoji:'🌿', hydration:97,  advice:'Trendy wellness drink — very hydrating.' },
  'collagen drink':           { name:'Collagen Drink',         emoji:'💊', hydration:85,  advice:'Beauty supplement drink.' },
  'collagen water':           { name:'Collagen Water',         emoji:'💊', hydration:95,  advice:'Infused water with collagen.' },
  'vitamin water':            { name:'Vitamin Water',          emoji:'💧', hydration:90,  advice:'Fortified water — check sugar content.' },
  'smart water':              { name:'smartwater',             emoji:'💧', hydration:100, advice:'Vapour distilled water with electrolytes.' },
  'coconut kefir':            { name:'Coconut Kefir',          emoji:'🥥', hydration:87,  advice:'Fermented coconut — gut health benefits.' },
  'turmeric latte':           { name:'Turmeric Latte',         emoji:'💛', hydration:82,  advice:'Anti-inflammatory wellness drink.' },
  'mushroom coffee':          { name:'Mushroom Coffee',        emoji:'☕', hydration:80,  advice:'Adaptogen coffee — trending wellness drink.' },
  'cacao drink':              { name:'Cacao Drink',            emoji:'🍫', hydration:75,  advice:'Raw cacao — antioxidant-rich.' },
  'bone broth drink':         { name:'Bone Broth',             emoji:'🍲', hydration:90,  advice:'Collagen and mineral-rich broth.' },
  'apple cider vinegar drink':{ name:'ACV Drink',              emoji:'🍎', hydration:88,  advice:'Diluted apple cider vinegar — gut health.' },
  'fire cider':               { name:'Fire Cider',             emoji:'🌶️', hydration:80,  advice:'Spicy wellness tonic.' },
  'elderflower cordial':      { name:'Elderflower Cordial',    emoji:'🌸', hydration:82,  advice:'British floral drink — refreshing.' },

  // ═══════════════════════════════════════════════════════════════
  // REGIONAL INDIAN & SOUTH ASIAN
  // ═══════════════════════════════════════════════════════════════
  'toddy':                    { name:'Palm Toddy',             emoji:'🌴', hydration:65,  advice:'Fermented palm sap — moderate alcohol.' },
  'neera':                    { name:'Neera',                  emoji:'🌴', hydration:88,  advice:'Fresh unfermented palm sap — very nutritious.' },
  'nolen gur drink':          { name:'Nolen Gur Drink',        emoji:'💛', hydration:82,  advice:'Date palm jaggery drink from Bengal.' },
  'sol':                      { name:'Sol',                    emoji:'🌸', hydration:87,  advice:'Kokum-based Goan drink.' },
  'paneer water':             { name:'Paneer Whey Water',      emoji:'💧', hydration:92,  advice:'Byproduct of paneer making — nutritious.' },
  'taak':                     { name:'Taak',                   emoji:'🥛', hydration:90,  advice:'Maharashtra\'s spiced buttermilk.' },
  'mor':                      { name:'Mor Kuzhambu',           emoji:'🥛', hydration:90,  advice:'South Indian spiced buttermilk.' },
  'neer more':                { name:'Neer More',              emoji:'🥛', hydration:91,  advice:'Tamil spiced buttermilk — summer drink.' },
  'ghol':                     { name:'Ghol',                   emoji:'🥛', hydration:90,  advice:'Gujarat\'s spiced buttermilk.' },
  'kadha':                    { name:'Kadha',                  emoji:'🌿', hydration:88,  advice:'Ayurvedic herbal decoction — immunity booster.' },
  'kashayam':                 { name:'Kashayam',               emoji:'🌿', hydration:88,  advice:'South Indian medicinal herbal drink.' },
  'chukku kaapi':             { name:'Chukku Kaapi',           emoji:'☕', hydration:85,  advice:'South Indian dry ginger coffee — digestive.' },
  'ragi malt':                { name:'Ragi Malt',              emoji:'🌾', hydration:84,  advice:'Finger millet drink — nutritious and cooling.' },
  'ragi drink':               { name:'Ragi Drink',             emoji:'🌾', hydration:84,  advice:'Calcium-rich millet drink.' },
  'bajra rabri':              { name:'Bajra Rabri',            emoji:'🌾', hydration:82,  advice:'Pearl millet drink — Rajasthan staple.' },
  'oats drink':               { name:'Oat Drink',              emoji:'🌾', hydration:83,  advice:'Fibre-rich grain drink.' },
  'jau ka pani':              { name:'Barley Water',           emoji:'🌾', hydration:92,  advice:'Barley water — excellent for kidneys and hydration.' },
  'barley water':             { name:'Barley Water',           emoji:'🌾', hydration:92,  advice:'Traditional remedy — very hydrating and cooling.' },
  'rice kanji':               { name:'Rice Kanji',             emoji:'🍚', hydration:90,  advice:'Rice water gruel — very hydrating and digestive.' },
  'ganji':                    { name:'Ganji',                  emoji:'🍚', hydration:90,  advice:'South Indian rice gruel — hydrating and digestive.' },
  'congee':                   { name:'Congee',                 emoji:'🍚', hydration:88,  advice:'Rice porridge drink — excellent for hydration.' },
  'jaggery water':            { name:'Jaggery Water',          emoji:'💛', hydration:88,  advice:'Gur pani — natural electrolytes.' },
  'gur pani':                 { name:'Gur Pani',               emoji:'💛', hydration:88,  advice:'Jaggery water — iron-rich and energising.' },

  // ═══════════════════════════════════════════════════════════════
  // GLOBAL REGIONAL DRINKS
  // ═══════════════════════════════════════════════════════════════
  'horchata':                 { name:'Horchata',               emoji:'🥛', hydration:78,  advice:'Mexican rice milk drink — moderately hydrating.' },
  'atole':                    { name:'Atole',                  emoji:'🌽', hydration:75,  advice:'Mexican corn masa drink.' },
  'chicha':                   { name:'Chicha',                 emoji:'🌽', hydration:70,  advice:'South American fermented maize drink.' },
  'tepache':                  { name:'Tepache',                emoji:'🍍', hydration:72,  advice:'Mexican fermented pineapple drink.' },
  'agua fresca':              { name:'Agua Fresca',            emoji:'🍹', hydration:88,  advice:'Mexican fruit water — very hydrating.' },
  'tamarindo agua fresca':    { name:'Tamarindo Agua Fresca',  emoji:'🍫', hydration:85,  advice:'Tamarind water drink.' },
  'hibiscus agua fresca':     { name:'Hibiscus Agua Fresca',   emoji:'🌺', hydration:88,  advice:'Jamaican sorrel/Mexican agua de jamaica.' },
  'teh tarik':                { name:'Teh Tarik',              emoji:'🍵', hydration:80,  advice:'Malaysian pulled tea with condensed milk.' },
  'bandung':                  { name:'Bandung',                emoji:'🌹', hydration:78,  advice:'Malaysian rose syrup milk.' },
  'cendol':                   { name:'Cendol',                 emoji:'🥤', hydration:70,  advice:'South-East Asian dessert drink.' },
  'milo dinosaur':            { name:'Milo Dinosaur',          emoji:'🍫', hydration:72,  advice:'Malaysian Milo drink with extra powder.' },
  'thai iced tea':            { name:'Thai Iced Tea',          emoji:'🍊', hydration:72,  advice:'Sweet orange tea with condensed milk.' },
  'thai milk tea':            { name:'Thai Milk Tea',          emoji:'🍵', hydration:72,  advice:'Thai-style milk tea.' },
  'hong kong milk tea':       { name:'HK Milk Tea',            emoji:'🍵', hydration:77,  advice:'Strong evaporated milk tea.' },
  'yuan yang':                { name:'Yuan Yang',              emoji:'☕', hydration:75,  advice:'Hong Kong coffee-tea blend.' },
  'cafe de olla':             { name:'Café de Olla',           emoji:'☕', hydration:79,  advice:'Mexican spiced coffee.' },
  'mate':                     { name:'Yerba Mate',             emoji:'🌿', hydration:85,  advice:'South American energising herb drink.' },
  'yerba mate':               { name:'Yerba Mate',             emoji:'🌿', hydration:85,  advice:'Caffeine-rich South American drink.' },
  'guarana drink':            { name:'Guarana Drink',          emoji:'🌿', hydration:75,  advice:'Natural caffeine from Amazonian seeds.' },
  'rooibos latte':            { name:'Rooibos Latte',          emoji:'🍵', hydration:82,  advice:'South African red tea latte.' },
  'boza':                     { name:'Boza',                   emoji:'🌾', hydration:72,  advice:'Fermented grain drink from Balkans.' },
  'kvas':                     { name:'Kvass',                  emoji:'🍺', hydration:70,  advice:'Russian fermented bread drink.' },
  'switchel':                 { name:'Switchel',               emoji:'💧', hydration:88,  advice:'Apple cider vinegar ginger drink.' },
  'shrub drink':              { name:'Shrub',                  emoji:'🍎', hydration:85,  advice:'Vinegar-based fruit syrup drink.' },
  'karkade':                  { name:'Karkade',                emoji:'🌺', hydration:92,  advice:'Egyptian hibiscus tea.' },
  'sobia':                    { name:'Sobia',                  emoji:'🌿', hydration:85,  advice:'Egyptian barley and rice drink.' },
  'tamarind ball drink':      { name:'Tamarind Drink',         emoji:'🍫', hydration:82,  advice:'Caribbean tamarind beverage.' },
  'sorrel drink':             { name:'Sorrel Drink',           emoji:'🌺', hydration:88,  advice:'Caribbean hibiscus drink — Christmas staple.' },

  // ═══════════════════════════════════════════════════════════════
  // DESSERT DRINKS
  // ═══════════════════════════════════════════════════════════════
  'ice cream soda':           { name:'Ice Cream Soda',         emoji:'🍦', hydration:50,  advice:'Treat drink — have water alongside.' },
  'float':                    { name:'Float',                  emoji:'🍦', hydration:50,  advice:'Ice cream and soda — occasional treat.' },
  'hot fudge shake':          { name:'Hot Fudge Shake',        emoji:'🍫', hydration:55,  advice:'Rich dessert drink.' },
  'affogato drink':           { name:'Affogato',               emoji:'☕', hydration:58,  advice:'Espresso over ice cream — delightful treat.' },
  'eggnog':                   { name:'Eggnog',                 emoji:'🥛', hydration:62,  advice:'Holiday drink — enjoy moderately.' },
  'chai latte':               { name:'Chai Latte',             emoji:'🍵', hydration:80,  advice:'Spiced tea with steamed milk.' },
  'pumpkin spice latte':      { name:'Pumpkin Spice Latte',    emoji:'☕', hydration:74,  advice:'Seasonal favourite — watch sugar.' },
  'caramel latte':            { name:'Caramel Latte',          emoji:'☕', hydration:74,  advice:'Sweet coffee drink — moderate hydration.' },
  'salted caramel latte':     { name:'Salted Caramel Latte',   emoji:'☕', hydration:74,  advice:'Sweet and salty coffee drink.' },
  'hazelnut latte':           { name:'Hazelnut Latte',         emoji:'☕', hydration:74,  advice:'Nutty flavoured latte.' },
  'vanilla latte':            { name:'Vanilla Latte',          emoji:'☕', hydration:75,  advice:'Sweet vanilla coffee drink.' },
  'rose latte':               { name:'Rose Latte',             emoji:'🌹', hydration:78,  advice:'Floral milk latte.' },
  'lavender latte':           { name:'Lavender Latte',         emoji:'💜', hydration:78,  advice:'Calming floral latte.' },
  'mushroom latte':           { name:'Mushroom Latte',         emoji:'🍄', hydration:80,  advice:'Adaptogen wellness latte.' },
  'ice cream':                { name:'Ice Cream Drink',        emoji:'🍦', hydration:40,  advice:'Low hydration — have water alongside.' },
  'falooda':                  { name:'Falooda',                emoji:'🌹', hydration:70,  advice:'Rose-milk dessert drink — festive treat.' },
  'kulfi falooda':            { name:'Kulfi Falooda',          emoji:'🍦', hydration:65,  advice:'Indian ice cream drink — festive.' },

  // ═══════════════════════════════════════════════════════════════
  // CONTAINER / VESSEL FALLBACKS
  // ═══════════════════════════════════════════════════════════════
  'cup':                      { name:'Drink in Cup',           emoji:'☕', hydration:80,  advice:'Warm drink — likely tea or coffee.' },
  'mug':                      { name:'Hot Drink',              emoji:'☕', hydration:80,  advice:'Warm drink — likely tea or coffee.' },
  'glass':                    { name:'Drink in Glass',         emoji:'🥤', hydration:80,  advice:'Clear drink — likely water or juice.' },
  'bottle':                   { name:'Bottled Drink',          emoji:'💧', hydration:90,  advice:'Bottled beverage — likely water or juice.' },
  'plastic bottle':           { name:'Bottled Drink',          emoji:'💧', hydration:85,  advice:'Likely water or a soft drink.' },
  'water bottle':             { name:'Water Bottle',           emoji:'💧', hydration:95,  advice:'Bottle likely contains water.' },
  'can':                      { name:'Canned Drink',           emoji:'🥫', hydration:70,  advice:'Could be soda, energy drink or beer.' },
  'tin can':                  { name:'Canned Drink',           emoji:'🥫', hydration:70,  advice:'Canned beverage — check the label!' },
  'teapot':                   { name:'Tea',                    emoji:'🍵', hydration:90,  advice:'Tea pot — excellent hydration.' },
  'pitcher':                  { name:'Water/Juice',            emoji:'🫗', hydration:88,  advice:'Large pitcher — likely water or juice.' },
  'carafe':                   { name:'Carafe',                 emoji:'🫗', hydration:88,  advice:'Likely water or wine.' },
  'flask':                    { name:'Flask',                  emoji:'💧', hydration:88,  advice:'Likely water or hot drink.' },
  'thermos':                  { name:'Hot Drink',              emoji:'☕', hydration:82,  advice:'Thermos likely contains tea or coffee.' },
  'wine bottle':              { name:'Wine',                   emoji:'🍷', hydration:-40, advice:'Wine — follow with water.' },
  'beer bottle':              { name:'Beer',                   emoji:'🍺', hydration:-30, advice:'Beer dehydrates — drink water after.' },
  'beer glass':               { name:'Beer',                   emoji:'🍺', hydration:-30, advice:'Beer — drink water after.' },
  'shot glass':               { name:'Spirit Shot',           emoji:'🥃', hydration:-70, advice:'Strong spirit — drink water between shots.' },
  'wine glass':               { name:'Wine',                   emoji:'🍷', hydration:-40, advice:'Wine glass — follow with water.' },
  'champagne flute':          { name:'Champagne',              emoji:'🥂', hydration:-35, advice:'Sparkling wine — drink water too.' },
  'cocktail glass':           { name:'Cocktail',               emoji:'🍸', hydration:-50, advice:'Cocktail — alternate with water.' },
  'pop bottle':               { name:'Soft Drink',             emoji:'🥤', hydration:55,  advice:'Carbonated soft drink.' },
  'drinking fountain':        { name:'Water',                  emoji:'💧', hydration:100, advice:'Fresh water — perfect!' },
  'juice box':                { name:'Juice Box',              emoji:'🧃', hydration:82,  advice:'Packaged fruit juice.' },
  'tetra pack':               { name:'Packaged Drink',         emoji:'🧃', hydration:80,  advice:'Packaged beverage.' },
  'sipper':                   { name:'Sipper Drink',           emoji:'🥤', hydration:85,  advice:'Likely water or juice in a sipper.' },
  'straw':                    { name:'Drink with Straw',       emoji:'🥤', hydration:80,  advice:'Cold drink — likely juice or soda.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE INDIAN REGIONAL DRINKS
  // ═══════════════════════════════════════════════════════════════
  'panakam':                  { name:'Panakam',                emoji:'💛', hydration:88,  advice:'Andhra jaggery-ginger festival drink.' },
  'majjiga':                  { name:'Majjiga',                emoji:'🥛', hydration:91,  advice:'Telugu spiced buttermilk.' },
  'nannari':                  { name:'Nannari Drink',          emoji:'🌿', hydration:87,  advice:'Indian sarsaparilla — cooling and hydrating.' },
  'paal':                     { name:'Paal',                   emoji:'🥛', hydration:88,  advice:'Tamil Nadu fresh milk.' },
  'sambraani kaapi':          { name:'Sambraani Coffee',       emoji:'☕', hydration:78,  advice:'Resin-smoked South Indian coffee.' },
  'kapi':                     { name:'Kapi',                   emoji:'☕', hydration:79,  advice:'South Indian coffee — decoction style.' },
  'sulaimani':                { name:'Sulaimani',              emoji:'🍵', hydration:88,  advice:'Kerala black tea with lemon — no milk.' },
  'black sulaimani':          { name:'Black Sulaimani',        emoji:'🍵', hydration:89,  advice:'Malabar-style lemon tea — very refreshing.' },
  'pazhankanji':              { name:'Pazhankanji',            emoji:'🍚', hydration:91,  advice:'Kerala fermented rice water — cooling and probiotic.' },
  'torani drink':             { name:'Torani Syrup Drink',     emoji:'🍹', hydration:72,  advice:'Flavoured syrup drink — watch sugar.' },
  'rose syrup milk':          { name:'Rose Syrup Milk',        emoji:'🌹', hydration:82,  advice:'Rooh Afza-style rose milk.' },
  'khus sharbat':             { name:'Khus Sharbat',           emoji:'🌿', hydration:87,  advice:'Vetiver grass syrup drink — extremely cooling.' },
  'kewra drink':              { name:'Kewra Water Drink',      emoji:'🌸', hydration:90,  advice:'Screwpine blossom water — aromatic.' },
  'gulab jal sharbat':        { name:'Rose Water Drink',       emoji:'🌹', hydration:91,  advice:'Rose water diluted drink — Mughal tradition.' },
  'imli sharbat':             { name:'Imli Sharbat',           emoji:'🍫', hydration:82,  advice:'Sweet-sour tamarind sharbat.' },
  'pudina sharbat':           { name:'Pudina Sharbat',         emoji:'🌿', hydration:91,  advice:'Fresh mint sharbat — ultra-cooling.' },
  'subja drink':              { name:'Sabja Drink',            emoji:'🌿', hydration:93,  advice:'Basil seeds water — expands in water, very hydrating.' },
  'chawal ka pani':           { name:'Rice Water',             emoji:'🍚', hydration:92,  advice:'Starchy rice water — digestive and hydrating.' },
  'dalia drink':              { name:'Dalia Drink',            emoji:'🌾', hydration:84,  advice:'Broken wheat porridge drink.' },
  'jowar drink':              { name:'Jowar Drink',            emoji:'🌾', hydration:84,  advice:'Sorghum-based drink — nutritious.' },
  'bajra drink':              { name:'Bajra Drink',            emoji:'🌾', hydration:83,  advice:'Pearl millet drink — cooling.' },
  'makke ka pani':            { name:'Corn Water',             emoji:'🌽', hydration:88,  advice:'Sweet corn boiled water — natural sweetness.' },
  'maize drink':              { name:'Maize Drink',            emoji:'🌽', hydration:85,  advice:'Corn-based nutritious drink.' },
  'chana water':              { name:'Chickpea Water',         emoji:'🫘', hydration:87,  advice:'Aquafaba — nutritious bean water.' },
  'moong pani':               { name:'Moong Water',            emoji:'🫘', hydration:90,  advice:'Sprouted green gram water — detoxifying.' },
  'methi water':              { name:'Methi Water',            emoji:'🌿', hydration:90,  advice:'Fenugreek seed water — great for blood sugar.' },
  'ajwain water':             { name:'Ajwain Water',           emoji:'🌿', hydration:89,  advice:'Carom seed water — excellent digestive.' },
  'saunf water':              { name:'Saunf Water',            emoji:'🌿', hydration:91,  advice:'Fennel seed water — digestive and cooling.' },
  'jeera water':              { name:'Jeera Water',            emoji:'🌿', hydration:91,  advice:'Cumin water — great for metabolism.' },
  'coriander water':          { name:'Coriander Seed Water',   emoji:'🌿', hydration:91,  advice:'Dhaniya water — kidney health and hydration.' },
  'tulsi water':              { name:'Tulsi Water',            emoji:'🌿', hydration:92,  advice:'Holy basil water — immunity booster.' },
  'ashgourd juice':           { name:'White Pumpkin Juice',    emoji:'🥒', hydration:96,  advice:'Petha juice — extremely hydrating, Ayurvedic.' },
  'turai juice':              { name:'Ridge Gourd Juice',      emoji:'🥒', hydration:94,  advice:'Ridge gourd — cooling and hydrating.' },
  'parwal juice':             { name:'Pointed Gourd Juice',    emoji:'🥒', hydration:91,  advice:'Parwal — nutritious gourd juice.' },
  'tendli juice':             { name:'Ivy Gourd Juice',        emoji:'🥒', hydration:91,  advice:'Tindora juice — blood sugar management.' },
  'kakdi juice':              { name:'Kakdi Juice',            emoji:'🥒', hydration:96,  advice:'Indian cucumber — very hydrating.' },
  'chikoo shake':             { name:'Chikoo Shake',           emoji:'🍫', hydration:73,  advice:'Sapodilla milkshake — sweet and creamy.' },
  'sitafal shake':            { name:'Sitafal Shake',          emoji:'💚', hydration:72,  advice:'Custard apple shake — seasonal Indian favourite.' },
  'jamun juice':              { name:'Jamun Juice',            emoji:'🫐', hydration:86,  advice:'Indian blackberry — great for blood sugar.' },
  'jamun sharbat':            { name:'Jamun Sharbat',          emoji:'🫐', hydration:84,  advice:'Black plum sharbat — summer special.' },
  'falsa sharbat':            { name:'Falsa Sharbat',          emoji:'🫐', hydration:86,  advice:'Indian berry sharbat — cooling and tangy.' },
  'kairi panna':              { name:'Kairi Panna',            emoji:'🥭', hydration:88,  advice:'Green mango drink — Gujarat style.' },
  'raw mango drink':          { name:'Raw Mango Drink',        emoji:'🥭', hydration:87,  advice:'Kacchi kairi drink — summer coolant.' },
  'tarbuj juice':             { name:'Watermelon Juice',       emoji:'🍉', hydration:96,  advice:'Watermelon — 95% water, excellent hydration.' },
  'kharbooj juice':           { name:'Muskmelon Juice',        emoji:'🍈', hydration:92,  advice:'Melon juice — very hydrating and sweet.' },
  'kiwi juice':               { name:'Kiwi Juice',             emoji:'🥝', hydration:87,  advice:'Vitamin C rich kiwi — excellent hydration.' },
  'peach juice':              { name:'Peach Juice',            emoji:'🍑', hydration:86,  advice:'Sweet summer fruit juice.' },
  'pear juice':               { name:'Pear Juice',             emoji:'🍐', hydration:87,  advice:'Gentle on digestion — good hydration.' },
  'plum juice':               { name:'Plum Juice',             emoji:'🍑', hydration:85,  advice:'Rich in antioxidants.' },
  'fig juice':                { name:'Fig Juice',              emoji:'🟣', hydration:83,  advice:'Sweet fig — rich in minerals.' },
  'date juice':               { name:'Date Juice',             emoji:'🟫', hydration:76,  advice:'Very sweet — high energy but watch quantity.' },
  'apricot juice':            { name:'Apricot Juice',          emoji:'🟠', hydration:85,  advice:'Beta-carotene rich juice.' },
  'mulberry juice':           { name:'Mulberry Juice',         emoji:'🫐', hydration:87,  advice:'Antioxidant-rich berry juice.' },
  'gooseberry juice':         { name:'Gooseberry Juice',       emoji:'🟢', hydration:88,  advice:'Vitamin C powerhouse.' },
  'elderberry juice':         { name:'Elderberry Juice',       emoji:'🫐', hydration:84,  advice:'Immunity-boosting berry juice.' },
  'sea buckthorn juice':      { name:'Sea Buckthorn Juice',    emoji:'🟠', hydration:83,  advice:'Himalayan superfruit — very nutritious.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE SMOOTHIE VARIETIES
  // ═══════════════════════════════════════════════════════════════
  'watermelon smoothie':      { name:'Watermelon Smoothie',    emoji:'🍉', hydration:92,  advice:'Supremely hydrating summer smoothie.' },
  'papaya smoothie':          { name:'Papaya Smoothie',        emoji:'🍈', hydration:85,  advice:'Digestive enzymes — great for gut health.' },
  'pineapple smoothie':       { name:'Pineapple Smoothie',     emoji:'🍍', hydration:83,  advice:'Tropical and refreshing.' },
  'guava smoothie':           { name:'Guava Smoothie',         emoji:'🍈', hydration:84,  advice:'High vitamin C content.' },
  'coconut smoothie':         { name:'Coconut Smoothie',       emoji:'🥥', hydration:82,  advice:'Creamy and hydrating tropical smoothie.' },
  'dragon fruit smoothie':    { name:'Dragon Fruit Smoothie',  emoji:'🍈', hydration:87,  advice:'Exotic superfood smoothie.' },
  'pomegranate smoothie':     { name:'Pomegranate Smoothie',   emoji:'❤️', hydration:82,  advice:'Antioxidant-rich smoothie.' },
  'mixed fruit smoothie':     { name:'Mixed Fruit Smoothie',   emoji:'🍹', hydration:84,  advice:'Varied nutrition — good hydration.' },
  'detox smoothie':           { name:'Detox Smoothie',         emoji:'🥬', hydration:90,  advice:'Cleansing blend — very hydrating.' },
  'immunity smoothie':        { name:'Immunity Smoothie',      emoji:'🟠', hydration:87,  advice:'Ginger, turmeric, citrus blend.' },
  'post workout smoothie':    { name:'Post-Workout Smoothie',  emoji:'💪', hydration:82,  advice:'Recovery blend — drink water too.' },
  'overnight oats smoothie':  { name:'Oat Smoothie',           emoji:'🌾', hydration:78,  advice:'Filling fibre-rich smoothie.' },
  'chia smoothie':            { name:'Chia Smoothie',          emoji:'🌿', hydration:88,  advice:'Omega-3 rich — chia absorbs water.' },
  'flaxseed smoothie':        { name:'Flaxseed Smoothie',      emoji:'🌰', hydration:82,  advice:'Omega-3 rich nutritious blend.' },
  'hemp smoothie':            { name:'Hemp Smoothie',          emoji:'🌿', hydration:82,  advice:'Complete protein plant smoothie.' },
  'collagen smoothie':        { name:'Collagen Smoothie',      emoji:'💊', hydration:83,  advice:'Beauty supplement smoothie.' },
  'prebiotic smoothie':       { name:'Prebiotic Smoothie',     emoji:'🌿', hydration:86,  advice:'Gut-friendly smoothie.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE SHAKES
  // ═══════════════════════════════════════════════════════════════
  'butterscotch shake':       { name:'Butterscotch Shake',     emoji:'🍯', hydration:68,  advice:'Indulgent shake — drink water alongside.' },
  'kesar pista shake':        { name:'Kesar Pista Shake',      emoji:'💛', hydration:70,  advice:'Saffron pistachio shake — Indian favourite.' },
  'rose shake':               { name:'Rose Shake',             emoji:'🌹', hydration:72,  advice:'Floral flavoured milkshake.' },
  'coffee shake':             { name:'Coffee Shake',           emoji:'☕', hydration:68,  advice:'Caffeinated shake — drink water too.' },
  'peanut shake':             { name:'Peanut Shake',           emoji:'🥜', hydration:68,  advice:'Protein-rich shake.' },
  'almond shake':             { name:'Almond Shake',           emoji:'🌰', hydration:70,  advice:'Nutritious nut shake.' },
  'pistachio shake':          { name:'Pistachio Shake',        emoji:'🌰', hydration:70,  advice:'Nut shake — moderate hydration.' },
  'walnut shake':             { name:'Walnut Shake',           emoji:'🌰', hydration:70,  advice:'Brain-healthy nut shake.' },
  'dates shake':              { name:'Dates Shake',            emoji:'🟫', hydration:70,  advice:'Energy-dense dates milkshake.' },
  'sitafal shake':            { name:'Custard Apple Shake',    emoji:'💚', hydration:72,  advice:'Seasonal Indian shake — rich and creamy.' },
  'chikoo milkshake':         { name:'Chikoo Milkshake',       emoji:'🟫', hydration:72,  advice:'Sapodilla shake — naturally sweet.' },
  'jackfruit shake':          { name:'Jackfruit Shake',        emoji:'💛', hydration:72,  advice:'Tropical jackfruit — nutritious shake.' },
  'black currant shake':      { name:'Black Currant Shake',    emoji:'🫐', hydration:72,  advice:'Berry-flavoured shake.' },
  'tender coconut shake':     { name:'Tender Coconut Shake',   emoji:'🥥', hydration:82,  advice:'Coconut water based shake — very hydrating.' },
  'dry fruit shake':          { name:'Dry Fruit Shake',        emoji:'🌰', hydration:70,  advice:'Nutritious blend of dried fruits.' },
  'fruit cream':              { name:'Fruit Cream',            emoji:'🍓', hydration:68,  advice:'Fruit with fresh cream — moderate hydration.' },
  'thick shake':              { name:'Thick Shake',            emoji:'🥛', hydration:66,  advice:'Very dense shake — drink water alongside.' },
  'thin shake':               { name:'Thin Shake',             emoji:'🥛', hydration:74,  advice:'Lighter shake — better hydration.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE PACKAGED INDIAN DRINKS
  // ═══════════════════════════════════════════════════════════════
  'nimbooz':                  { name:'Nimbooz',                emoji:'🍋', hydration:75,  advice:'PepsiCo\'s lemon drink with sugar.' },
  'nimboos':                  { name:'Nimbooz',                emoji:'🍋', hydration:75,  advice:'Packaged lemon drink.' },
  'dew':                      { name:'Mountain Dew',           emoji:'💚', hydration:52,  advice:'Very high caffeine — drink water alongside.' },
  'mango frooti':             { name:'Mango Frooti',           emoji:'🥭', hydration:72,  advice:'Parle\'s mango nectar.' },
  'litchi drink':             { name:'Litchi Drink',           emoji:'🍈', hydration:74,  advice:'Lychee flavoured packaged drink.' },
  'guava drink':              { name:'Guava Drink',            emoji:'🍈', hydration:76,  advice:'Packaged guava juice.' },
  'mixed fruit drink':        { name:'Mixed Fruit Drink',      emoji:'🧃', hydration:76,  advice:'Packaged multi-fruit drink.' },
  'grape drink':              { name:'Grape Drink',            emoji:'🍇', hydration:74,  advice:'Packaged grape flavour drink.' },
  'pineapple drink':          { name:'Pineapple Drink',        emoji:'🍍', hydration:76,  advice:'Packaged pineapple drink.' },
  'apple drink':              { name:'Apple Drink',            emoji:'🍎', hydration:78,  advice:'Packaged apple juice drink.' },
  'cranberry drink':          { name:'Cranberry Drink',        emoji:'🫐', hydration:74,  advice:'Tart packaged cranberry drink.' },
  'pomegranate drink':        { name:'Pomegranate Drink',      emoji:'❤️', hydration:74,  advice:'Packaged pomegranate juice.' },
  'masala soda':              { name:'Masala Soda',            emoji:'🥤', hydration:60,  advice:'Indian spiced soda — refreshing street drink.' },
  'neon':                     { name:'Neon Energy',            emoji:'⚡', hydration:57,  advice:'Indian energy drink.' },
  'tzinga':                   { name:'Tzinga',                 emoji:'⚡', hydration:58,  advice:'Indian energy drink brand.' },
  'urzza':                    { name:'Urzza',                  emoji:'⚡', hydration:57,  advice:'Indian energy drink.' },
  'xtra':                     { name:'Xtra Power Drink',       emoji:'⚡', hydration:57,  advice:'Indian energy drink.' },
  'hell energy':              { name:'Hell Energy',            emoji:'⚡', hydration:57,  advice:'Hungarian energy drink — popular in India.' },
  'vibe':                     { name:'Vibe Energy',            emoji:'⚡', hydration:58,  advice:'Indian energy drink.' },
  'fyre':                     { name:'Fyre Energy',            emoji:'⚡', hydration:57,  advice:'Indian energy drink brand.' },
  'kingfisher soda':          { name:'Kingfisher Club Soda',   emoji:'💧', hydration:88,  advice:'Club soda — refreshing mixer.' },
  'soda water mixer':         { name:'Club Soda',              emoji:'💧', hydration:88,  advice:'Carbonated water mixer.' },
  'tonic mixer':              { name:'Tonic Water',            emoji:'💧', hydration:78,  advice:'Bitter tonic — watch quinine intake.' },
  'dry ginger ale':           { name:'Dry Ginger Ale',         emoji:'💧', hydration:64,  advice:'Mild ginger soda — refreshing.' },

  // ═══════════════════════════════════════════════════════════════
  // FERMENTED & PROBIOTIC
  // ═══════════════════════════════════════════════════════════════
  'water kefir':              { name:'Water Kefir',            emoji:'💧', hydration:90,  advice:'Probiotic sparkling water — gut health.' },
  'milk kefir':               { name:'Milk Kefir',             emoji:'🥛', hydration:85,  advice:'Fermented dairy — excellent probiotics.' },
  'rejuvelac':                { name:'Rejuvelac',              emoji:'🌾', hydration:88,  advice:'Fermented grain water — digestive health.' },
  'jun kombucha':             { name:'Jun Kombucha',           emoji:'🍵', hydration:83,  advice:'Green tea kombucha with honey.' },
  'ginger beer':              { name:'Ginger Beer',            emoji:'🍺', hydration:65,  advice:'Spicy fermented ginger drink — may have low alcohol.' },
  'fermented rice water':     { name:'Fermented Rice Water',   emoji:'🍚', hydration:90,  advice:'Korean makgeolli-style — very nutritious.' },
  'kvass':                    { name:'Kvass',                  emoji:'🍺', hydration:70,  advice:'Russian fermented rye bread drink.' },
  'tepache':                  { name:'Tepache',                emoji:'🍍', hydration:72,  advice:'Fermented pineapple peel drink from Mexico.' },
  'ginger kvass':             { name:'Ginger Kvass',           emoji:'🌿', hydration:72,  advice:'Ginger fermented drink.' },
  'fermented lemon drink':    { name:'Fermented Lemon Drink',  emoji:'🍋', hydration:85,  advice:'Probiotic-rich lemon ferment.' },
  'lacto fermented juice':    { name:'Lacto-Fermented Juice',  emoji:'🌿', hydration:86,  advice:'Live culture juice — gut health.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE GLOBAL DRINKS
  // ═══════════════════════════════════════════════════════════════
  'calpico':                  { name:'Calpico',                emoji:'🥛', hydration:75,  advice:'Japanese whey-based soft drink.' },
  'ramune':                   { name:'Ramune',                 emoji:'💧', hydration:65,  advice:'Japanese marble soda — iconic bottle.' },
  'pocari':                   { name:'Pocari Sweat',           emoji:'⚡', hydration:93,  advice:'Japanese electrolyte sports drink.' },
  'canned coffee':            { name:'Canned Coffee',          emoji:'☕', hydration:76,  advice:'Ready-to-drink coffee — watch sugar.' },
  'georgia coffee':           { name:'Georgia Coffee',         emoji:'☕', hydration:76,  advice:'Japanese canned coffee staple.' },
  'boss coffee':              { name:'Boss Coffee',            emoji:'☕', hydration:76,  advice:'Suntory\'s canned coffee brand.' },
  'yeo hiap seng':            { name:'Yeo\'s',                 emoji:'🧃', hydration:80,  advice:'Singapore\'s herbal and juice drinks.' },
  'chrysanthemum tea':        { name:'Chrysanthemum Tea',      emoji:'🌼', hydration:93,  advice:'Chinese floral tea — cooling and hydrating.' },
  'winter melon tea':         { name:'Winter Melon Tea',       emoji:'🍈', hydration:85,  advice:'Chinese cooling tea drink.' },
  'sugarcane tea':            { name:'Sugarcane Tea',          emoji:'🌿', hydration:82,  advice:'Southeast Asian sweet tea.' },
  'lemongrass tea':           { name:'Lemongrass Tea',         emoji:'🌿', hydration:94,  advice:'Aromatic herbal tea — very cooling.' },
  'pandan drink':             { name:'Pandan Drink',           emoji:'🌿', hydration:85,  advice:'Southeast Asian screwpine leaf drink.' },
  'milo drink':               { name:'Milo',                   emoji:'🍫', hydration:78,  advice:'Nestlé\'s chocolate malt — popular in Asia.' },
  'ovomaltine':               { name:'Ovomaltine',             emoji:'🍫', hydration:78,  advice:'Swiss malt cocoa drink.' },
  'baobab drink':             { name:'Baobab Drink',           emoji:'🌴', hydration:85,  advice:'African superfruit drink — very nutritious.' },
  'rooibos drink':            { name:'Rooibos Drink',          emoji:'🍵', hydration:94,  advice:'South African red bush drink — caffeine-free.' },
  'bissap':                   { name:'Bissap',                 emoji:'🌺', hydration:90,  advice:'West African hibiscus drink.' },
  'sobolo':                   { name:'Sobolo',                 emoji:'🌺', hydration:90,  advice:'Ghanaian hibiscus drink.' },
  'zobo':                     { name:'Zobo',                   emoji:'🌺', hydration:90,  advice:'Nigerian hibiscus drink — very popular.' },
  'tamarind ball juice':      { name:'Tamarind Drink',         emoji:'🍫', hydration:83,  advice:'Caribbean-style tamarind.' },
  'mauby':                    { name:'Mauby',                  emoji:'🌿', hydration:82,  advice:'Caribbean bark drink — bitter-sweet.' },
  'ginger beer caribbean':    { name:'Caribbean Ginger Beer',  emoji:'🌿', hydration:72,  advice:'Spicy homemade ginger brew.' },
  'coconut milk drink':       { name:'Coconut Milk Drink',     emoji:'🥥', hydration:80,  advice:'Creamy coconut beverage.' },
  'coconut cream drink':      { name:'Coconut Cream Drink',    emoji:'🥥', hydration:70,  advice:'Rich coconut cream — moderate hydration.' },
  'pea milk':                 { name:'Pea Milk',               emoji:'🫛', hydration:90,  advice:'High protein plant milk — very hydrating.' },
  'macadamia milk':           { name:'Macadamia Milk',         emoji:'🌰', hydration:90,  advice:'Creamy nut milk — good hydration.' },
  'tiger nut milk':           { name:'Tiger Nut Milk',         emoji:'🌰', hydration:88,  advice:'Horchata base — nutritious and hydrating.' },
  'pistachio milk':           { name:'Pistachio Milk',         emoji:'🌰', hydration:89,  advice:'Nutty flavoured plant milk.' },
  'hazelnut milk':            { name:'Hazelnut Milk',          emoji:'🌰', hydration:88,  advice:'Nutty plant milk — great with coffee.' },
  'walnut milk':              { name:'Walnut Milk',            emoji:'🌰', hydration:89,  advice:'Omega-3 rich nut milk.' },
  'pecan milk':               { name:'Pecan Milk',             emoji:'🌰', hydration:89,  advice:'Buttery flavoured nut milk.' },
  'barista oat milk':         { name:'Barista Oat Milk',       emoji:'🥛', hydration:89,  advice:'Specially formulated for coffee.' },
  'fortified milk':           { name:'Fortified Milk',         emoji:'🥛', hydration:88,  advice:'Vitamin-D enriched milk.' },

  // ═══════════════════════════════════════════════════════════════
  // MORE ALCOHOLIC VARIANTS
  // ═══════════════════════════════════════════════════════════════
  'wheat beer':               { name:'Wheat Beer',             emoji:'🍺', hydration:-28, advice:'Lighter beer style — still dehydrating.' },
  'hefeweizen':               { name:'Hefeweizen',             emoji:'🍺', hydration:-28, advice:'German wheat beer — cloudy and refreshing.' },
  'pilsner':                  { name:'Pilsner',                emoji:'🍺', hydration:-27, advice:'Light Czech-style lager.' },
  'pale ale':                 { name:'Pale Ale',               emoji:'🍺', hydration:-32, advice:'Hoppy ale — moderately dehydrating.' },
  'porter':                   { name:'Porter',                 emoji:'🍺', hydration:-33, advice:'Dark roasted beer — dehydrating.' },
  'saison':                   { name:'Saison',                 emoji:'🍺', hydration:-30, advice:'Belgian farmhouse ale.' },
  'sour beer':                { name:'Sour Beer',              emoji:'🍺', hydration:-28, advice:'Acidic beer style.' },
  'session ale':              { name:'Session Ale',            emoji:'🍺', hydration:-22, advice:'Lower ABV ale — less dehydrating.' },
  'cider drink':              { name:'Hard Cider',             emoji:'🍎', hydration:-20, advice:'Fermented apple cider — less dehydrating than spirits.' },
  'pear cider':               { name:'Pear Cider',             emoji:'🍐', hydration:-20, advice:'Perry — fermented pear drink.' },
  'hard seltzer':             { name:'Hard Seltzer',           emoji:'💧', hydration:-15, advice:'Low cal alcoholic sparkling water.' },
  'white claw':               { name:'White Claw',             emoji:'💧', hydration:-15, advice:'Popular hard seltzer brand.' },
  'truly hard seltzer':       { name:'Truly Hard Seltzer',     emoji:'💧', hydration:-15, advice:'Flavoured hard seltzer.' },
  'breezer':                  { name:'Breezer',                emoji:'🍹', hydration:-20, advice:'Bacardi fruit-flavoured alcopop.' },
  'bacardi breezer':          { name:'Bacardi Breezer',        emoji:'🍹', hydration:-20, advice:'Popular Indian alcopop.' },
  'alcopop':                  { name:'Alcopop',                emoji:'🍹', hydration:-22, advice:'Pre-mixed sweet alcoholic drink.' },
  'feni':                     { name:'Feni',                   emoji:'🥃', hydration:-65, advice:'Goan cashew/coconut spirit — very strong.' },
  'mahua':                    { name:'Mahua',                  emoji:'🌸', hydration:-60, advice:'Indian tribal flower liquor.' },
  'salfi':                    { name:'Salfi',                  emoji:'🌴', hydration:60,  advice:'Palm tree sap — fresh version mildly alcoholic.' },
  'handia':                   { name:'Handia',                 emoji:'🍚', hydration:65,  advice:'Jharkhand tribal rice beer.' },
  'chhang':                   { name:'Chhang',                 emoji:'🌾', hydration:65,  advice:'Himalayan millet/barley beer.' },
  'apong':                    { name:'Apong',                  emoji:'🍚', hydration:65,  advice:'Assamese rice beer.' },
  'lugdi':                    { name:'Lugdi',                  emoji:'🌾', hydration:65,  advice:'Himachal Pradesh local grain beer.' },
  'jand':                     { name:'Jand',                   emoji:'🌾', hydration:65,  advice:'Nepali fermented millet drink.' },
  'tongba':                   { name:'Tongba',                 emoji:'🌾', hydration:65,  advice:'Sikkim millet beer drunk with straw.' },
  'kiad':                     { name:'Kiad',                   emoji:'🍚', hydration:65,  advice:'Meghalaya tribal rice drink.' },

  // ═══════════════════════════════════════════════════════════════
  // SPECIALTY COFFEE DRINKS
  // ═══════════════════════════════════════════════════════════════
  'nitro coffee':             { name:'Nitro Cold Brew',        emoji:'☕', hydration:77,  advice:'Nitrogen-infused cold brew — smooth.' },
  'cold brew coffee':         { name:'Cold Brew Coffee',       emoji:'☕', hydration:77,  advice:'Slow-steeped cold coffee — less acidic.' },
  'espresso tonic':           { name:'Espresso Tonic',         emoji:'☕', hydration:72,  advice:'Espresso over tonic water — trendy drink.' },
  'coffee tonic':             { name:'Coffee Tonic',           emoji:'☕', hydration:72,  advice:'Cold brew with tonic — refreshing.' },
  'proffee':                  { name:'Proffee',                emoji:'☕', hydration:73,  advice:'Coffee with protein shake — fitness trend.' },
  'bullet coffee':            { name:'Bulletproof Coffee',     emoji:'☕', hydration:70,  advice:'Butter coffee — ketogenic diet drink.' },
  'keto coffee':              { name:'Keto Coffee',            emoji:'☕', hydration:70,  advice:'Fat-infused coffee for ketogenic diet.' },
  'charcoal latte':           { name:'Charcoal Latte',         emoji:'🖤', hydration:74,  advice:'Activated charcoal latte — trending.' },
  'pink latte':               { name:'Pink Latte',             emoji:'🌹', hydration:78,  advice:'Rose or beetroot latte.' },
  'blue latte':               { name:'Blue Latte',             emoji:'💙', hydration:78,  advice:'Butterfly pea flower latte.' },
  'purple latte':             { name:'Purple Latte',           emoji:'💜', hydration:78,  advice:'Ube or taro latte.' },
  'red latte':                { name:'Red Latte',              emoji:'❤️', hydration:80,  advice:'Rooibos latte — caffeine-free.' },
  'yellow latte':             { name:'Golden Latte',           emoji:'💛', hydration:82,  advice:'Turmeric golden milk latte.' },
  'cortado':                  { name:'Cortado',                emoji:'☕', hydration:76,  advice:'Equal parts espresso and milk.' },
  'gibraltar':                { name:'Gibraltar',              emoji:'☕', hydration:76,  advice:'San Francisco cortado-style coffee.' },
  'piccolo':                  { name:'Piccolo Latte',          emoji:'☕', hydration:77,  advice:'Small milk coffee.' },
  'batch brew':               { name:'Batch Brew Coffee',      emoji:'☕', hydration:80,  advice:'Filter coffee made in bulk.' },
  'pour over coffee':         { name:'Pour Over Coffee',       emoji:'☕', hydration:82,  advice:'Manual drip coffee — clean and bright.' },
  'chemex coffee':            { name:'Chemex Coffee',          emoji:'☕', hydration:82,  advice:'Clean pour-over style coffee.' },
  'aeropress coffee':         { name:'AeroPress Coffee',       emoji:'☕', hydration:80,  advice:'Versatile manual brew.' },
  'moka pot coffee':          { name:'Moka Pot Coffee',        emoji:'☕', hydration:76,  advice:'Stovetop espresso-style coffee.' },
  'siphon coffee':            { name:'Siphon Coffee',          emoji:'☕', hydration:80,  advice:'Vacuum pot coffee — very clean flavour.' },
  'coffee soda':              { name:'Coffee Soda',            emoji:'☕', hydration:70,  advice:'Sparkling coffee drink.' },
  'mazagran':                 { name:'Mazagran',               emoji:'☕', hydration:72,  advice:'Portuguese cold coffee with lemon.' },

  // ═══════════════════════════════════════════════════════════════
  // AYURVEDIC & HERBAL
  // ═══════════════════════════════════════════════════════════════
  'chyawanprash drink':       { name:'Chyawanprash Drink',     emoji:'🌿', hydration:80,  advice:'Ayurvedic herb jam mixed in milk — immunity.' },
  'shankhpushpi juice':       { name:'Shankhpushpi Juice',     emoji:'🌸', hydration:86,  advice:'Memory-enhancing Ayurvedic herb juice.' },
  'shatavari drink':          { name:'Shatavari Drink',        emoji:'🌿', hydration:82,  advice:'Women\'s health Ayurvedic tonic.' },
  'morinda drink':            { name:'Morinda Drink',          emoji:'🌿', hydration:84,  advice:'Ayurvedic root drink.' },
  'punarnava juice':          { name:'Punarnava Juice',        emoji:'🌿', hydration:88,  advice:'Kidney health Ayurvedic herb juice.' },
  'guduchi juice':            { name:'Guduchi Juice',          emoji:'🌿', hydration:88,  advice:'Immunity herb juice — same as Giloy.' },
  'haritaki drink':           { name:'Haritaki Drink',         emoji:'🌿', hydration:84,  advice:'Ayurvedic digestive herb drink.' },
  'amaltas drink':            { name:'Amaltas Drink',          emoji:'💛', hydration:85,  advice:'Golden shower tree Ayurvedic drink.' },
  'kutki drink':              { name:'Kutki Drink',            emoji:'🌿', hydration:85,  advice:'Ayurvedic liver tonic herb.' },
  'senna drink':              { name:'Senna Tea',              emoji:'🌿', hydration:86,  advice:'Digestive herb — use sparingly.' },
  'dandelion tea':            { name:'Dandelion Tea',          emoji:'🌼', hydration:92,  advice:'Liver cleansing herbal tea.' },
  'nettle tea':               { name:'Nettle Tea',             emoji:'🌿', hydration:93,  advice:'Iron-rich herbal tea.' },
  'licorice tea':             { name:'Licorice Tea',           emoji:'🌿', hydration:91,  advice:'Sweet root herbal tea — digestive.' },
  'marshmallow root tea':     { name:'Marshmallow Root Tea',   emoji:'🌿', hydration:93,  advice:'Soothing mucilaginous herbal tea.' },
  'slippery elm tea':         { name:'Slippery Elm Tea',       emoji:'🌿', hydration:91,  advice:'Gut-soothing bark tea.' },
  'cats claw tea':            { name:'Cat\'s Claw Tea',        emoji:'🌿', hydration:90,  advice:'Amazonian immune-boosting herb.' },
  'ashwagandha tea':          { name:'Ashwagandha Tea',        emoji:'🌿', hydration:90,  advice:'Adaptogen tea — stress relief.' },
  'brahmi tea':               { name:'Brahmi Tea',             emoji:'🌿', hydration:91,  advice:'Memory herb tea.' },
  'triphala tea':             { name:'Triphala Tea',           emoji:'🌿', hydration:88,  advice:'Three-fruit Ayurvedic tea — digestive.' },
  'moringa tea':              { name:'Moringa Tea',            emoji:'🌿', hydration:92,  advice:'Drumstick leaf tea — superfood.' },
  'moringa drink':            { name:'Moringa Drink',          emoji:'🌿', hydration:91,  advice:'Moringa powder drink — extremely nutritious.' },
  'amla drink':               { name:'Amla Drink',             emoji:'🟢', hydration:88,  advice:'Indian gooseberry — highest natural vitamin C.' },
  'spirulina drink':          { name:'Spirulina Drink',        emoji:'💚', hydration:88,  advice:'Algae superfood drink.' },
  'chlorella drink':          { name:'Chlorella Drink',        emoji:'💚', hydration:88,  advice:'Green algae detox drink.' },
  'sea moss drink':           { name:'Sea Moss Drink',         emoji:'🌊', hydration:90,  advice:'Caribbean superfood drink.' },
  'black seed drink':         { name:'Black Seed Drink',       emoji:'🖤', hydration:85,  advice:'Kalonji — Nigella sativa wellness drink.' },
  'gac juice':                { name:'Gac Juice',              emoji:'🔴', hydration:83,  advice:'Vietnamese superfruit — high beta-carotene.' },

  // ═══════════════════════════════════════════════════════════════
  // MISCELLANEOUS & CATCH-ALL
  // ═══════════════════════════════════════════════════════════════
  'mixed drink':              { name:'Mixed Drink',            emoji:'🍹', hydration:60,  advice:'Check ingredients — hydration varies widely.' },
  'fruit drink':              { name:'Fruit Drink',            emoji:'🧃', hydration:78,  advice:'Fruit-based beverage — watch sugar.' },
  'soft drink':               { name:'Soft Drink',             emoji:'🥤', hydration:55,  advice:'Carbonated soft drink.' },
  'cold drink':               { name:'Cold Drink',             emoji:'🥤', hydration:65,  advice:'Chilled beverage — hydration varies.' },
  'hot drink':                { name:'Hot Drink',              emoji:'☕', hydration:80,  advice:'Warm beverage — likely tea or coffee.' },
  'refreshing drink':         { name:'Refreshing Drink',       emoji:'💧', hydration:80,  advice:'Stay hydrated with this refreshing drink.' },
  'health drink':             { name:'Health Drink',           emoji:'🌿', hydration:82,  advice:'Nutritious beverage — great choice.' },
  'sports water':             { name:'Sports Water',           emoji:'💧', hydration:95,  advice:'Electrolyte-infused water.' },
  'protein water':            { name:'Protein Water',          emoji:'💧', hydration:94,  advice:'Protein-enhanced water.' },
  'caffeinated drink':        { name:'Caffeinated Drink',      emoji:'⚡', hydration:65,  advice:'Caffeine is diuretic — drink water too.' },
  'decaf coffee':             { name:'Decaf Coffee',           emoji:'☕', hydration:84,  advice:'Coffee without caffeine — more hydrating.' },
  'decaf tea':                { name:'Decaf Tea',              emoji:'🍵', hydration:92,  advice:'Tea without caffeine — very hydrating.' },
  'caffeine free drink':      { name:'Caffeine Free Drink',    emoji:'💧', hydration:88,  advice:'No caffeine — better hydration.' },
};

  /* Default for unknown items */
  const DEFAULT_RESULT = {
    name: 'Unknown Drink', emoji: '🥤', hydration: 70,
    advice: "Couldn't identify this drink precisely — defaulting to moderate hydration"
  };

const analyseColour = (imgElement) => {
    try {
      const canvas = document.createElement('canvas');
      const SIZE   = 120;
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx    = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, SIZE, SIZE);
      const px = ctx.getImageData(0, 0, SIZE, SIZE).data;

      const sat  = (r,g,b) => { const mx=Math.max(r,g,b),mn=Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; };
      const lum  = (r,g,b) => Math.round(0.299*r + 0.587*g + 0.114*b);
      const dist = (a,b)   => Math.sqrt((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2);

      // ── Step 1: Detect background from corners ──
      const cornerPx = [];
      for (let y=0; y<15; y++) for (let x=0; x<15; x++) {
        [[x,y],[SIZE-1-x,y],[x,SIZE-1-y],[SIZE-1-x,SIZE-1-y]].forEach(([cx,cy])=>{
          const i=(cy*SIZE+cx)*4; cornerPx.push([px[i],px[i+1],px[i+2]]);
        });
      }
      const bgAvg = cornerPx.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0])
                             .map(v=>Math.round(v/cornerPx.length));
      console.log(`[AIScan] BG avg: rgb(${bgAvg})`);

      // ── Step 2: Collect foreground pixels ──
      const inner = [], outer = [];
      for (let y=0; y<SIZE; y++) for (let x=0; x<SIZE; x++) {
        const i=(y*SIZE+x)*4, rgb=[px[i],px[i+1],px[i+2]];
        if (dist(rgb, bgAvg) < 40) continue; // skip background-coloured pixels
        const isInner = x>SIZE*0.2 && x<SIZE*0.8 && y>SIZE*0.15 && y<SIZE*0.85;
        (isInner ? inner : outer).push(rgb);
      }
      const fg = inner.length > 100 ? inner : [...inner,...outer];
      // If most pixels are background (uniform studio shot), colour is unreliable
      const bgCoverageRatio = 1 - (fg.length / (SIZE * SIZE));
      if (bgCoverageRatio > 0.7) {
        console.log('[AIScan] Background covers >70% of image — skipping colour analysis');
        return null;
      }
      if (fg.length < 80) fg.push(...Array.from({length:SIZE*SIZE},(_,i)=>{ const j=i*4; return [px[j],px[j+1],px[j+2]]; }));

      const avg = (arr) => { if(!arr.length) return [128,128,128]; const s=arr.reduce((a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],[0,0,0]); return s.map(v=>Math.round(v/arr.length)); };
      const [wr,wg,wb] = avg([...fg,...fg,...inner]); // inner weighted 3x
      const wLum = lum(wr,wg,wb), wSat = sat(wr,wg,wb);
      console.log(`[AIScan] FG colour: rgb(${wr},${wg},${wb}) lum:${wLum} sat:${wSat.toFixed(2)} fg_px:${fg.length}`);

      // ── Step 3: Pixel signature counting ──
      // Count pixels matching specific drink profiles
      const counts = {
        brown:  fg.filter(([r,g,b])=>r>80&&r<210&&r>g*1.12&&r>b*1.25&&g>35&&b<130&&lum(r,g,b)<160).length,
        cream:  fg.filter(([r,g,b])=>r>170&&g>140&&b>110&&r>g&&r>b&&sat(r,g,b)<0.3).length,
        dark:   fg.filter(([r,g,b])=>lum(r,g,b)<75).length,
        amber:  fg.filter(([r,g,b])=>r>150&&g>90&&g<175&&b<90&&r>g*1.15).length,
        orange: fg.filter(([r,g,b])=>r>180&&g>70&&g<155&&b<80&&r>g*1.4).length,
        yellow: fg.filter(([r,g,b])=>r>200&&g>175&&b<110&&sat(r,g,b)>0.15).length,
        green:  fg.filter(([r,g,b])=>g>r+10&&g>b+20&&g>80).length,
        red:    fg.filter(([r,g,b])=>r>130&&r>g*1.8&&r>b*1.8).length,
        white:  fg.filter(([r,g,b])=>lum(r,g,b)>200&&sat(r,g,b)<0.1).length,
        clear:  fg.filter(([r,g,b])=>lum(r,g,b)>220&&sat(r,g,b)<0.06).length,
      };
      const total = fg.length || 1;
      const pct = {}; for (const [k,v] of Object.entries(counts)) pct[k]=v/total;
      console.log(`[AIScan] Pixel%: brown:${(pct.brown*100).toFixed(0)} cream:${(pct.cream*100).toFixed(0)} dark:${(pct.dark*100).toFixed(0)} amber:${(pct.amber*100).toFixed(0)} orange:${(pct.orange*100).toFixed(0)} yellow:${(pct.yellow*100).toFixed(0)} green:${(pct.green*100).toFixed(0)}`);

      // ── Step 4: Rule-based classification from pixel signatures ──

      // COFFEE / COLD COFFEE: brown + cream + possibly dark
      const coffeeScore    = pct.brown*3.0 + pct.cream*1.5 + pct.dark*0.8;
      const coldCoffeeScore = pct.cream*2.5 + pct.brown*2.0 + pct.amber*0.8;
      if (coffeeScore > 0.6 || coldCoffeeScore > 0.9) {
        const type = (pct.cream > pct.brown && wLum > 100) ? 'cold-coffee' : 'coffee';
        console.log(`[AIScan] Coffee score:${coffeeScore.toFixed(2)} coldCoffee:${coldCoffeeScore.toFixed(2)} → ${type}`);
        return type;
      }

      // COLA: very dark, minimal colour
      if (pct.dark > 0.55 && wSat < 0.25) return 'cola';

      // TEA: amber, lighter than coffee
      if (pct.amber > 0.35 && pct.brown < 0.2 && wLum > 100) return 'tea';

      // BEER: amber/golden, fairly bright
      if (pct.amber > 0.25 && wLum > 130 && wg > 100) return 'beer';

      // ORANGE JUICE: strong orange
      if (pct.orange > 0.3 && wr > 170) return 'orange juice';

      // MANGO DRINK: yellower orange
      if ((pct.yellow > 0.25 || pct.orange > 0.2) && wr > 190 && wg > 140) return 'mango';

      // LEMONADE: yellow with visible saturation
      if (pct.yellow > 0.3 && wSat > 0.15) return 'lemonade';

      // GREEN TEA / MATCHA
      if (pct.green > 0.3 && wSat > 0.12) return 'green tea';

      // RED WINE
      if (pct.red > 0.35 && wLum < 120) return 'wine';

      // FRUIT PUNCH
      if (pct.red > 0.35 && wLum > 120) return 'fruit punch';

      // MILK: white/cream dominant, very low sat
      if ((pct.white + pct.cream) > 0.5 && wSat < 0.12) return 'milk';

      // WATER: very clear, near-white after bg removal
      if (pct.clear > 0.4 && wSat < 0.06) return 'water';

      // PACKAGING fallback (outer pixels — bottle/can colour is a strong drink signal)
      if (outer.length > 30) {
        const [or,og,ob] = avg(outer);
        const oSat = sat(or,og,ob);
        if (or>200&&og>140&&og<220&&ob<90&&oSat>0.25)   return 'mango';      // yellow/orange pack → mango
        if (or>170&&og<80&&ob<80&&oSat>0.35)             return 'cola';       // red pack → cola
        if (ob>120&&ob>or+20&&ob>og+15)                  return 'water';      // blue pack → water
        if (og>or+15&&og>ob+15&&og>80&&oSat>0.2) {
          // Green packaging — could be Sprite/7Up (soda) or Dew (soda) or green tea
          // If liquid pixels are mostly clear/white → it's a soda (clear liquid in green bottle)
          const clearLiquid = pct.clear > 0.2 || pct.white > 0.25 || wSat < 0.1;
          return clearLiquid ? 'soda' : 'green tea';  // Sprite = clear liquid in green bottle
        }
        if (or>180&&og>150&&ob<60&&oSat>0.3)             return 'lemonade';   // bright yellow pack → lemonade
      }

      return null;
    } catch(e) {
      console.warn('[AIScan] Colour analysis failed:', e.message);
      return null;
    }
  };

    /* ══════════════════════════════════════════
     FLOATING ACTION BUTTON
     Fixed for mobile: touchstart/touchend instead of
     pointer events to avoid capture conflicts on iOS/Android
  ══════════════════════════════════════════ */
  const initFAB = () => {
    if (Utils.el('scanFAB')) return;

    if (!document.getElementById('fabStyle')) {
      const s = document.createElement('style');
      s.id = 'fabStyle';
      s.textContent = `
        @keyframes fabPulse {
          0%   { box-shadow: 0 6px 24px rgba(0,200,83,0.5); }
          50%  { box-shadow: 0 6px 36px rgba(0,200,83,0.8), 0 0 0 14px rgba(0,200,83,0.12); }
          100% { box-shadow: 0 6px 24px rgba(0,200,83,0.5); }
        }
        @keyframes fabDrop {
          from { opacity:0; transform:scale(0.4) rotate(-20deg); }
          60%  { transform:scale(1.12) rotate(4deg); }
          80%  { transform:scale(0.96) rotate(-2deg); }
          to   { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes scanSpin { to { transform:rotate(360deg); } }
        @keyframes resultSlideIn {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        /* Critical mobile fix: touch-action none prevents scroll interference */
        #scanFAB {
          touch-action: none;
          -webkit-touch-callout: none;
          user-select: none;
          -webkit-user-select: none;
          cursor: pointer;
        }
      `;
      document.head.appendChild(s);
    }

    const FAB_POS_KEY = 'wt_fab_pos';
    const SIZE   = 64;   /* bigger tap target on mobile */
    const MARGIN = 16;

    const loadPos = () => {
      try {
        const p = JSON.parse(localStorage.getItem(FAB_POS_KEY));
        if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
      } catch {}
      return null;
    };
    const savePos = (x, y) => localStorage.setItem(FAB_POS_KEY, JSON.stringify({ x, y }));

    const clamp = (x, y) => ({
      x: Math.max(MARGIN, Math.min(window.innerWidth  - SIZE - MARGIN, x)),
      y: Math.max(MARGIN, Math.min(window.innerHeight - SIZE - MARGIN, y)),
    });

    const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '68');
    const sideW  = window.innerWidth >= 1024 ? 260 : 0;
    const defPos = clamp(sideW + MARGIN, window.innerHeight - SIZE - navH - MARGIN - 8);
    const pos    = clamp((loadPos() || defPos).x, (loadPos() || defPos).y);

    const fab = document.createElement('button');
    fab.id   = 'scanFAB';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Scan a drink with AI');
    fab.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;pointer-events:none;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M22 5h-6v6h6V5zm-6 8h1.5v1.5H16V13zm1.5 1.5H19V16h-1.5v-1.5zM19 13h1.5v1.5H19V13zm-3 3h1.5v1.5H16V16zm1.5 1.5H19V19h-1.5v-1.5zM19 16h1.5v1.5H19V16zm1.5-1.5H22V16h-1.5v-1.5zm0 3H22V19h-1.5v-1.5zM22 13h-1.5v1.5H22V13z"/>
        </svg>
        <span style="font-size:9px;font-weight:800;letter-spacing:0.5px;line-height:1;">SCAN</span>
      </div>
    `;

    Object.assign(fab.style, {
      position:       'fixed',
      left:           pos.x + 'px',
      top:            pos.y + 'px',
      width:          SIZE + 'px',
      height:         SIZE + 'px',
      borderRadius:   '50%',
      background:     'linear-gradient(135deg,#00C853,#1A73E8)',
      color:          '#fff',
      border:         'none',
      boxShadow:      '0 6px 24px rgba(0,200,83,0.5), 0 2px 8px rgba(0,0,0,0.2)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      zIndex:         '1000',
      fontFamily:     'var(--font-body)',
      outline:        '3px solid rgba(255,255,255,0.35)',
      outlineOffset:  '2px',
      animation:      'fabDrop 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
      WebkitTapHighlightColor: 'transparent',
    });

    document.body.appendChild(fab);

    /* ── Drag / tap state ── */
    let dragging = false, moved = false;
    let startX = 0, startY = 0, fabX = 0, fabY = 0;
    const THRESH = 8;

    const onStart = (cx, cy) => {
      dragging = true; moved = false;
      startX = cx; startY = cy;
      fabX   = parseInt(fab.style.left);
      fabY   = parseInt(fab.style.top);
      fab.style.boxShadow = '0 14px 40px rgba(0,200,83,0.6), 0 4px 16px rgba(0,0,0,0.3)';
    };
    const onMove = (cx, cy) => {
      if (!dragging) return;
      const dx = cx - startX, dy = cy - startY;
      if (!moved && Math.hypot(dx, dy) > THRESH) moved = true;
      if (!moved) return;
      fab.style.animation = 'none';
      const c = clamp(fabX + dx, fabY + dy);
      fab.style.left = c.x + 'px'; fab.style.top = c.y + 'px';
    };
    const onEnd = () => {
      if (!dragging) return;
      dragging = false;
      fab.style.boxShadow = '0 6px 24px rgba(0,200,83,0.5), 0 2px 8px rgba(0,0,0,0.2)';
      if (moved) {
        const cx = parseInt(fab.style.left), cy = parseInt(fab.style.top);
        const mid = window.innerWidth / 2;
        const snapX = (cx + SIZE/2) < mid ? MARGIN : window.innerWidth - SIZE - MARGIN;
        const s = clamp(snapX, cy);
        fab.style.transition = 'left 0.35s cubic-bezier(0.22,1,0.36,1), top 0.35s cubic-bezier(0.22,1,0.36,1)';
        fab.style.left = s.x + 'px'; fab.style.top = s.y + 'px';
        savePos(s.x, s.y);
        setTimeout(() => { fab.style.transition = ''; }, 400);
      } else {
        showScanModal();
      }
    };

    /* Touch events (mobile) */
    fab.addEventListener('touchstart', e => {
      e.preventDefault();  /* prevent ghost click */
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    fab.addEventListener('touchmove', e => {
      e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    fab.addEventListener('touchend', e => {
      e.preventDefault();
      onEnd();
    }, { passive: false });

    /* Mouse events (desktop) */
    fab.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', e => { if (dragging) onMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup',   ()  => { if (dragging) onEnd(); });

    fab.addEventListener('mouseenter', () => {
      if (dragging) return;
      fab.style.transform = 'scale(1.1)';
      fab.style.boxShadow = '0 8px 32px rgba(0,200,83,0.65)';
    });
    fab.addEventListener('mouseleave', () => {
      fab.style.transform = '';
      fab.style.boxShadow = '0 6px 24px rgba(0,200,83,0.5), 0 2px 8px rgba(0,0,0,0.2)';
    });

    window.addEventListener('resize', () => {
      const c = clamp(parseInt(fab.style.left), parseInt(fab.style.top));
      fab.style.left = c.x + 'px'; fab.style.top = c.y + 'px';
      savePos(c.x, c.y);
    });

    setTimeout(() => {
      if (!dragging) fab.style.animation = 'fabPulse 1.8s ease 3';
    }, 700);
  };

/* ══════════════════════════════════════════
     SCAN MODAL
  ══════════════════════════════════════════ */
  const showScanModal = () => {
    if (_overlay) return;
    _overlay = document.createElement('div');
    _overlay.id = 'scanOverlay';
    _overlay.style.cssText = `
      position:fixed;inset:0;z-index:2000;
      background:rgba(0,0,0,0.65);
      display:flex;
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      box-sizing:border-box;
    `;
    // CSS handles alignment per breakpoint (bottom on phone, center on tablet+)

    _overlay.innerHTML = buildModalHTML();
    document.body.appendChild(_overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const sheet = _overlay.querySelector('#scanSheet');
        if (sheet) {
          sheet.style.transform = 'translateY(0)';
          sheet.style.opacity   = '1';
        }
      });
    });

    bindEvents();

    // Nyckel AI — no pre-loading needed
  };

  const buildModalHTML = () => `
    <div id="scanSheet" style="
      background:var(--md-surface,#1E2128);
      border-radius:24px 24px 0 0;
      width:100%;
      max-width:100%;
      margin:0;
      padding:0;
      transform:translateY(100%);
      opacity:0;
      transition:transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.35s;
      max-height:90vh;
      overflow-y:auto;
      overflow-x:hidden;
      box-shadow:0 24px 80px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3);
    ">

      <!-- ── HEADER ── -->
      <div style="
        background:linear-gradient(135deg,#00C853 0%,#1A73E8 100%);
        padding:18px 20px 22px;
        border-radius:28px 28px 0 0;
        position:relative;overflow:hidden;
        flex-shrink:0;
      ">
        <!-- Decorative blobs -->
        <div style="position:absolute;top:-24px;right:-24px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.1);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-20px;left:20%;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,0.07);pointer-events:none;"></div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;position:relative;">
          <div style="min-width:0;">
            <div style="color:#fff;font-size:19px;font-weight:700;font-family:var(--font-display);display:flex;align-items:center;gap:8px;">
              <span style="font-size:22px;">🔬</span> Drink Scanner
            </div>
            <div style="color:rgba(255,255,255,0.8);font-size:11px;margin-top:2px;">Nyckel AI · Colour analysis offline</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <span id="modelStatus" style="
              font-size:10px;font-weight:700;
              background:rgba(52,168,83,0.25);
              border:1px solid rgba(52,168,83,0.5);
              padding:4px 10px;border-radius:99px;
              color:#fff;white-space:nowrap;
              backdrop-filter:blur(4px);
              transition:all 0.3s;
            ">🎯 Nyckel AI</span>
            <button id="closeScan" style="
              background:rgba(255,255,255,0.2);border:none;color:#fff;
              width:34px;height:34px;border-radius:50%;cursor:pointer;
              font-size:18px;line-height:1;
              display:flex;align-items:center;justify-content:center;
              transition:background 0.18s, transform 0.18s;
              flex-shrink:0;
            " onmouseenter="this.style.background='rgba(255,255,255,0.35)';this.style.transform='scale(1.1)'"
               onmouseleave="this.style.background='rgba(255,255,255,0.2)';this.style.transform=''">✕</button>
          </div>
        </div>
      </div>

      <!-- ── BODY ── -->
      <div style="padding:20px;">

        <!-- Mode tabs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
          <button class="scan-tab-btn" data-mode="upload" style="
            padding:10px 6px;border-radius:14px;
            border:2px solid #00C853;
            background:rgba(0,200,83,0.12);
            color:#00C853;
            font-weight:700;font-size:12px;cursor:pointer;
            font-family:var(--font-body);
            transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
            display:flex;flex-direction:column;align-items:center;gap:4px;
          ">
            <span style="font-size:20px;">📷</span>
            <span>Upload</span>
          </button>
          <button class="scan-tab-btn" data-mode="camera" style="
            padding:10px 6px;border-radius:14px;
            border:2px solid var(--md-outline,#DADCE0);
            background:var(--md-surface-2,#2A2D36);
            color:var(--md-on-surface-med,#8A8F9A);
            font-weight:600;font-size:12px;cursor:pointer;
            font-family:var(--font-body);
            transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
            display:flex;flex-direction:column;align-items:center;gap:4px;
          ">
            <span style="font-size:20px;">📸</span>
            <span>Camera</span>
          </button>
          <button class="scan-tab-btn" data-mode="label" style="
            padding:10px 6px;border-radius:14px;
            border:2px solid var(--md-outline,#DADCE0);
            background:var(--md-surface-2,#2A2D36);
            color:var(--md-on-surface-med,#8A8F9A);
            font-weight:600;font-size:12px;cursor:pointer;
            font-family:var(--font-body);
            transition:all 0.2s cubic-bezier(0.22,1,0.36,1);
            display:flex;flex-direction:column;align-items:center;gap:4px;
          ">
            <span style="font-size:20px;">🏷️</span>
            <span>Label</span>
          </button>
        </div>

        <!-- ── UPLOAD PANEL ── -->
        <div id="uploadPanel">
          <!-- Drop zone -->
          <div id="dropZone" style="
            border:2px dashed #00C853;border-radius:20px;
            padding:32px 16px;text-align:center;cursor:pointer;
            background:linear-gradient(135deg,rgba(0,200,83,0.08),rgba(26,115,232,0.08));
            transition:all 0.22s cubic-bezier(0.22,1,0.36,1);
            position:relative;overflow:hidden;
          ">
            <div style="font-size:48px;margin-bottom:10px;display:inline-block;animation:float 2s ease-in-out infinite;">🥤</div>
            <div style="font-size:14px;font-weight:700;color:var(--md-on-background,#E3E3E8);">Drop your drink photo here</div>
            <div style="font-size:12px;color:var(--md-on-surface-med,#8A8F9A);margin-top:6px;line-height:1.5;">
              or tap to choose from camera / gallery
            </div>
            <!-- Styled upload button overlaid -->
            <div style="
              margin-top:14px;display:inline-flex;align-items:center;gap:6px;
              background:linear-gradient(135deg,#00C853,#1A73E8);
              color:#fff;border-radius:99px;padding:8px 20px;
              font-size:13px;font-weight:700;font-family:var(--font-body);
            ">📁 Choose File</div>
            <!-- CHANGE-4: removed capture="environment" so mobile users can choose gallery OR camera -->
            <input type="file" id="scanFileInput" accept="image/*"
              style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />
          </div>

          <!-- Preview -->
          <div id="imgPreviewWrap" style="display:none;margin-top:14px;">
            <div style="position:relative;border-radius:18px;overflow:hidden;max-height:200px;background:#000;">
              <img id="scanPreview" style="width:100%;object-fit:cover;display:block;border-radius:18px;max-height:200px;" />
              <div style="
                position:absolute;bottom:0;left:0;right:0;
                background:linear-gradient(transparent,rgba(0,0,0,0.6));
                padding:10px 12px;border-radius:0 0 18px 18px;
                display:flex;justify-content:flex-end;
              ">
                <button id="clearImg" style="
                  background:rgba(255,255,255,0.9);border:none;
                  border-radius:99px;padding:5px 12px;
                  font-size:12px;font-weight:700;cursor:pointer;
                  font-family:var(--font-body);color:#D93025;
                  transition:all 0.15s;
                ">✕ Remove</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── CAMERA PANEL ── -->
        <div id="cameraPanel" style="display:none;">
          <div style="position:relative;border-radius:20px;overflow:hidden;background:#111;aspect-ratio:4/3;">
            <video id="scanVideo" autoplay playsinline muted
              style="width:100%;height:100%;object-fit:cover;display:block;"></video>
            <!-- Scan frame -->
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;">
              <div style="width:58%;aspect-ratio:1;position:relative;">
                <!-- Corners -->
                <div style="position:absolute;top:0;left:0;width:22px;height:22px;border-top:3px solid #00C853;border-left:3px solid #00C853;border-radius:4px 0 0 0;"></div>
                <div style="position:absolute;top:0;right:0;width:22px;height:22px;border-top:3px solid #00C853;border-right:3px solid #00C853;border-radius:0 4px 0 0;"></div>
                <div style="position:absolute;bottom:0;left:0;width:22px;height:22px;border-bottom:3px solid #00C853;border-left:3px solid #00C853;border-radius:0 0 0 4px;"></div>
                <div style="position:absolute;bottom:0;right:0;width:22px;height:22px;border-bottom:3px solid #00C853;border-right:3px solid #00C853;border-radius:0 0 4px 0;"></div>
                <!-- Dim outside -->
                <div style="position:absolute;inset:0;box-shadow:0 0 0 9999px rgba(0,0,0,0.4);pointer-events:none;"></div>
              </div>
            </div>
            <!-- Scan line animation -->
            <div id="scanLine" style="
              position:absolute;left:21%;right:21%;height:2px;top:21%;
              background:linear-gradient(90deg,transparent,#00C853,transparent);
              animation:scanLineAnim 2s ease-in-out infinite;
            "></div>
          </div>
          <div style="display:flex;gap:10px;margin-top:12px;">
            <button id="captureBtn" style="
              flex:2;padding:14px;border-radius:14px;border:none;
              background:linear-gradient(135deg,#00C853,#1A73E8);
              color:#fff;font-size:14px;font-weight:700;cursor:pointer;
              font-family:var(--font-body);
              box-shadow:0 4px 14px rgba(0,200,83,0.35);
              transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);
            ">📸 Capture & Analyse</button>
            <button id="stopCameraBtn" style="
              flex:1;padding:14px;border-radius:14px;
              border:1.5px solid var(--md-outline,#33383F);
              background:var(--md-surface-2,#2A2D36);
              color:var(--md-on-surface-med,#8A8F9A);
              font-size:13px;font-weight:600;cursor:pointer;
              font-family:var(--font-body);transition:all 0.2s;
            ">■ Stop</button>
          </div>
        </div>

        <!-- ── LABEL PANEL ── -->
        <div id="labelPanel" style="display:none;">
          <div style="
            background:linear-gradient(135deg,rgba(255,152,0,0.1),rgba(255,193,7,0.08));
            border:1.5px solid rgba(255,152,0,0.4);
            border-radius:20px;padding:24px 16px;
          ">
            <div style="text-align:center;margin-bottom:16px;">
              <div style="font-size:40px;margin-bottom:8px;">🏷️</div>
              <div style="font-size:14px;font-weight:700;color:var(--md-on-background,#E3E3E8);">Scan Nutrition Label</div>
              <div style="font-size:12px;color:var(--md-on-surface-med,#8A8F9A);margin-top:6px;line-height:1.5;">
                Take a photo of the nutrition facts label on any bottle or can
              </div>
            </div>
            <!-- Styled file button -->
            <div style="position:relative;display:block;">
              <div style="
                display:flex;align-items:center;justify-content:center;gap:8px;
                background:linear-gradient(135deg,rgba(255,152,0,0.9),rgba(230,115,0,0.9));
                color:#fff;border-radius:14px;padding:13px;
                font-size:14px;font-weight:700;font-family:var(--font-body);
                box-shadow:0 4px 14px rgba(255,152,0,0.3);
                cursor:pointer;
              ">
                📁 Choose Nutrition Label Photo
              </div>
              <!-- CHANGE-4: removed capture="environment" so mobile users can choose gallery OR camera -->
              <input type="file" id="labelFileInput" accept="image/*"
                style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;" />
            </div>
          </div>

          <!-- Label preview -->
          <div id="labelPreviewWrap" style="display:none;margin-top:12px;">
            <img id="labelPreview" style="
              max-width:100%;max-height:160px;border-radius:14px;
              object-fit:contain;display:block;margin:0 auto;
            " />
          </div>
        </div>

        <!-- ── ANALYSE BUTTON ── -->
        <button id="analyseBtn" style="
          width:100%;margin-top:18px;padding:15px;
          background:linear-gradient(135deg,#00C853,#1A73E8);
          color:#fff;border:none;border-radius:16px;
          font-size:15px;font-weight:700;cursor:pointer;
          font-family:var(--font-body);
          box-shadow:0 6px 18px rgba(0,200,83,0.4);
          transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          display:none;letter-spacing:0.2px;
        ">🔬 Identify Drink</button>

        <!-- ── RESULT ── -->
        <div id="scanResult" style="display:none;margin-top:18px;"></div>

      </div>
    </div>

    <style>
      @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
      @keyframes scanLineAnim {
        0%   { top:21%; opacity:1; }
        90%  { top:79%; opacity:1; }
        100% { top:21%; opacity:0; }
      }
    </style>
  `;

  /* ══════════════════════════════════════════
     EVENT BINDING
  ══════════════════════════════════════════ */
  const bindEvents = () => {
    _overlay.querySelector('#closeScan').addEventListener('click', closeModal);
    _overlay.addEventListener('click', e => { if (e.target === _overlay) closeModal(); });

    // Tab switching
    _overlay.querySelectorAll('.scan-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.mode));
    });

    // Upload panel
    const dz        = _overlay.querySelector('#dropZone');
    const fileInput = _overlay.querySelector('#scanFileInput');
    // Input covers the full dropzone with opacity:0 — no extra click handler needed
    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.style.borderColor = '#00C853';
      dz.style.background  = 'linear-gradient(135deg,#C8E6C9,#BBDEFB)';
    });
    dz.addEventListener('dragleave', () => {
      dz.style.borderColor = '#00C853';
      dz.style.background  = 'linear-gradient(135deg,#E8F5E9,#E3F2FD)';
    });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.style.background = 'linear-gradient(135deg,#E8F5E9,#E3F2FD)';
      if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0], 'upload');
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) loadImageFile(fileInput.files[0], 'upload');
    });
    _overlay.querySelector('#clearImg').addEventListener('click', clearImage);

    // Camera panel
    _overlay.querySelector('#captureBtn').addEventListener('click',    captureFrame);
    const stopBtn = _overlay.querySelector('#stopCameraBtn');
    stopBtn.addEventListener('click', stopCamera);
    stopBtn.addEventListener('mouseenter', () => {
      stopBtn.style.background   = '#D93025';
      stopBtn.style.color        = '#fff';
      stopBtn.style.borderColor  = '#D93025';
      stopBtn.style.transform    = 'scale(1.04)';
      stopBtn.style.boxShadow    = '0 4px 14px rgba(217,48,37,0.35)';
      stopBtn.style.transition   = 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)';
    });
    stopBtn.addEventListener('mouseleave', () => {
      stopBtn.style.background   = 'var(--md-surface-2,#2A2D36)';
      stopBtn.style.color        = 'var(--md-on-surface-med,#8A8F9A)';
      stopBtn.style.borderColor  = 'var(--md-outline,#33383F)';
      stopBtn.style.transform    = '';
      stopBtn.style.boxShadow    = '';
    });
    stopBtn.addEventListener('mousedown', () => {
      stopBtn.style.transform = 'scale(0.95)';
    });
    stopBtn.addEventListener('mouseup', () => {
      stopBtn.style.transform = '';
    });

    // Label panel
    _overlay.querySelector('#labelFileInput').addEventListener('change', function() {
      if (this.files[0]) loadImageFile(this.files[0], 'label');
    });

    // Analyse button
    _overlay.querySelector('#analyseBtn').addEventListener('click', runAnalysis);
  };

  const switchTab = (mode) => {
    _overlay.querySelectorAll('.scan-tab-btn').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.style.borderColor = active ? '#00C853' : 'var(--md-outline,#33383F)';
      btn.style.background  = active ? 'rgba(0,200,83,0.12)' : 'var(--md-surface-2,#2A2D36)';
      btn.style.color       = active ? '#00C853' : 'var(--md-on-surface-med,#8A8F9A)';
      btn.style.fontWeight  = active ? '700' : '600';
      btn.style.transform   = active ? 'scale(1.03)' : '';
      btn.style.boxShadow   = active ? '0 2px 10px rgba(0,200,83,0.2)' : '';
    });

    ['upload','camera','label'].forEach(p => {
      const el = _overlay.querySelector(`#${p}Panel`);
      if (el) {
        el.style.display = p === mode ? 'block' : 'none';
        if (p === mode) el.style.animation = 'resultSlideIn 0.25s cubic-bezier(0.22,1,0.36,1)';
      }
    });

    if (mode === 'camera') startCamera();
    else stopCamera();
  };

  /* ══════════════════════════════════════════
     IMAGE LOADING
  ══════════════════════════════════════════ */
  const loadImageFile = (file, panel) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      if (panel === 'upload') {
        const preview = _overlay.querySelector('#scanPreview');
        if (preview) preview.src = src;
        _overlay.querySelector('#imgPreviewWrap').style.display = 'block';
        _overlay.querySelector('#dropZone').style.display = 'none';
      } else if (panel === 'label') {
        const preview = _overlay.querySelector('#labelPreview');
        if (preview) { preview.src = src; preview.parentElement.style.display = 'block'; }
      }

      // Create image element for classification — tag with source panel
      const img    = new Image();
      img.onload   = () => { _imageData = { element: img, src, fromLabel: panel === 'label' }; };
      img.src      = src;

      const ab = _overlay.querySelector('#analyseBtn');
      ab.style.display = 'block';
      ab.onmouseenter = () => { ab.style.transform='translateY(-2px)';ab.style.boxShadow='0 10px 28px rgba(0,200,83,0.55)'; };
      ab.onmouseleave = () => { ab.style.transform='';ab.style.boxShadow='0 6px 18px rgba(0,200,83,0.4)'; };
      ab.onmousedown  = () => { ab.style.transform='scale(0.97)'; };
      ab.onmouseup    = () => { ab.style.transform=''; };
      _overlay.querySelector('#scanResult').style.display = 'none';
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    _imageData = null;
    _overlay.querySelector('#imgPreviewWrap').style.display = 'none';
    _overlay.querySelector('#dropZone').style.display = 'block';
    _overlay.querySelector('#analyseBtn').style.display = 'none';
    _overlay.querySelector('#scanResult').style.display = 'none';
    _overlay.querySelector('#scanFileInput').value = '';
  };

  /* ══════════════════════════════════════════
     CAMERA
  ══════════════════════════════════════════ */
  const startCamera = async () => {
    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      const video = _overlay.querySelector('#scanVideo');
      if (video) { video.srcObject = _stream; await video.play(); }
    } catch(e) {
      Utils.showToast('📷 Camera access denied or unavailable');
      switchTab('upload');
    }
  };

  const stopCamera = () => {
    if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  };

  const captureFrame = () => {
    const video  = _overlay.querySelector('#scanVideo');
    if (!video || !_stream) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const src = canvas.toDataURL('image/jpeg', 0.9);
    const img = new Image();
    img.onload = () => { _imageData = { element: img, src, fromLabel: false }; };
    img.src = src;
    stopCamera();
    // Show captured frame as preview
    const panel = _overlay.querySelector('#cameraPanel');
    if (panel) panel.innerHTML = `
      <div style="position:relative;border-radius:20px;overflow:hidden;">
        <img src="${src}" style="width:100%;border-radius:20px;display:block;" />
        <div style="position:absolute;inset:0;background:rgba(0,200,83,0.15);border-radius:20px;
          display:flex;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:99px;padding:8px 18px;font-size:13px;font-weight:700;color:#1B5E20;">
            ✅ Captured!
          </div>
        </div>
      </div>
    `;
    _overlay.querySelector('#analyseBtn').style.display = 'block';
  };

    /* ══════════════════════════════════════════
     RUN ANALYSIS — Nyckel AI + colour fallback
  ══════════════════════════════════════════ */

  /* ══════════════════════════════════════════
     Nyckel AI — beverage classifier
  ══════════════════════════════════════════ */
  const NYCKEL_CLIENT_ID     = 'uox6yfnp80plczyona7gzfmz2fiutyai';
  const NYCKEL_CLIENT_SECRET = 'epyl9ejulcmznz6e4zuu2bqe2x3ixsv9q77m0cf8rcunsnb394qu4ff2zkjbb0wt';
  const NYCKEL_FUNCTION_ID   = 'beverage-types';

  let _nyckelToken = null, _nyckelTokenExp = 0;

  const getNyckelToken = async () => {
    if (_nyckelToken && Date.now() < _nyckelTokenExp - 10000) return _nyckelToken;
    const body = `grant_type=client_credentials&client_id=${NYCKEL_CLIENT_ID}&client_secret=${NYCKEL_CLIENT_SECRET}`;
    const r = await fetch('https://www.nyckel.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!r.ok) throw new Error('Nyckel auth failed: ' + r.status);
    const d = await r.json();
    _nyckelToken    = d.access_token;
    _nyckelTokenExp = Date.now() + (d.expires_in ?? 3600) * 1000;
    return _nyckelToken;
  };

  const callNyckel = async (imgElement) => {
    const canvas = document.createElement('canvas');
    const MAX = 512;
    const sw = imgElement.naturalWidth  || imgElement.width  || MAX;
    const sh = imgElement.naturalHeight || imgElement.height || MAX;
    const sc = Math.min(MAX / sw, MAX / sh, 1);
    canvas.width  = Math.round(sw * sc);
    canvas.height = Math.round(sh * sc);
    canvas.getContext('2d').drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.88);

    const token = await getNyckelToken();
    const r = await fetch(`https://www.nyckel.com/v1/functions/${NYCKEL_FUNCTION_ID}/invoke`, {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: b64 }),
      signal:  AbortSignal.timeout(15000),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error('Nyckel ' + r.status + ': ' + t.slice(0, 100));
    }
    const data  = await r.json();
    console.log('[Nyckel] raw:', JSON.stringify(data).slice(0, 200));

    const label = (data.labelName ?? '').toLowerCase().trim();
    const conf  = data.confidence ?? 0;
    if (!label) throw new Error('Nyckel returned empty label');
    console.log('[Nyckel] ✅', label, (conf * 100).toFixed(1) + '%');

    const key = mapNyckelLabel(label);
    if (!key || !DRINK_MAP[key]) {
      return {
        name:       label.charAt(0).toUpperCase() + label.slice(1),
        emoji:      '🥤',
        hydration:  label.match(/beer|wine|whiskey|vodka|alcohol|spirit|rum|cocktail/) ? -40 : 70,
        advice:     'Identified by Nyckel AI',
        confidence: conf,
        rawLabel:   'Nyckel: ' + label,
        fromAI:     true,
      };
    }
    return { ...DRINK_MAP[key], confidence: conf, rawLabel: 'Nyckel: ' + label, fromAI: true };
  };

  const mapNyckelLabel = (l) => {
    if (l.includes('cold coffee') || l.includes('iced coffee') || l.includes('cold brew')) return 'cold-coffee';
    if (l.includes('espresso'))                         return 'espresso';
    if (l.includes('latte') || l.includes('cappuccino')) return 'coffee';
    if (l.includes('coffee'))                           return 'coffee';
    if (l.includes('green tea') || l.includes('matcha')) return 'green tea';
    if (l.includes('tea') || l.includes('chai'))        return 'tea';
    if (l.includes('coconut water'))                    return 'coconut water';
    if (l.includes('water'))                            return 'water';
    if (l.includes('lassi'))                            return 'lassi';
    if (l.includes('milkshake') || l.includes('shake')) return 'milkshake';
    if (l.includes('milk'))                             return 'milk';
    if (l.includes('orange juice'))                     return 'orange juice';
    if (l.includes('mango') || l.includes('frooti') || l.includes('maaza')) return 'mango';
    if (l.includes('lemonade') || l.includes('nimbu'))  return 'nimbu pani';
    if (l.includes('sugarcane'))                        return 'sugarcane juice';
    if (l.includes('smoothie'))                         return 'smoothie';
    if (l.includes('sprite') || l.includes('7up'))      return 'sprite';
    if (l.includes('fanta'))                            return 'fanta';
    if (l.includes('cola') || l.includes('coke') || l.includes('pepsi') || l.includes('thums up')) return 'cola';
    if (l.includes('soda') || l.includes('soft drink')) return 'soda';
    if (l.includes('wine'))                             return 'wine';
    if (l.includes('beer'))                             return 'beer';
    if (l.includes('whiskey') || l.includes('whisky') || l.includes('scotch') || l.includes('bourbon')) return 'whiskey';
    if (l.includes('vodka'))                            return 'vodka';
    if (l.includes('rum') || l.includes('gin') || l.includes('spirit') || l.includes('alcohol')) return 'cocktail';
    if (l.includes('cocktail') || l.includes('mixed'))  return 'cocktail';
    if (l.includes('energy') || l.includes('red bull') || l.includes('monster')) return 'energy drink';
    if (l.includes('sport') || l.includes('gatorade'))  return 'gatorade';
    if (l.includes('hot chocolate') || l.includes('cocoa')) return 'hot chocolate';
    if (l.includes('juice'))                            return 'juice';
    if (l.includes('protein'))                          return 'milkshake';
    if (l.includes('yakult') || l.includes('probiotic')) return 'yakult';
    return null;
  };

  const runAnalysis = async () => {
    if (!_imageData) { Utils.showToast('Please select or capture an image first'); return; }

    const btn       = _overlay.querySelector('#analyseBtn');
    const resultDiv = _overlay.querySelector('#scanResult');

    /* ── Token / rate-limit check ─────────────────────────────
       Checks role limits before calling the backend.
       Admin + Maggie pass through immediately.
       User (6/day) and Pro (450/month) are enforced here.
       ──────────────────────────────────────────────────────── */
    if (window.TokenManager) {
      try {
        const { allowed, reason } = await TokenManager.canScan();
        if (!allowed) {
          resultDiv.style.display = 'block';
          resultDiv.innerHTML = `
            <div style="
              background:linear-gradient(135deg,rgba(251,188,4,0.1),rgba(255,143,0,0.08));
              border:1.5px solid rgba(251,188,4,0.35);
              border-radius:20px;padding:24px 20px;text-align:center;">

              <!-- Icon -->
              <div style="font-size:44px;margin-bottom:12px;">⭐</div>

              <!-- Heading -->
              <div style="font-size:17px;font-weight:800;color:#FBBC04;margin-bottom:6px;letter-spacing:-0.2px;">
                Daily Limit Reached
              </div>
              <div style="font-size:13px;color:var(--md-on-surface-med);line-height:1.6;margin-bottom:20px;">
                ${reason}
              </div>

              <!-- Pro feature comparison -->
              <div style="
                background:var(--md-surface-2,#2A2D36);
                border-radius:14px;padding:16px;margin-bottom:20px;text-align:left;">
                <div style="font-size:11px;font-weight:700;color:var(--md-on-surface-low);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:12px;">
                  What you get with Pro
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:22px;height:22px;border-radius:50%;background:rgba(251,188,4,0.15);
                      display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">✨</div>
                    <div>
                      <div style="font-size:13px;font-weight:600;color:var(--md-on-background);">450 AI scans / month</div>
                      <div style="font-size:11px;color:var(--md-on-surface-low);">vs 6 scans/day on free</div>
                    </div>
                    <div style="margin-left:auto;font-size:11px;font-weight:700;color:#FBBC04;">PRO</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:22px;height:22px;border-radius:50%;background:rgba(251,188,4,0.15);
                      display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">🥤</div>
                    <div>
                      <div style="font-size:13px;font-weight:600;color:var(--md-on-background);">Unlimited custom drinks</div>
                      <div style="font-size:11px;color:var(--md-on-surface-low);">Create your own drink library</div>
                    </div>
                    <div style="margin-left:auto;font-size:11px;font-weight:700;color:#FBBC04;">PRO</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;opacity:0.5;">
                    <div style="width:22px;height:22px;border-radius:50%;background:rgba(138,143,154,0.15);
                      display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;">📊</div>
                    <div>
                      <div style="font-size:13px;font-weight:600;color:var(--md-on-background);">Advanced analytics</div>
                      <div style="font-size:11px;color:var(--md-on-surface-low);">Coming soon</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA button -->
              <button onclick="Router.navigate('settings')" style="
                width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                background:linear-gradient(135deg,#FBBC04,#F57C00);
                color:#000;font-size:15px;font-weight:800;font-family:var(--font-body);
                box-shadow:0 4px 18px rgba(251,188,4,0.4);
                letter-spacing:0.2px;margin-bottom:10px;
                transition:all 0.15s;">
                ✨ Upgrade to Pro
              </button>
              <div style="font-size:11px;color:var(--md-on-surface-low);">
                Resets at midnight — or upgrade for monthly limits
              </div>
            </div>`;
          return;
        }
      } catch(e) {
        /* Non-fatal — let the scan proceed if token check fails */
        console.warn('[AIScan] Token check failed:', e.message);
      }
    }

    const spinnerHTML = (msg) => `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
          style="animation:scanSpin 1s linear infinite;flex-shrink:0;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
        ${msg}
      </span>`;

    btn.innerHTML = spinnerHTML('Identifying…');
    btn.disabled  = true;
    resultDiv.style.display = 'none';

    try {
      /* ── PASS 1: Barcode (Label tab only) ── */
      if (_imageData.fromLabel && window.ZXing) {
        btn.innerHTML = spinnerHTML('Scanning barcode…');
        try {
          const br = await scanBarcode(_imageData.element);
          if (br) { renderResult(br, false); return; }
        } catch(e) { console.warn('[AIScan] Barcode failed:', e.message); }
      }

      /* ── PASS 2: Nyckel AI ── */
      btn.innerHTML = spinnerHTML('Nyckel AI identifying…');
      let aiResult = null;
      try {
        aiResult = await callNyckel(_imageData.element);
        console.log('[AIScan] ✅ Nyckel:', aiResult?.name, aiResult?.confidence?.toFixed(2));
      } catch(e) {
        console.error('[AIScan] ❌ Nyckel error:', e.message);
        const statusEl = _overlay?.querySelector('#modelStatus');
        if (statusEl) {
          statusEl.textContent = '⚠️ AI: ' + e.message.slice(0, 40);
          statusEl.style.background = 'rgba(234,67,53,0.25)';
          statusEl.style.color = '#FF8A80';
        }
      }

      if (aiResult && aiResult.confidence >= 0.3) {
        /* Record usage after a successful AI identification */
        if (window.TokenManager) TokenManager.recordScan().catch(() => {});
        renderResult(aiResult, aiResult.confidence < 0.5);
        return;
      }

      /* ── PASS 3: Colour analysis fallback ── */
      btn.innerHTML = spinnerHTML('Analysing colours…');
      const colourKey = analyseColour(_imageData.element);
      console.log('[AIScan] Colour fallback:', colourKey);

      if (aiResult && colourKey && DRINK_MAP[colourKey]) {
        renderResult(aiResult, true);
        return;
      }
      if (colourKey && DRINK_MAP[colourKey]) {
        renderResult({ ...DRINK_MAP[colourKey], confidence: 0.65, rawLabel: 'Colour: ' + colourKey, fromAI: false }, false);
        return;
      }

      /* ── PASS 4: Unknown ── */
      renderResult({ ...DEFAULT_RESULT, confidence: 0, rawLabel: 'Could not identify', fromAI: false }, true);

    } catch(e) {
      console.error('[AIScan] Analysis error:', e);
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="background:#FCE8E6;border:1.5px solid #FFCDD2;border-radius:16px;padding:16px;text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">⚠️</div>
          <div style="font-size:14px;font-weight:700;color:#D93025;">Analysis Failed</div>
          <div style="font-size:12px;color:#8A8F9A;margin-top:6px;">${e.message}</div>
        </div>`;
    } finally {
      btn.innerHTML = '🔬 Identify Drink';
      btn.disabled  = false;
    }
  };

/* ══════════════════════════════════════════
     RENDER RESULT CARD
  ══════════════════════════════════════════ */
  const renderResult = (r, showPicker = false) => {
    const resultDiv  = _overlay.querySelector('#scanResult');
    const isNeg      = r.hydration < 0;
    const pct        = Math.abs(r.hydration);
    const color      = r.hydration >= 70 ? '#00C853' : r.hydration >= 30 ? '#FBBC04' : '#EA4335';
    const bgColor    = r.hydration >= 70 ? '#E8F5E9' : r.hydration >= 30 ? '#FFF8E1' : '#FCE8E6';
    const vol        = 250; // default estimated volume
    const waterEq    = Math.round(vol * r.hydration / 100);
    const confLabel  = r.confidence > 0.7 ? 'High' : r.confidence > 0.35 ? 'Medium' : 'Low';
    const confColor  = r.confidence > 0.7 ? '#34A853' : r.confidence > 0.35 ? '#FBBC04' : '#EA4335';

    resultDiv.style.display = 'block';
    resultDiv.style.animation = 'resultSlideIn 0.35s cubic-bezier(0.22,1,0.36,1)';
    resultDiv.innerHTML = `
      <div style="
        background:var(--md-surface,#1E2128);
        border:2px solid ${color};
        border-radius:20px;padding:18px;
        box-shadow:0 8px 32px rgba(0,0,0,0.3);
      ">
        <!-- Drink identity row -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div style="
            font-size:42px;line-height:1;
            background:var(--md-surface-2,#282D36);border-radius:16px;
            width:64px;height:64px;display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 12px rgba(0,0,0,0.3);flex-shrink:0;
            border:1px solid var(--md-outline,#33383F);
          ">${r.emoji}</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:var(--md-on-background,#202124);">${r.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
              <span style="
                background:${color};color:#fff;
                font-size:11px;font-weight:700;
                padding:2px 8px;border-radius:99px;
              ">${isNeg ? '⚠️ Dehydrating' : r.hydration >= 70 ? '💧 Hydrating' : r.hydration >= 30 ? '〰️ Neutral' : '⚠️ Low'}</span>
              <span style="font-size:11px;color:${confColor};font-weight:600;">
                ${confLabel} confidence
              </span>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:26px;font-weight:700;color:${color};">${r.hydration > 0 ? '+' : ''}${r.hydration}%</div>
            <div style="font-size:10px;color:var(--md-on-surface-med,#5F6368);">hydration</div>
          </div>
        </div>

        <!-- Hydration bar -->
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--md-on-surface-med,#5F6368);margin-bottom:4px;">
            <span>Hydration score</span><span style="font-weight:700;color:${color};">${pct}%</span>
          </div>
          <div style="height:8px;background:var(--md-surface-2,#282D36);border-radius:4px;overflow:hidden;border:1px solid var(--md-outline,#33383F);">
            <div style="
              height:100%;width:${pct}%;
              background:linear-gradient(90deg,${color},${r.hydration>=70?'#1A73E8':color});
              border-radius:4px;
              transition:width 0.8s cubic-bezier(0.22,1,0.36,1);
            "></div>
          </div>
        </div>

        <!-- Water equivalent info -->
        <div style="
          background:var(--md-surface-2,#282D36);border-radius:14px;padding:12px 14px;
          margin-bottom:14px;display:flex;align-items:center;gap:12px;
          border:1px solid var(--md-outline,#33383F);
        ">
          <span style="font-size:24px;">💧</span>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;color:var(--md-on-background,#E3E3E8);line-height:1.4;">
              ${isNeg
                ? `${Math.abs(waterEq)} ml deducted for ${vol}ml serving`
                : `${Math.max(0,waterEq)} ml water equivalent for ${vol}ml`}
            </div>
            <div style="font-size:11px;color:var(--md-on-surface-med,#5F6368);margin-top:2px;">${r.advice}</div>
          </div>
        </div>

        <!-- Detected as (raw label) -->
        <div style="
          background:var(--md-surface-2,#282D36);border-radius:10px;
          padding:8px 12px;margin-bottom:14px;
          font-size:11px;color:var(--md-on-surface-med,#8A8F9A);
          border:1px solid var(--md-outline,#33383F);
        ">
          ${r.fromAI ? '🎯 Nyckel AI' : r.rawLabel?.startsWith('Barcode') ? '📦 Barcode' : r.rawLabel?.startsWith('Colour') ? '🎨 Colour' : '🔬 Fallback'}: <span style="font-weight:600;color:var(--md-on-background,#E3E3E8);">${(r.rawLabel||'unknown').replace('Roboflow: ','').replace('Colour analysis: ','').replace('Colour: ','').replace('Barcode: ','') || 'unknown'}</span>
          · ${Math.round((r.confidence||0) * 100)}% confident
          ${r.fromAI ? '<span style="background:rgba(0,200,83,0.15);color:#69F0AE;font-size:10px;font-weight:700;padding:1px 8px;border-radius:99px;margin-left:4px;">NYCKEL</span>' : r.rawLabel?.startsWith('Colour') ? '<span style="background:rgba(0,200,83,0.12);color:#80CBC4;font-size:10px;font-weight:700;padding:1px 8px;border-radius:99px;margin-left:4px;">OFFLINE</span>' : ''}
        </div>

        <!-- Volume selector -->
        <div style="margin-bottom:14px;">
          <div style="font-size:12px;font-weight:600;color:var(--md-on-surface-med,#8A8F9A);margin-bottom:6px;">Adjust serving size</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${[250,330,500,750,1000].map(v => `
              <button class="vol-btn" data-vol="${v}" style="
                padding:6px 12px;border-radius:99px;font-size:12px;font-weight:600;
                border:1.5px solid ${v===250?color:'var(--md-outline,#DADCE0)'};
                background:${v===250?bgColor:'var(--md-surface-2,#2A2D36)'};
                color:${v===250?color:'var(--md-on-surface-med,#8A8F9A)'};
                cursor:pointer;font-family:var(--font-body);
                transition:all 0.18s;
              ">${v}ml</button>
            `).join('')}
          </div>
        </div>

        <!-- Log button -->
        <button id="logScanBtn" data-vol="250" data-hydration="${r.hydration}" style="
          width:100%;padding:14px;
          background:${isNeg
            ? 'linear-gradient(135deg,#FFEBEE,#FCE4EC)'
            : 'linear-gradient(135deg,#00C853,#1A73E8)'};
          color:${isNeg ? '#C62828' : '#fff'};
          border:${isNeg ? '1.5px solid #FFCDD2' : 'none'};
          border-radius:14px;font-size:15px;font-weight:700;
          cursor:pointer;font-family:var(--font-body);
          box-shadow:${isNeg ? 'none' : '0 4px 14px rgba(0,200,83,0.35)'};
          transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        ">
          ${isNeg ? '⚠️' : '💧'} Log ${Math.abs(waterEq)}ml to today
        </button>

      </div>
    `;

    // Volume selection
    resultDiv.querySelectorAll('.vol-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const vol   = parseInt(btn.dataset.vol);
        const hyd   = r.hydration;
        const eq    = Math.round(vol * hyd / 100);
        const logBtn = resultDiv.querySelector('#logScanBtn');
        if (logBtn) {
          logBtn.dataset.vol = vol;
          logBtn.textContent = `${hyd < 0 ? '⚠️' : '💧'} Log ${Math.abs(eq)}ml to today`;
        }
        resultDiv.querySelectorAll('.vol-btn').forEach(b => {
          b.style.borderColor = b === btn ? color : '#DADCE0';
          b.style.background  = b === btn ? bgColor : 'var(--md-surface,#fff)';
          b.style.color       = b === btn ? color : '#5F6368';
        });
      });
    });

    // Log to today
    // Manual picker when AI is unsure
    if (showPicker) {
      const pickerWrap = document.createElement('div');
      pickerWrap.style.cssText = 'margin-top:12px;padding:14px;background:var(--md-surface,#1E2128);border-radius:16px;border:1.5px solid rgba(251,188,4,0.4);';
      pickerWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:16px;">🤔</span>
          <div style="font-size:13px;font-weight:700;color:var(--md-on-background,#E3E3E8);">Not sure? Pick manually:</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${Object.entries(DRINK_MAP).slice(0,20).map(([key, d]) => `
            <button class="manual-pick-btn" data-key="${key}" style="
              padding:5px 10px;border-radius:99px;font-size:12px;font-weight:600;
              border:1.5px solid var(--md-outline,#33383F);
              background:var(--md-surface-2,#2A2D36);
              color:var(--md-on-surface-med,#8A8F9A);
              cursor:pointer;font-family:var(--font-body);
              transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1);
            ">${d.emoji} ${d.name}</button>
          `).join('')}
        </div>
      `;
      resultDiv.appendChild(pickerWrap);

      pickerWrap.querySelectorAll('.manual-pick-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.borderColor = '#00C853';
          btn.style.color       = '#00C853';
          btn.style.transform   = 'scale(1.06)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderColor = 'var(--md-outline,#33383F)';
          btn.style.color       = 'var(--md-on-surface-med,#8A8F9A)';
          btn.style.transform   = '';
        });
        btn.addEventListener('click', () => {
          const picked = DRINK_MAP[btn.dataset.key];
          if (picked) {
            pickerWrap.remove();
            renderResult({ ...picked, confidence: 1.0, rawLabel: btn.dataset.key, allPredictions: [] }, false);
          }
        });
      });
    }

    resultDiv.querySelector('#logScanBtn').addEventListener('click', async () => {
      const logBtn = resultDiv.querySelector('#logScanBtn');
      const vol    = parseInt(logBtn.dataset.vol || 250);
      const hyd    = r.hydration;
      const eq     = Math.round(vol * hyd / 100);
      const today  = Utils.todayString();

      logBtn.textContent = '⏳ Logging…';
      logBtn.disabled    = true;

      try {
        if (eq > 0) {
          await Storage.addEntry(eq, today);
          Utils.showToast(`${r.emoji} ${r.name} → +${eq}ml 💧`);
        } else if (eq < 0) {
          const current  = await Storage.getTotalForDate(today);
          const newTotal = Math.max(0, current + eq);
          await Storage.setTotalForDate(today, newTotal);
          Utils.showToast(`${r.emoji} ${r.name} → ${eq}ml 💧`);
        } else {
          Utils.showToast('Zero water equivalent — nothing logged');
          logBtn.textContent = `${hyd < 0 ? '⚠️' : '💧'} Log ${Math.abs(eq)}ml to today`;
          logBtn.disabled = false;
          return;
        }
        if (window.HomeScreen) HomeScreen.updateUI();
        closeModal();
      } catch(e) {
        Utils.showToast('❌ ' + e.message);
        logBtn.textContent = `${hyd < 0 ? '⚠️' : '💧'} Log ${Math.abs(eq)}ml to today`;
        logBtn.disabled = false;
      }
    });
  };

  /* ══════════════════════════════════════════
     CLOSE
  ══════════════════════════════════════════ */
  const closeModal = () => {
    stopCamera();
    if (!_overlay) return;
    const sheet = _overlay.querySelector('#scanSheet');
    if (sheet) {
      sheet.style.transition = 'transform 0.28s cubic-bezier(0.55,0,1,0.45), opacity 0.25s';
      sheet.style.transform  = 'translateY(100%)';
      sheet.style.opacity    = '0';
      _overlay.style.transition = 'opacity 0.25s';
      _overlay.style.opacity = '0';
    }
    setTimeout(() => {
      if (_overlay) { _overlay.remove(); _overlay = null; }
      _imageData = null;
    }, 260);
  };

  return { initFAB, showScanModal };
})();

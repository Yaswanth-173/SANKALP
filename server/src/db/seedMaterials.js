import { withTransaction } from '../config/db.js'

// Same product line-up reused per category across cities (realistic — most
// hardware/building-material shops in a category stock a similar catalog),
// only the shop identity/location differs. Product ids are derived from the
// shop id below, so re-seeding always produces the same ids (safe upsert).
// imageUrl/imageSource are filled in from verified real product photographs
// (see MATERIAL_IMAGES below) rather than hardcoded per array.
const CEMENT_PRODUCTS = [
  { name: 'UltraTech OPC 53 Grade Cement (50kg)', unit: 'bag', price: 410, icon: 'cement' },
  { name: 'ACC Cement PPC (50kg)', unit: 'bag', price: 380, icon: 'cement' },
  { name: 'White Cement (1kg)', unit: 'pack', price: 95, icon: 'cement' },
]
const STEEL_PRODUCTS = [
  { name: 'TMT Bar 8mm', unit: 'kg', price: 68, icon: 'steel' },
  { name: 'TMT Bar 12mm', unit: 'kg', price: 66, icon: 'steel' },
  { name: 'MS Angle 2x2 inch', unit: 'kg', price: 72, icon: 'steel' },
  { name: 'Binding Wire (1kg roll)', unit: 'roll', price: 85, icon: 'steel' },
]
const BRICK_PRODUCTS = [
  { name: 'Red Clay Bricks (per 1000)', unit: 'lot of 1000', price: 6500, icon: 'brick' },
  { name: 'AAC Blocks 600x200x100mm', unit: 'piece', price: 58, icon: 'brick' },
  { name: 'Fly Ash Bricks (per 1000)', unit: 'lot of 1000', price: 5200, icon: 'brick' },
]
const SAND_PRODUCTS = [
  { name: 'River Sand', unit: 'ton', price: 2200, icon: 'sand' },
  { name: 'M-Sand', unit: 'ton', price: 1800, icon: 'sand' },
  { name: '20mm Aggregate', unit: 'ton', price: 1500, icon: 'sand' },
]
const PAINT_PRODUCTS = [
  { name: 'Asian Paints Tractor Emulsion (20L)', unit: 'bucket', price: 3200, icon: 'paint' },
  { name: 'Asian Paints Royale Luxury (10L)', unit: 'bucket', price: 5800, icon: 'paint' },
  { name: 'Exterior Weatherproof Paint (20L)', unit: 'bucket', price: 4500, icon: 'paint' },
]
const TILE_PRODUCTS = [
  { name: 'Vitrified Floor Tiles 2x2ft (box of 4)', unit: 'box', price: 1450, icon: 'tile' },
  { name: 'Ceramic Wall Tiles 1x2ft (box)', unit: 'box', price: 850, icon: 'tile' },
  { name: 'Anti-skid Bathroom Tiles (box)', unit: 'box', price: 1200, icon: 'tile' },
]
const PLUMBING_PRODUCTS = [
  { name: 'PVC Pipe 4 inch (3m)', unit: 'length', price: 650, icon: 'pipe' },
  { name: 'CPVC Pipe 1 inch (3m)', unit: 'length', price: 320, icon: 'pipe' },
  { name: 'PVC Fittings Set', unit: 'set', price: 450, icon: 'pipe' },
]
const ELECTRICAL_PRODUCTS = [
  { name: 'Havells Wire 1.5 sqmm (90m coil)', unit: 'coil', price: 1850, icon: 'electrical' },
  { name: 'MCB Switch 32A', unit: 'piece', price: 220, icon: 'electrical' },
  { name: 'LED Panel Light 18W', unit: 'piece', price: 280, icon: 'electrical' },
]
const HARDWARE_PRODUCTS = [
  { name: 'Cement Trowel', unit: 'piece', price: 180, icon: 'hardware' },
  { name: 'Spirit Level 24 inch', unit: 'piece', price: 450, icon: 'hardware' },
  { name: 'Door Hinges (pair)', unit: 'pair', price: 120, icon: 'hardware' },
]
const SANITARY_PRODUCTS = [
  { name: 'Wall-mounted WC', unit: 'piece', price: 8500, icon: 'sanitary' },
  { name: 'Wash Basin with Pedestal', unit: 'piece', price: 3200, icon: 'sanitary' },
  { name: 'Bathroom Fittings Set', unit: 'set', price: 2800, icon: 'sanitary' },
]
const WOOD_PRODUCTS = [
  { name: 'Plywood 19mm (8x4 ft sheet)', unit: 'sheet', price: 3200, icon: 'plywood' },
  { name: 'MDF Board 18mm (8x4 ft sheet)', unit: 'sheet', price: 2600, icon: 'mdf' },
]
const ROOFING_PRODUCTS = [
  { name: 'GC Roofing Sheet (12ft)', unit: 'sheet', price: 950, icon: 'roofing-sheet' },
  { name: 'Clay Roof Tile', unit: 'piece', price: 28, icon: 'roof-tile' },
]
const CHEMICAL_PRODUCTS = [
  { name: 'Tile Adhesive (20kg bag)', unit: 'bag', price: 550, icon: 'tile-adhesive' },
  { name: 'Waterproofing Coating (20L)', unit: 'container', price: 3800, icon: 'waterproofing' },
]
const TOOLS_PRODUCTS = [
  { name: 'Claw Hammer', unit: 'piece', price: 350, icon: 'hammer' },
  { name: 'Cordless Drill Machine', unit: 'piece', price: 3200, icon: 'drill' },
  { name: 'Measuring Tape (5m)', unit: 'piece', price: 180, icon: 'measuring-tape' },
]
const SAFETY_PRODUCTS = [
  { name: 'Safety Helmet', unit: 'piece', price: 220, icon: 'safety-helmet' },
  { name: 'Safety Shoes', unit: 'pair', price: 950, icon: 'safety-shoes' },
  { name: 'Safety Gloves', unit: 'pair', price: 150, icon: 'safety-gloves' },
  { name: 'Safety Vest', unit: 'piece', price: 280, icon: 'safety-vest' },
]

// Verified real product photographs. Each one was found and fetch-verified
// from a freely-licensed source (mostly Wikimedia Commons, one Pixabay), then
// downloaded once and self-hosted as a WebP under client/public/materials/ —
// hotlinking Commons files directly triggered Chrome's Opaque Response
// Blocking (ORB) for a large fraction of files (inconsistent per-file
// response headers outside our control), so self-hosting is what actually
// works reliably. `source` keeps the original page for attribution; never
// claim these are official manufacturer photos.
const img = (slug, source) => ({ url: `/materials/${slug}.webp`, source })
const MATERIAL_IMAGES = {
  'UltraTech OPC 53 Grade Cement (50kg)': img('cement-opc', 'https://commons.wikimedia.org/wiki/File:Cement_bags.jpg'),
  'ACC Cement PPC (50kg)': img('cement-ppc', 'https://commons.wikimedia.org/wiki/File:Portland_Cement_Bags.jpg'),
  'White Cement (1kg)': img('cement-white', 'https://commons.wikimedia.org/wiki/File:Bolsa_de_cemento_Plasticor_40_kg.jpg'),
  'TMT Bar 8mm': img('steel-tmt-8mm', 'https://commons.wikimedia.org/wiki/File:A_bunch_of_rebar.jpg'),
  'TMT Bar 12mm': img('steel-tmt-12mm', 'https://commons.wikimedia.org/wiki/File:A_bunch_of_rebar_up_close.jpg'),
  'MS Angle 2x2 inch': img('steel-ms-angle', 'https://commons.wikimedia.org/wiki/File:Installation_of_a_stainless-steel_angle_at_the_bottom_of_a_column_in_the_future_LIRR_Concourse._11-12-2019_(49070775291).jpg'),
  'Binding Wire (1kg roll)': img('steel-binding-wire', 'https://commons.wikimedia.org/wiki/File:Binding_Wire_for_Construction_in_Awka.jpg'),
  'Red Clay Bricks (per 1000)': img('brick-red-clay', 'https://commons.wikimedia.org/wiki/File:Brick_and_pallet_stack_at_Hatfield_Broad_Oak,_Essex,_England.jpg'),
  'AAC Blocks 600x200x100mm': img('brick-aac', 'https://commons.wikimedia.org/wiki/File:Siporex-bricks.jpg'),
  'Fly Ash Bricks (per 1000)': img('brick-flyash', 'https://commons.wikimedia.org/wiki/File:Fly_Ash_Bricks.jpg'),
  'River Sand': img('sand-river', 'https://commons.wikimedia.org/wiki/File:River_Sand_-_geograph.org.uk_-_218038.jpg'),
  'M-Sand': img('sand-m', 'https://commons.wikimedia.org/wiki/File:M-Sand_in_Salem.jpg'),
  '20mm Aggregate': img('aggregate-20mm', 'https://commons.wikimedia.org/wiki/File:20mm-aggregate.jpg'),
  'Asian Paints Tractor Emulsion (20L)': img('paint-interior', 'https://commons.wikimedia.org/wiki/File:Behr_paint_bucket.jpg'),
  'Asian Paints Royale Luxury (10L)': img('paint-premium', 'https://commons.wikimedia.org/wiki/File:GreenPaintBucketRome.jpg'),
  'Exterior Weatherproof Paint (20L)': img('paint-exterior', 'https://commons.wikimedia.org/wiki/File:Plastsic_pail_of_paint.jpg'),
  'GC Roofing Sheet (12ft)': img('roofing-sheet', 'https://commons.wikimedia.org/wiki/File:Corrugated_metal_roof.jpg'),
  'Clay Roof Tile': img('roofing-tile', 'https://commons.wikimedia.org/wiki/File:Clay_tile_roofs_at_village_side.jpg'),
  'Tile Adhesive (20kg bag)': img('chemical-tile-adhesive', 'https://commons.wikimedia.org/wiki/File:Sopro_auf_Baustelle.jpg'),
  'Waterproofing Coating (20L)': img('chemical-waterproofing', 'https://pixabay.com/photos/waterproofing-workers-7508362/'),
  'Claw Hammer': img('tool-hammer', 'https://commons.wikimedia.org/wiki/File:Claw-hammer.jpg'),
  'Cordless Drill Machine': img('tool-drill', 'https://commons.wikimedia.org/wiki/File:CordlessDrill.jpg'),
  'Measuring Tape (5m)': img('tool-tape', 'https://commons.wikimedia.org/wiki/File:Measuring-tape.jpg'),
  'Safety Helmet': img('safety-helmet', 'https://commons.wikimedia.org/wiki/File:Ameriza-entilated_safety_helmet.jpg'),
  'Safety Shoes': img('safety-shoes', 'https://commons.wikimedia.org/wiki/File:Steel-toe_boots.jpg'),
  'Safety Gloves': img('safety-gloves', 'https://commons.wikimedia.org/wiki/File:New_leather_gloves_P1000061.jpg'),
  'Safety Vest': img('safety-vest', 'https://commons.wikimedia.org/wiki/File:Warnweste_gelb.jpg'),
  'Vitrified Floor Tiles 2x2ft (box of 4)': img('tile-vitrified', 'https://commons.wikimedia.org/wiki/File:6%22x6%22_porcelain_floor_tiles.jpg'),
  'Ceramic Wall Tiles 1x2ft (box)': img('tile-ceramic-wall', 'https://www.pexels.com/photo/colorful-ceramic-tiles-7794427/'),
  'Anti-skid Bathroom Tiles (box)': img('tile-antiskid', 'https://commons.wikimedia.org/wiki/File:Black_white_checkered_grubby_dusty_square_tile_pattern_floor_texture.jpg'),
  'PVC Pipe 4 inch (3m)': img('pipe-pvc', 'https://commons.wikimedia.org/wiki/File:1_inch_PVc.jpg'),
  'CPVC Pipe 1 inch (3m)': img('pipe-cpvc', 'https://commons.wikimedia.org/wiki/File:Circular_pipes.jpg'),
  'PVC Fittings Set': img('pipe-fittings', 'https://commons.wikimedia.org/wiki/File:Raccords_PVC.jpg'),
  'Havells Wire 1.5 sqmm (90m coil)': img('electrical-wire', 'https://pixabay.com/photos/wire-spool-coil-copper-equipment-962753/'),
  'MCB Switch 32A': img('electrical-mcb', 'https://commons.wikimedia.org/wiki/File:MCB_Circuit_breakers_for_DIN_rail.jpg'),
  'LED Panel Light 18W': img('electrical-led-panel', 'https://www.pexels.com/photo/light-on-a-white-ceiling-11105159/'),
  'Cement Trowel': img('hardware-trowel', 'https://commons.wikimedia.org/wiki/File:Masons_trowel.jpg'),
  'Spirit Level 24 inch': img('hardware-spirit-level', 'https://www.pexels.com/photo/a-person-using-spirit-level-4981785/'),
  'Door Hinges (pair)': img('hardware-hinges', 'https://commons.wikimedia.org/wiki/File:Metal_door_hinge.jpg'),
  'Wall-mounted WC': img('sanitary-wc', 'https://commons.wikimedia.org/wiki/File:Wall_mounted_toilet.jpg'),
  'Wash Basin with Pedestal': img('sanitary-basin', 'https://www.pexels.com/photo/simple-bathroom-interior-design-8634462/'),
  'Bathroom Fittings Set': img('sanitary-fittings', 'https://www.pexels.com/photo/chrome-dual-faucet-on-ceramic-surface-5869443/'),
  'Plywood 19mm (8x4 ft sheet)': img('wood-plywood', 'https://commons.wikimedia.org/wiki/File:Plywood_panels_for_new_construction.jpg'),
  'MDF Board 18mm (8x4 ft sheet)': img('wood-mdf', 'https://commons.wikimedia.org/wiki/File:MDF_Sample.jpg'),
}

const SHOPS = [
  { id: 'S01', name: 'UltraTech Cement Depot', category: 'Cement', location: 'Hyderabad', address: '12-2-417, Malakpet Main Road, Malakpet, Hyderabad, Telangana 500036', products: CEMENT_PRODUCTS },
  { id: 'S01B', name: 'Konkan Cement Traders', category: 'Cement', location: 'Mumbai', address: 'Shop No. 4, Sion-Trombay Road, Chembur, Mumbai, Maharashtra 400071', products: CEMENT_PRODUCTS },
  { id: 'S01C', name: 'Delhi Cement House', category: 'Cement', location: 'Delhi', address: '45, GT Karnal Road, Azadpur, Delhi 110033', products: CEMENT_PRODUCTS },

  { id: 'S02', name: 'Steel Hub Hyderabad', category: 'Steel', location: 'Hyderabad', address: '8-3-945, Ring Road, Balanagar, Hyderabad, Telangana 500037', products: STEEL_PRODUCTS },
  { id: 'S02B', name: 'Chennai Steel Traders', category: 'Steel', location: 'Chennai', address: 'No. 18, NSC Bose Road, Sowcarpet, Chennai, Tamil Nadu 600001', products: STEEL_PRODUCTS },
  { id: 'S02C', name: 'Pune TMT Steel Corner', category: 'Steel', location: 'Pune', address: 'Shivaji Road, Pune Camp, Pune, Maharashtra 411001', products: STEEL_PRODUCTS },

  { id: 'S03', name: 'Sri Balaji Bricks & Blocks', category: 'Bricks', location: 'Hyderabad', address: 'Plot 45, Industrial Area, Uppal, Hyderabad, Telangana 500039', products: BRICK_PRODUCTS },
  { id: 'S03B', name: 'Bangalore Brick Works', category: 'Bricks', location: 'Bengaluru', address: 'Tumkur Road, Yeshwanthpur, Bengaluru, Karnataka 560022', products: BRICK_PRODUCTS },
  { id: 'S03C', name: 'Kolkata Clay Bricks Co.', category: 'Bricks', location: 'Kolkata', address: 'Jessore Road, Dum Dum, Kolkata, West Bengal 700028', products: BRICK_PRODUCTS },

  { id: 'S04', name: 'Hyderabad Sand & Aggregates', category: 'Sand & Aggregates', location: 'Hyderabad', address: 'Survey No. 112, Patancheru Road, Patancheru, Hyderabad, Telangana 502319', products: SAND_PRODUCTS },
  { id: 'S04B', name: 'Gujarat Sand Suppliers', category: 'Sand & Aggregates', location: 'Ahmedabad', address: 'Sarkhej-Gandhinagar Highway, Ahmedabad, Gujarat 380054', products: SAND_PRODUCTS },
  { id: 'S04C', name: 'Rajasthan Aggregates', category: 'Sand & Aggregates', location: 'Jaipur', address: 'Ajmer Road, Jaipur, Rajasthan 302006', products: SAND_PRODUCTS },

  { id: 'S05', name: 'Asian Paints Gallery', category: 'Paint', location: 'Hyderabad', address: '3-6-282, Himayatnagar Main Road, Himayatnagar, Hyderabad, Telangana 500029', products: PAINT_PRODUCTS },
  { id: 'S05B', name: 'Mumbai Paint House', category: 'Paint', location: 'Mumbai', address: '12, Kalbadevi Road, Kalbadevi, Mumbai, Maharashtra 400002', products: PAINT_PRODUCTS },
  { id: 'S05C', name: 'Lucknow Colour World', category: 'Paint', location: 'Lucknow', address: 'Aminabad Market, Lucknow, Uttar Pradesh 226018', products: PAINT_PRODUCTS },

  { id: 'S06', name: 'Kajaria Tiles World', category: 'Tiles', location: 'Hyderabad', address: 'Shop 7, SD Road, Secunderabad, Hyderabad, Telangana 500003', products: TILE_PRODUCTS },
  { id: 'S06B', name: 'Chennai Tiles Gallery', category: 'Tiles', location: 'Chennai', address: 'Anna Salai, Teynampet, Chennai, Tamil Nadu 600018', products: TILE_PRODUCTS },
  { id: 'S06C', name: 'Delhi Ceramics Hub', category: 'Tiles', location: 'Delhi', address: 'Kirti Nagar Furniture Market Road, Kirti Nagar, New Delhi, Delhi 110015', products: TILE_PRODUCTS },

  { id: 'S07', name: 'Finolex Plumbing Store', category: 'Plumbing', location: 'Hyderabad', address: '6-1-91, Lakdikapul, Hyderabad, Telangana 500004', products: PLUMBING_PRODUCTS },
  { id: 'S07B', name: 'Bangalore Plumbing Mart', category: 'Plumbing', location: 'Bengaluru', address: 'SP Road, Shivajinagar, Bengaluru, Karnataka 560001', products: PLUMBING_PRODUCTS },
  { id: 'S07C', name: 'Pune Pipe & Fittings', category: 'Plumbing', location: 'Pune', address: 'Bibwewadi Road, Bibwewadi, Pune, Maharashtra 411037', products: PLUMBING_PRODUCTS },

  { id: 'S08', name: 'Havells Electrical Mart', category: 'Electrical', location: 'Hyderabad', address: '1-8-303, Chikkadpally, Hyderabad, Telangana 500020', products: ELECTRICAL_PRODUCTS },
  { id: 'S08B', name: 'Mumbai Electricals', category: 'Electrical', location: 'Mumbai', address: 'Lamington Road, Grant Road, Mumbai, Maharashtra 400007', products: ELECTRICAL_PRODUCTS },
  { id: 'S08C', name: 'Kolkata Wire & Switch Co.', category: 'Electrical', location: 'Kolkata', address: 'Bentinck Street, Kolkata, West Bengal 700001', products: ELECTRICAL_PRODUCTS },

  { id: 'S09', name: 'BuildHardware & Tools', category: 'Hardware', location: 'Hyderabad', address: 'Shop 22, Begum Bazaar, Hyderabad, Telangana 500012', products: HARDWARE_PRODUCTS },
  { id: 'S09B', name: 'Ahmedabad Hardware Store', category: 'Hardware', location: 'Ahmedabad', address: 'Manek Chowk, Ahmedabad, Gujarat 380001', products: HARDWARE_PRODUCTS },
  { id: 'S09C', name: 'Chennai Tools & Hardware', category: 'Hardware', location: 'Chennai', address: 'Errabalu Chetty Street, George Town, Chennai, Tamil Nadu 600001', products: HARDWARE_PRODUCTS },

  { id: 'S10', name: 'Cera Sanitaryware', category: 'Sanitaryware', location: 'Hyderabad', address: '5-4-187, Abids Road, Abids, Hyderabad, Telangana 500001', products: SANITARY_PRODUCTS },
  { id: 'S10B', name: 'Delhi Sanitary Gallery', category: 'Sanitaryware', location: 'Delhi', address: 'Bhagirath Palace, Chandni Chowk, Delhi 110006', products: SANITARY_PRODUCTS },
  { id: 'S10C', name: 'Bangalore Bath Fittings', category: 'Sanitaryware', location: 'Bengaluru', address: 'Residency Road, Bengaluru, Karnataka 560025', products: SANITARY_PRODUCTS },

  // Smaller towns — so customers outside the big metros also see shops near them.
  { id: 'S11', name: 'Warangal Steel Traders', category: 'Steel', location: 'Warangal', address: 'Kazipet Road, Warangal, Telangana 506002', products: STEEL_PRODUCTS },
  { id: 'S12', name: 'Warangal Hardware Bazaar', category: 'Hardware', location: 'Warangal', address: 'Station Road, Warangal, Telangana 506002', products: HARDWARE_PRODUCTS },

  { id: 'S13', name: 'Nashik Cement Store', category: 'Cement', location: 'Nashik', address: 'Dwarka Circle, Nashik, Maharashtra 422011', products: CEMENT_PRODUCTS },
  { id: 'S14', name: 'Nashik Sanitary Mart', category: 'Sanitaryware', location: 'Nashik', address: 'College Road, Nashik, Maharashtra 422005', products: SANITARY_PRODUCTS },

  { id: 'S15', name: 'Gurugram Electricals', category: 'Electrical', location: 'Gurugram', address: 'Old Railway Road, Gurugram, Haryana 122001', products: ELECTRICAL_PRODUCTS },
  { id: 'S16', name: 'Gurugram Tiles Hub', category: 'Tiles', location: 'Gurugram', address: 'Sector 14 Market, Gurugram, Haryana 122001', products: TILE_PRODUCTS },

  { id: 'S17', name: 'Coimbatore Plumbing Store', category: 'Plumbing', location: 'Coimbatore', address: 'Oppanakara Street, Coimbatore, Tamil Nadu 641001', products: PLUMBING_PRODUCTS },
  { id: 'S18', name: 'Coimbatore Paint Point', category: 'Paint', location: 'Coimbatore', address: 'RS Puram Main Road, Coimbatore, Tamil Nadu 641002', products: PAINT_PRODUCTS },

  { id: 'S19', name: 'Mysore Bricks & Blocks', category: 'Bricks', location: 'Mysuru', address: 'Hunsur Road, Mysuru, Karnataka 570001', products: BRICK_PRODUCTS },
  { id: 'S20', name: 'Mysore Sand Suppliers', category: 'Sand & Aggregates', location: 'Mysuru', address: 'Bannur Road, Mysuru, Karnataka 570004', products: SAND_PRODUCTS },

  { id: 'S21', name: 'Siliguri Hardware Store', category: 'Hardware', location: 'Siliguri', address: 'Hill Cart Road, Siliguri, West Bengal 734001', products: HARDWARE_PRODUCTS },
  { id: 'S22', name: 'Siliguri Steel Corner', category: 'Steel', location: 'Siliguri', address: 'Sevoke Road, Siliguri, West Bengal 734001', products: STEEL_PRODUCTS },

  { id: 'S23', name: 'Rajkot Sand & Aggregates', category: 'Sand & Aggregates', location: 'Rajkot', address: 'Kalawad Road, Rajkot, Gujarat 360005', products: SAND_PRODUCTS },
  { id: 'S24', name: 'Rajkot Tiles Gallery', category: 'Tiles', location: 'Rajkot', address: 'Yagnik Road, Rajkot, Gujarat 360001', products: TILE_PRODUCTS },

  { id: 'S25', name: 'Udaipur Cement House', category: 'Cement', location: 'Udaipur', address: 'Chetak Circle, Udaipur, Rajasthan 313001', products: CEMENT_PRODUCTS },
  { id: 'S26', name: 'Udaipur Electricals', category: 'Electrical', location: 'Udaipur', address: 'Surajpole Bazaar, Udaipur, Rajasthan 313001', products: ELECTRICAL_PRODUCTS },

  { id: 'S27', name: 'Varanasi Colour World', category: 'Paint', location: 'Varanasi', address: 'Lahurabir Road, Varanasi, Uttar Pradesh 221002', products: PAINT_PRODUCTS },
  { id: 'S28', name: 'Varanasi Plumbing Mart', category: 'Plumbing', location: 'Varanasi', address: 'Sigra Main Road, Varanasi, Uttar Pradesh 221010', products: PLUMBING_PRODUCTS },

  { id: 'S29', name: 'Hyderabad Timber Mart', category: 'Wood', location: 'Hyderabad', address: 'Old Bowenpally Timber Depot Road, Hyderabad, Telangana 500011', products: WOOD_PRODUCTS },
  { id: 'S30', name: 'Hyderabad Roofing Solutions', category: 'Roofing', location: 'Hyderabad', address: 'Kukatpally Housing Board, Hyderabad, Telangana 500072', products: ROOFING_PRODUCTS },
  { id: 'S31', name: 'Hyderabad Construction Chemicals', category: 'Construction Chemicals', location: 'Hyderabad', address: 'Bahadurpura, Hyderabad, Telangana 500064', products: CHEMICAL_PRODUCTS },
  { id: 'S32', name: 'Hyderabad Tools Centre', category: 'Tools', location: 'Hyderabad', address: 'Sultan Bazaar, Hyderabad, Telangana 500095', products: TOOLS_PRODUCTS },
  { id: 'S33', name: 'Hyderabad Safety Gear Store', category: 'Safety', location: 'Hyderabad', address: 'Nampally Station Road, Hyderabad, Telangana 500001', products: SAFETY_PRODUCTS },
]

// Full state/UT -> city+town dataset, kept in sync manually with the
// equivalent copy in client/src/data/indianCities.js. Used below to give
// every location a starter shop, beyond the ~20 hand-curated ones above.
const STATE_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Srikakulam', 'Vizianagaram', 'Machilipatnam', 'Tenali', 'Chittoor', 'Hindupur', 'Bhimavaram', 'Proddatur', 'Narasaraopet', 'Markapur', 'Gudivada', 'Tadipatri'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Tawang', 'Pasighat', 'Ziro', 'Bomdila', 'Tezu', 'Namsai', 'Roing', 'Aalo'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Sivasagar', 'Diphu', 'North Lakhimpur', 'Goalpara', 'Barpeta', 'Kokrajhar', 'Bongaigaon'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Danapur', 'Bihar Sharif', 'Samastipur', 'Sasaram', 'Hajipur', 'Dehri', 'Bettiah', 'Motihari'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Raigarh', 'Jagdalpur', 'Rajnandgaon', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Kanker'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Cuncolim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Nadiad', 'Bharuch', 'Vapi', 'Navsari', 'Mehsana', 'Morbi', 'Porbandar', 'Gandhidham', 'Bhuj', 'Palanpur', 'Godhra', 'Patan', 'Botad'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Rohtak', 'Karnal', 'Sonipat', 'Yamunanagar', 'Panchkula', 'Bhiwani', 'Sirsa', 'Rewari', 'Bahadurgarh', 'Kurukshetra', 'Kaithal'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Bilaspur', 'Hamirpur', 'Una', 'Chamba', 'Nahan', 'Palampur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Dumka', 'Phusro', 'Chaibasa', 'Medininagar'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Dharwad', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru', 'Udupi', 'Hassan', 'Raichur', 'Vijayapura', 'Kolar', 'Mandya', 'Chikkamagaluru', 'Hospet', 'Bidar'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Katni', 'Singrauli', 'Burhanpur', 'Khandwa', 'Chhindwara', 'Vidisha', 'Shivpuri', 'Morena', 'Neemuch'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Navi Mumbai', 'Aurangabad', 'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 'Sangli', 'Satara', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Chandrapur', 'Dhule', 'Ratnagiri', 'Parbhani', 'Beed', 'Wardha'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul', 'Senapati', 'Tamenglong'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar', 'Baghmara'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Saiha'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Jharsuguda', 'Bhadrak', 'Angul', 'Dhenkanal', 'Koraput', 'Jeypore', 'Rayagada'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Moga', 'Batala', 'Firozpur', 'Sangrur', 'Khanna', 'Abohar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur', 'Bhilwara', 'Sikar', 'Sri Ganganagar', 'Pali', 'Barmer', 'Chittorgarh', 'Tonk', 'Bundi', 'Nagaur', 'Jaisalmer', 'Banswara'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Singtam', 'Rangpo'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Tirunelveli', 'Dindigul', 'Thanjavur', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Karur', 'Cuddalore', 'Sivakasi', 'Pudukkottai', 'Namakkal'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Siddipet', 'Mancherial', 'Jagtial', 'Kamareddy'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Ambassa', 'Kumarghat'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Mathura', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Ayodhya', 'Rampur', 'Shahjahanpur', 'Sitapur', 'Hapur', 'Unnao', 'Rae Bareli', 'Bahraich'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee', 'Nainital', 'Rudrapur', 'Kashipur', 'Almora', 'Pithoragarh', 'Mussoorie', 'Kotdwar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling', 'Kharagpur', 'Haldia', 'Bardhaman', 'Malda', 'Berhampore', 'Jalpaiguri', 'Raiganj', 'Krishnanagar'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore', 'Rajouri', 'Poonch', 'Doda', 'Kishtwar'],
  'Ladakh': ['Leh', 'Kargil'],
  'Chandigarh': ['Chandigarh'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  'Andaman & Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Silvassa', 'Daman', 'Diu'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Kalpeni', 'Kiltan', 'Minicoy'],
}

// Approximate anchor coordinates (state capital / largest hub) — used only
// to derive a deterministic nearby point for towns we don't have a real
// surveyed coordinate for. NOT precise per-town geocodes.
const STATE_ANCHORS = {
  'Andhra Pradesh': [16.5062, 80.6480],
  'Arunachal Pradesh': [27.0844, 93.6053],
  Assam: [26.1445, 91.7362],
  Bihar: [25.5941, 85.1376],
  Chhattisgarh: [21.2514, 81.6296],
  Goa: [15.4909, 73.8278],
  Gujarat: [23.0225, 72.5714],
  Haryana: [28.4595, 77.0266],
  'Himachal Pradesh': [31.1048, 77.1734],
  Jharkhand: [23.3441, 85.3096],
  Karnataka: [12.9716, 77.5946],
  Kerala: [8.5241, 76.9366],
  'Madhya Pradesh': [23.2599, 77.4126],
  Maharashtra: [19.0760, 72.8777],
  Manipur: [24.8170, 93.9368],
  Meghalaya: [25.5788, 91.8933],
  Mizoram: [23.7271, 92.7176],
  Nagaland: [25.6751, 94.1086],
  Odisha: [20.2961, 85.8245],
  Punjab: [30.9010, 75.8573],
  Rajasthan: [26.9124, 75.7873],
  Sikkim: [27.3389, 88.6065],
  'Tamil Nadu': [13.0827, 80.2707],
  Telangana: [17.3850, 78.4867],
  Tripura: [23.8315, 91.2868],
  'Uttar Pradesh': [26.8467, 80.9462],
  Uttarakhand: [30.3165, 78.0322],
  'West Bengal': [22.5726, 88.3639],
  Delhi: [28.7041, 77.1025],
  'Jammu & Kashmir': [34.0837, 74.7973],
  Ladakh: [34.1526, 77.5771],
  Chandigarh: [30.7333, 76.7794],
  Puducherry: [11.9416, 79.8083],
  'Andaman & Nicobar Islands': [11.6234, 92.7265],
  'Dadra & Nagar Haveli and Daman & Diu': [20.2666, 73.0166],
  Lakshadweep: [10.5593, 72.6358],
}

// Real, verified city-center coordinates for the hand-curated shop
// locations above (accurate to the city, not a specific street address).
const CURATED_COORDS = {
  Hyderabad: [17.3850, 78.4867],
  Mumbai: [19.0760, 72.8777],
  Delhi: [28.7041, 77.1025],
  Chennai: [13.0827, 80.2707],
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
  Kolkata: [22.5726, 88.3639],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Warangal: [17.9689, 79.5941],
  Nashik: [19.9975, 73.7898],
  Gurugram: [28.4595, 77.0266],
  Coimbatore: [11.0168, 76.9558],
  Mysuru: [12.2958, 76.6394],
  Siliguri: [26.7271, 88.3953],
  Rajkot: [22.3039, 70.8022],
  Udaipur: [24.5854, 73.7125],
  Varanasi: [25.3176, 82.9739],
}

// Deterministic string hash -> lets us derive stable pseudo-random jitter,
// rating, delivery and stock values per city/shop/product id, so re-seeding
// (which runs on every server start) always reproduces the same values.
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Towns without a surveyed coordinate get a deterministic offset from their
// state's anchor city (roughly within ~55km) — a reasonable state-level
// approximation for distance sorting, not a precise geocode.
function coordsFor(city, state) {
  if (CURATED_COORDS[city]) return CURATED_COORDS[city]
  const anchor = STATE_ANCHORS[state] || [22.0, 79.0] // geographic center of India, last resort
  const h = hashString(city)
  const latOffset = ((h % 1000) / 1000 - 0.5) * 1.0
  const lngOffset = (((h >> 10) % 1000) / 1000 - 0.5) * 1.0
  return [+(anchor[0] + latOffset).toFixed(6), +(anchor[1] + lngOffset).toFixed(6)]
}

function ratingFor(shopId) {
  const h = hashString(shopId)
  return +(3.7 + (h % 12) / 10).toFixed(1) // 3.7 - 4.8
}

function deliveryFor(shopId) {
  const h = hashString(shopId)
  return { available: h % 10 !== 0, eta: 24 + (h % 4) * 24 } // ~90% offer delivery; 24/48/72/96h
}

function stockStatusFor(productId) {
  const r = hashString(productId) % 20
  if (r === 0) return 'out_of_stock' // 5%
  if (r <= 2) return 'low_stock' // 10%
  return 'in_stock' // 85%
}

function stockFor(productId) {
  const status = stockStatusFor(productId)
  if (status === 'out_of_stock') return 0
  if (status === 'low_stock') return 3
  return 50
}

const CATEGORY_PRODUCTS = {
  Cement: CEMENT_PRODUCTS,
  Steel: STEEL_PRODUCTS,
  Bricks: BRICK_PRODUCTS,
  'Sand & Aggregates': SAND_PRODUCTS,
  Paint: PAINT_PRODUCTS,
  Tiles: TILE_PRODUCTS,
  Plumbing: PLUMBING_PRODUCTS,
  Electrical: ELECTRICAL_PRODUCTS,
  Hardware: HARDWARE_PRODUCTS,
  Sanitaryware: SANITARY_PRODUCTS,
  Wood: WOOD_PRODUCTS,
  Roofing: ROOFING_PRODUCTS,
  'Construction Chemicals': CHEMICAL_PRODUCTS,
  Tools: TOOLS_PRODUCTS,
  Safety: SAFETY_PRODUCTS,
}
const CATEGORY_LIST = Object.keys(CATEGORY_PRODUCTS)
const NAME_TEMPLATES = ['{city} {category} Store', '{city} {category} Mart', '{city} {category} Traders', '{city} {category} Hub', '{city} {category} Suppliers']

// Every location already covered by the hand-curated SHOPS above keeps
// those (richer, multi-shop) entries — we only fill in the gaps.
const CURATED_LOCATIONS = new Set(SHOPS.map((s) => s.location))

const GENERATED_SHOPS = []
let genIndex = 0
for (const [state, cities] of Object.entries(STATE_CITIES)) {
  for (const city of cities) {
    if (CURATED_LOCATIONS.has(city)) continue
    const category = CATEGORY_LIST[genIndex % CATEGORY_LIST.length]
    const template = NAME_TEMPLATES[genIndex % NAME_TEMPLATES.length]
    GENERATED_SHOPS.push({
      id: `G${genIndex + 1}`,
      name: template.replace('{city}', city).replace('{category}', category),
      category,
      location: city,
      state,
      address: `Main Market, ${city}, ${state}`,
      products: CATEGORY_PRODUCTS[category],
    })
    genIndex++
  }
}

const ALL_SHOPS = [...SHOPS, ...GENERATED_SHOPS]

// Idempotent: upserts the material shop/product catalog on every startup,
// and removes any previously-seeded rows that no longer exist in ALL_SHOPS
// (e.g. left over from an earlier id scheme) so the catalog never drifts.
export async function seedMaterials() {
  const validShopIds = ALL_SHOPS.map((s) => s.id)
  const validProductIds = []

  await withTransaction(async (client) => {
    for (const shop of ALL_SHOPS) {
      const [lat, lng] = coordsFor(shop.location, shop.state)
      const rating = ratingFor(shop.id)
      const { available: deliveryAvailable, eta: deliveryEtaHours } = deliveryFor(shop.id)
      await client.query(
        `INSERT INTO material_shops (id, name, category, location, address, latitude, longitude, rating, delivery_available, delivery_eta_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET name = $2, category = $3, location = $4, address = $5,
           latitude = $6, longitude = $7, rating = $8, delivery_available = $9, delivery_eta_hours = $10`,
        [shop.id, shop.name, shop.category, shop.location, shop.address, lat, lng, rating, deliveryAvailable, deliveryEtaHours]
      )
      for (let i = 0; i < shop.products.length; i++) {
        const product = shop.products[i]
        const productId = `${shop.id}-P${i + 1}`
        validProductIds.push(productId)
        const image = MATERIAL_IMAGES[product.name] || {}
        const stockStatus = stockStatusFor(productId)
        const stock = stockFor(productId)
        await client.query(
          `INSERT INTO material_products (id, shop_id, name, unit, price, icon, image_url, image_source, stock_status, stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET shop_id = $2, name = $3, unit = $4, price = $5, icon = $6,
             image_url = $7, image_source = $8, stock_status = $9, stock = $10`,
          [productId, shop.id, product.name, product.unit, product.price, product.icon, image.url || null, image.source || null, stockStatus, stock]
        )
      }
    }

    await client.query(`DELETE FROM material_products WHERE NOT (id = ANY($1::text[]))`, [validProductIds])
    await client.query(`DELETE FROM material_shops WHERE NOT (id = ANY($1::text[]))`, [validShopIds])
  })

  console.log(`Seeded ${ALL_SHOPS.length} material shops, ${validProductIds.length} products`)
}

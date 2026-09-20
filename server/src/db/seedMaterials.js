import { withTransaction } from '../config/db.js'

// This seeds a small, honestly-labeled DEMO supplier catalog so the
// materials marketplace has something real to search/filter/sort/compare
// against before any real supplier has registered. It intentionally does
// NOT try to represent "all shops in India" — every supplier row it creates
// carries source='seed_dataset' and verification_status='pending', and nothing
// in the frontend is allowed to show these with a "Verified" badge. Real
// coverage grows through POST /api/suppliers/register + admin approval
// (see suppliersController.js), not through inventing more shops here.
const CEMENT_PRODUCTS = [
  { name: 'UltraTech OPC 53 Grade Cement (50kg)', unit: 'bag', price: 410, brand: 'UltraTech', grade: 'OPC 53' },
  { name: 'ACC Cement PPC (50kg)', unit: 'bag', price: 380, brand: 'ACC', grade: 'PPC' },
  { name: 'White Cement (1kg)', unit: 'pack', price: 95, brand: null, grade: null },
]
const STEEL_PRODUCTS = [
  { name: 'TMT Bar 8mm', unit: 'kg', price: 68, brand: null, grade: 'Fe 500' },
  { name: 'TMT Bar 12mm', unit: 'kg', price: 66, brand: null, grade: 'Fe 500' },
  { name: 'MS Angle 2x2 inch', unit: 'kg', price: 72, brand: null, grade: null },
  { name: 'Binding Wire (1kg roll)', unit: 'roll', price: 85, brand: null, grade: null },
]
const BRICK_PRODUCTS = [
  { name: 'Red Clay Bricks (per 1000)', unit: 'lot of 1000', price: 6500, brand: null, grade: null },
  { name: 'AAC Blocks 600x200x100mm', unit: 'piece', price: 58, brand: null, grade: null },
  { name: 'Fly Ash Bricks (per 1000)', unit: 'lot of 1000', price: 5200, brand: null, grade: null },
]
const SAND_PRODUCTS = [
  { name: 'River Sand', unit: 'ton', price: 2200, brand: null, grade: null },
  { name: 'M-Sand', unit: 'ton', price: 1800, brand: null, grade: null },
  { name: '20mm Aggregate', unit: 'ton', price: 1500, brand: null, grade: null },
]
const PAINT_PRODUCTS = [
  { name: 'Asian Paints Tractor Emulsion (20L)', unit: 'bucket', price: 3200, brand: 'Asian Paints', grade: 'Interior' },
  { name: 'Asian Paints Royale Luxury (10L)', unit: 'bucket', price: 5800, brand: 'Asian Paints', grade: 'Interior Premium' },
  { name: 'Exterior Weatherproof Paint (20L)', unit: 'bucket', price: 4500, brand: null, grade: 'Exterior' },
]
const TILE_PRODUCTS = [
  { name: 'Vitrified Floor Tiles 2x2ft (box of 4)', unit: 'box', price: 1450, brand: null, grade: null },
  { name: 'Ceramic Wall Tiles 1x2ft (box)', unit: 'box', price: 850, brand: null, grade: null },
  { name: 'Anti-skid Bathroom Tiles (box)', unit: 'box', price: 1200, brand: null, grade: null },
]
const PLUMBING_PRODUCTS = [
  { name: 'PVC Pipe 4 inch (3m)', unit: 'length', price: 650, brand: null, grade: null },
  { name: 'CPVC Pipe 1 inch (3m)', unit: 'length', price: 320, brand: null, grade: null },
  { name: 'PVC Fittings Set', unit: 'set', price: 450, brand: null, grade: null },
]
const ELECTRICAL_PRODUCTS = [
  { name: 'Havells Wire 1.5 sqmm (90m coil)', unit: 'coil', price: 1850, brand: 'Havells', grade: null },
  { name: 'MCB Switch 32A', unit: 'piece', price: 220, brand: null, grade: null },
  { name: 'LED Panel Light 18W', unit: 'piece', price: 280, brand: null, grade: null },
]
const HARDWARE_PRODUCTS = [
  { name: 'Cement Trowel', unit: 'piece', price: 180, brand: null, grade: null },
  { name: 'Spirit Level 24 inch', unit: 'piece', price: 450, brand: null, grade: null },
  { name: 'Door Hinges (pair)', unit: 'pair', price: 120, brand: null, grade: null },
]
const SANITARY_PRODUCTS = [
  { name: 'Wall-mounted WC', unit: 'piece', price: 8500, brand: null, grade: null },
  { name: 'Wash Basin with Pedestal', unit: 'piece', price: 3200, brand: null, grade: null },
  { name: 'Bathroom Fittings Set', unit: 'set', price: 2800, brand: null, grade: null },
]
const WOOD_PRODUCTS = [
  { name: 'Plywood 19mm (8x4 ft sheet)', unit: 'sheet', price: 3200, brand: null, grade: 'BWP' },
  { name: 'MDF Board 18mm (8x4 ft sheet)', unit: 'sheet', price: 2600, brand: null, grade: null },
]
const ROOFING_PRODUCTS = [
  { name: 'GC Roofing Sheet (12ft)', unit: 'sheet', price: 950, brand: null, grade: null },
  { name: 'Clay Roof Tile', unit: 'piece', price: 28, brand: null, grade: null },
]
const CHEMICAL_PRODUCTS = [
  { name: 'Tile Adhesive (20kg bag)', unit: 'bag', price: 550, brand: null, grade: null },
  { name: 'Waterproofing Coating (20L)', unit: 'container', price: 3800, brand: null, grade: null },
]
const TOOLS_PRODUCTS = [
  { name: 'Claw Hammer', unit: 'piece', price: 350, brand: null, grade: null },
  { name: 'Cordless Drill Machine', unit: 'piece', price: 3200, brand: null, grade: null },
  { name: 'Measuring Tape (5m)', unit: 'piece', price: 180, brand: null, grade: null },
]
const SAFETY_PRODUCTS = [
  { name: 'Safety Helmet', unit: 'piece', price: 220, brand: null, grade: null },
  { name: 'Safety Shoes', unit: 'pair', price: 950, brand: null, grade: null },
  { name: 'Safety Gloves', unit: 'pair', price: 150, brand: null, grade: null },
  { name: 'Safety Vest', unit: 'piece', price: 280, brand: null, grade: null },
]

// Verified real product photographs, self-hosted under client/public/materials/
// (hotlinking Wikimedia Commons triggered Chrome's Opaque Response Blocking
// for a large fraction of files). `source` keeps the original page for
// attribution; never claim these are official manufacturer photos.
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

// A small, real, multi-city demo supplier set (not a mechanically generated
// one-per-town filler list) — enough to exercise nearby search, radius
// filtering, sorting and comparison across real Indian cities without
// pretending to be an exhaustive national directory.
const SHOPS = [
  { id: 'S01', name: 'UltraTech Cement Depot', category: 'Cement', city: 'Hyderabad', state: 'Telangana', address: '12-2-417, Malakpet Main Road, Malakpet, Hyderabad, Telangana 500036', phone: '+919812340001' },
  { id: 'S01B', name: 'Konkan Cement Traders', category: 'Cement', city: 'Mumbai', state: 'Maharashtra', address: 'Shop No. 4, Sion-Trombay Road, Chembur, Mumbai, Maharashtra 400071', phone: '+919812340002' },
  { id: 'S01C', name: 'Delhi Cement House', category: 'Cement', city: 'Delhi', state: 'Delhi', address: '45, GT Karnal Road, Azadpur, Delhi 110033', phone: '+919812340003' },
  { id: 'S02', name: 'Steel Hub Hyderabad', category: 'Steel', city: 'Hyderabad', state: 'Telangana', address: '8-3-945, Ring Road, Balanagar, Hyderabad, Telangana 500037', phone: '+919812340004' },
  { id: 'S02B', name: 'Chennai Steel Traders', category: 'Steel', city: 'Chennai', state: 'Tamil Nadu', address: 'No. 18, NSC Bose Road, Sowcarpet, Chennai, Tamil Nadu 600001', phone: '+919812340005' },
  { id: 'S02C', name: 'Pune TMT Steel Corner', category: 'Steel', city: 'Pune', state: 'Maharashtra', address: 'Shivaji Road, Pune Camp, Pune, Maharashtra 411001', phone: '+919812340006' },
  { id: 'S03', name: 'Sri Balaji Bricks & Blocks', category: 'Bricks', city: 'Hyderabad', state: 'Telangana', address: 'Plot 45, Industrial Area, Uppal, Hyderabad, Telangana 500039', phone: '+919812340007' },
  { id: 'S03B', name: 'Bangalore Brick Works', category: 'Bricks', city: 'Bengaluru', state: 'Karnataka', address: 'Tumkur Road, Yeshwanthpur, Bengaluru, Karnataka 560022', phone: '+919812340008' },
  { id: 'S03C', name: 'Kolkata Clay Bricks Co.', category: 'Bricks', city: 'Kolkata', state: 'West Bengal', address: 'Jessore Road, Dum Dum, Kolkata, West Bengal 700028', phone: '+919812340009' },
  { id: 'S04', name: 'Hyderabad Sand & Aggregates', category: 'Sand & Aggregates', city: 'Hyderabad', state: 'Telangana', address: 'Survey No. 112, Patancheru Road, Patancheru, Hyderabad, Telangana 502319', phone: '+919812340010' },
  { id: 'S04B', name: 'Gujarat Sand Suppliers', category: 'Sand & Aggregates', city: 'Ahmedabad', state: 'Gujarat', address: 'Sarkhej-Gandhinagar Highway, Ahmedabad, Gujarat 380054', phone: '+919812340011' },
  { id: 'S04C', name: 'Rajasthan Aggregates', category: 'Sand & Aggregates', city: 'Jaipur', state: 'Rajasthan', address: 'Ajmer Road, Jaipur, Rajasthan 302006', phone: '+919812340012' },
  { id: 'S05', name: 'Asian Paints Gallery', category: 'Paint', city: 'Hyderabad', state: 'Telangana', address: '3-6-282, Himayatnagar Main Road, Himayatnagar, Hyderabad, Telangana 500029', phone: '+919812340013' },
  { id: 'S05B', name: 'Mumbai Paint House', category: 'Paint', city: 'Mumbai', state: 'Maharashtra', address: '12, Kalbadevi Road, Kalbadevi, Mumbai, Maharashtra 400002', phone: '+919812340014' },
  { id: 'S05C', name: 'Lucknow Colour World', category: 'Paint', city: 'Lucknow', state: 'Uttar Pradesh', address: 'Aminabad Market, Lucknow, Uttar Pradesh 226018', phone: '+919812340015' },
  { id: 'S06', name: 'Kajaria Tiles World', category: 'Tiles', city: 'Hyderabad', state: 'Telangana', address: 'Shop 7, SD Road, Secunderabad, Hyderabad, Telangana 500003', phone: '+919812340016' },
  { id: 'S06B', name: 'Chennai Tiles Gallery', category: 'Tiles', city: 'Chennai', state: 'Tamil Nadu', address: 'Anna Salai, Teynampet, Chennai, Tamil Nadu 600018', phone: '+919812340017' },
  { id: 'S06C', name: 'Delhi Ceramics Hub', category: 'Tiles', city: 'Delhi', state: 'Delhi', address: 'Kirti Nagar Furniture Market Road, Kirti Nagar, New Delhi, Delhi 110015', phone: '+919812340018' },
  { id: 'S07', name: 'Finolex Plumbing Store', category: 'Plumbing', city: 'Hyderabad', state: 'Telangana', address: '6-1-91, Lakdikapul, Hyderabad, Telangana 500004', phone: '+919812340019' },
  { id: 'S07B', name: 'Bangalore Plumbing Mart', category: 'Plumbing', city: 'Bengaluru', state: 'Karnataka', address: 'SP Road, Shivajinagar, Bengaluru, Karnataka 560001', phone: '+919812340020' },
  { id: 'S07C', name: 'Pune Pipe & Fittings', category: 'Plumbing', city: 'Pune', state: 'Maharashtra', address: 'Bibwewadi Road, Bibwewadi, Pune, Maharashtra 411037', phone: '+919812340021' },
  { id: 'S08', name: 'Havells Electrical Mart', category: 'Electrical', city: 'Hyderabad', state: 'Telangana', address: '1-8-303, Chikkadpally, Hyderabad, Telangana 500020', phone: '+919812340022' },
  { id: 'S08B', name: 'Mumbai Electricals', category: 'Electrical', city: 'Mumbai', state: 'Maharashtra', address: 'Lamington Road, Grant Road, Mumbai, Maharashtra 400007', phone: '+919812340023' },
  { id: 'S08C', name: 'Kolkata Wire & Switch Co.', category: 'Electrical', city: 'Kolkata', state: 'West Bengal', address: 'Bentinck Street, Kolkata, West Bengal 700001', phone: '+919812340024' },
  { id: 'S09', name: 'BuildHardware & Tools', category: 'Hardware', city: 'Hyderabad', state: 'Telangana', address: 'Shop 22, Begum Bazaar, Hyderabad, Telangana 500012', phone: '+919812340025' },
  { id: 'S09B', name: 'Ahmedabad Hardware Store', category: 'Hardware', city: 'Ahmedabad', state: 'Gujarat', address: 'Manek Chowk, Ahmedabad, Gujarat 380001', phone: '+919812340026' },
  { id: 'S09C', name: 'Chennai Tools & Hardware', category: 'Hardware', city: 'Chennai', state: 'Tamil Nadu', address: 'Errabalu Chetty Street, George Town, Chennai, Tamil Nadu 600001', phone: '+919812340027' },
  { id: 'S10', name: 'Cera Sanitaryware', category: 'Sanitaryware', city: 'Hyderabad', state: 'Telangana', address: '5-4-187, Abids Road, Abids, Hyderabad, Telangana 500001', phone: '+919812340028' },
  { id: 'S10B', name: 'Delhi Sanitary Gallery', category: 'Sanitaryware', city: 'Delhi', state: 'Delhi', address: 'Bhagirath Palace, Chandni Chowk, Delhi 110006', phone: '+919812340029' },
  { id: 'S10C', name: 'Bangalore Bath Fittings', category: 'Sanitaryware', city: 'Bengaluru', state: 'Karnataka', address: 'Residency Road, Bengaluru, Karnataka 560025', phone: '+919812340030' },
  { id: 'S11', name: 'Warangal Steel Traders', category: 'Steel', city: 'Warangal', state: 'Telangana', address: 'Kazipet Road, Warangal, Telangana 506002', phone: '+919812340031' },
  { id: 'S12', name: 'Warangal Hardware Bazaar', category: 'Hardware', city: 'Warangal', state: 'Telangana', address: 'Station Road, Warangal, Telangana 506002', phone: '+919812340032' },
  { id: 'S13', name: 'Nashik Cement Store', category: 'Cement', city: 'Nashik', state: 'Maharashtra', address: 'Dwarka Circle, Nashik, Maharashtra 422011', phone: '+919812340033' },
  { id: 'S14', name: 'Nashik Sanitary Mart', category: 'Sanitaryware', city: 'Nashik', state: 'Maharashtra', address: 'College Road, Nashik, Maharashtra 422005', phone: '+919812340034' },
  { id: 'S15', name: 'Gurugram Electricals', category: 'Electrical', city: 'Gurugram', state: 'Haryana', address: 'Old Railway Road, Gurugram, Haryana 122001', phone: '+919812340035' },
  { id: 'S16', name: 'Gurugram Tiles Hub', category: 'Tiles', city: 'Gurugram', state: 'Haryana', address: 'Sector 14 Market, Gurugram, Haryana 122001', phone: '+919812340036' },
  { id: 'S17', name: 'Coimbatore Plumbing Store', category: 'Plumbing', city: 'Coimbatore', state: 'Tamil Nadu', address: 'Oppanakara Street, Coimbatore, Tamil Nadu 641001', phone: '+919812340037' },
  { id: 'S18', name: 'Coimbatore Paint Point', category: 'Paint', city: 'Coimbatore', state: 'Tamil Nadu', address: 'RS Puram Main Road, Coimbatore, Tamil Nadu 641002', phone: '+919812340038' },
  { id: 'S19', name: 'Mysore Bricks & Blocks', category: 'Bricks', city: 'Mysuru', state: 'Karnataka', address: 'Hunsur Road, Mysuru, Karnataka 570001', phone: '+919812340039' },
  { id: 'S20', name: 'Mysore Sand Suppliers', category: 'Sand & Aggregates', city: 'Mysuru', state: 'Karnataka', address: 'Bannur Road, Mysuru, Karnataka 570004', phone: '+919812340040' },
  { id: 'S21', name: 'Siliguri Hardware Store', category: 'Hardware', city: 'Siliguri', state: 'West Bengal', address: 'Hill Cart Road, Siliguri, West Bengal 734001', phone: '+919812340041' },
  { id: 'S22', name: 'Siliguri Steel Corner', category: 'Steel', city: 'Siliguri', state: 'West Bengal', address: 'Sevoke Road, Siliguri, West Bengal 734001', phone: '+919812340042' },
  { id: 'S23', name: 'Rajkot Sand & Aggregates', category: 'Sand & Aggregates', city: 'Rajkot', state: 'Gujarat', address: 'Kalawad Road, Rajkot, Gujarat 360005', phone: '+919812340043' },
  { id: 'S24', name: 'Rajkot Tiles Gallery', category: 'Tiles', city: 'Rajkot', state: 'Gujarat', address: 'Yagnik Road, Rajkot, Gujarat 360001', phone: '+919812340044' },
  { id: 'S25', name: 'Udaipur Cement House', category: 'Cement', city: 'Udaipur', state: 'Rajasthan', address: 'Chetak Circle, Udaipur, Rajasthan 313001', phone: '+919812340045' },
  { id: 'S26', name: 'Udaipur Electricals', category: 'Electrical', city: 'Udaipur', state: 'Rajasthan', address: 'Surajpole Bazaar, Udaipur, Rajasthan 313001', phone: '+919812340046' },
  { id: 'S27', name: 'Varanasi Colour World', category: 'Paint', city: 'Varanasi', state: 'Uttar Pradesh', address: 'Lahurabir Road, Varanasi, Uttar Pradesh 221002', phone: '+919812340047' },
  { id: 'S28', name: 'Varanasi Plumbing Mart', category: 'Plumbing', city: 'Varanasi', state: 'Uttar Pradesh', address: 'Sigra Main Road, Varanasi, Uttar Pradesh 221010', phone: '+919812340048' },
  { id: 'S29', name: 'Hyderabad Timber Mart', category: 'Wood', city: 'Hyderabad', state: 'Telangana', address: 'Old Bowenpally Timber Depot Road, Hyderabad, Telangana 500011', phone: '+919812340049' },
  { id: 'S30', name: 'Hyderabad Roofing Solutions', category: 'Roofing', city: 'Hyderabad', state: 'Telangana', address: 'Kukatpally Housing Board, Hyderabad, Telangana 500072', phone: '+919812340050' },
  { id: 'S31', name: 'Hyderabad Construction Chemicals', category: 'Construction Chemicals', city: 'Hyderabad', state: 'Telangana', address: 'Bahadurpura, Hyderabad, Telangana 500064', phone: '+919812340051' },
  { id: 'S32', name: 'Hyderabad Tools Centre', category: 'Tools', city: 'Hyderabad', state: 'Telangana', address: 'Sultan Bazaar, Hyderabad, Telangana 500095', phone: '+919812340052' },
  { id: 'S33', name: 'Hyderabad Safety Gear Store', category: 'Safety', city: 'Hyderabad', state: 'Telangana', address: 'Nampally Station Road, Hyderabad, Telangana 500001', phone: '+919812340053' },
]

// Real, verified city-center coordinates (accurate to the city, not a
// specific street address).
const CITY_COORDS = {
  Hyderabad: [17.3850, 78.4867], Mumbai: [19.0760, 72.8777], Delhi: [28.7041, 77.1025],
  Chennai: [13.0827, 80.2707], Bengaluru: [12.9716, 77.5946], Pune: [18.5204, 73.8567],
  Kolkata: [22.5726, 88.3639], Ahmedabad: [23.0225, 72.5714], Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462], Warangal: [17.9689, 79.5941], Nashik: [19.9975, 73.7898],
  Gurugram: [28.4595, 77.0266], Coimbatore: [11.0168, 76.9558], Mysuru: [12.2958, 76.6394],
  Siliguri: [26.7271, 88.3953], Rajkot: [22.3039, 70.8022], Udaipur: [24.5854, 73.7125],
  Varanasi: [25.3176, 82.9739],
}

// Deterministic string hash -> stable pseudo-random rating/delivery/stock
// values per shop/product id, so re-seeding (which runs on every server
// start) reproduces the same values instead of drifting.
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}
function ratingFor(shopId) {
  const h = hashString(shopId)
  return +(3.7 + (h % 12) / 10).toFixed(1)
}
function deliveryFor(shopId) {
  const h = hashString(shopId)
  return { available: h % 10 !== 0, radiusKm: [10, 15, 25, 50][h % 4] }
}
function stockStatusFor(id) {
  const r = hashString(id) % 20
  if (r === 0) return 'OUT_OF_STOCK' // 5%
  if (r <= 2) return 'LIMITED' // 10%
  return 'IN_STOCK' // 85%
}
function quantityFor(status) {
  if (status === 'OUT_OF_STOCK') return 0
  if (status === 'LIMITED') return 3
  return 50
}
const MIN_ORDER_BY_UNIT = {
  bag: 5, kg: 25, roll: 2, piece: 10, pair: 2, set: 1, box: 2, bucket: 1,
  coil: 1, length: 5, sheet: 5, container: 1, pack: 5, ton: 1, 'lot of 1000': 1,
}
const minOrderFor = (unit) => MIN_ORDER_BY_UNIT[unit] || 1
const pincodeFrom = (address) => address.match(/(\d{6})\b/)?.[1] || null

export async function seedMaterials() {
  await withTransaction(async (client) => {
    // Categories
    const categoryIdByName = new Map()
    for (let i = 0; i < CATEGORY_LIST.length; i++) {
      const { rows } = await client.query(
        `INSERT INTO material_categories (name, sort_order) VALUES ($1, $2)
         ON CONFLICT (name) WHERE parent_category_id IS NULL DO UPDATE SET sort_order = $2
         RETURNING id`,
        [CATEGORY_LIST[i], i]
      )
      categoryIdByName.set(CATEGORY_LIST[i], rows[0].id)
    }

    // Brands
    const brandNames = new Set()
    for (const products of Object.values(CATEGORY_PRODUCTS)) {
      for (const p of products) if (p.brand) brandNames.add(p.brand)
    }
    const brandIdByName = new Map()
    for (const name of brandNames) {
      const { rows } = await client.query(
        `INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = $1 RETURNING id`,
        [name]
      )
      brandIdByName.set(name, rows[0].id)
    }

    // Materials catalog (one row per distinct product name)
    const materialIdByName = new Map()
    for (const [category, products] of Object.entries(CATEGORY_PRODUCTS)) {
      for (const p of products) {
        const image = MATERIAL_IMAGES[p.name] || {}
        const keywords = [category, p.brand, p.grade, p.name].filter(Boolean).join(' ')
        const { rows } = await client.query(
          `INSERT INTO materials (name, category_id, brand_id, grade, unit, image_url, image_source, search_keywords)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (name) DO UPDATE SET category_id = $2, brand_id = $3, grade = $4, unit = $5,
             image_url = $6, image_source = $7, search_keywords = $8, updated_at = now()
           RETURNING id`,
          [p.name, categoryIdByName.get(category), p.brand ? brandIdByName.get(p.brand) : null, p.grade, p.unit, image.url || null, image.source || null, keywords]
        )
        materialIdByName.set(p.name, rows[0].id)
      }
    }

    const validSupplierIds = []
    for (const shop of SHOPS) {
      const [lat, lng] = CITY_COORDS[shop.city] || [22.0, 79.0]
      const rating = ratingFor(shop.id)
      const { available: deliveryAvailable, radiusKm } = deliveryFor(shop.id)

      const { rows: supplierRows } = await client.query(
        `INSERT INTO suppliers (business_name, supplier_type, verification_status, rating, delivery_available, delivery_radius_km, source, phone, whatsapp)
         VALUES ($1, $2, 'pending', $3, $4, $5, 'seed_dataset', $6, $6)
         ON CONFLICT (business_name) WHERE source = 'seed_dataset' DO UPDATE SET supplier_type = $2, rating = $3,
           delivery_available = $4, delivery_radius_km = $5, phone = $6, whatsapp = $6, updated_at = now()
         RETURNING id`,
        [shop.name, shop.category, rating, deliveryAvailable, radiusKm, shop.phone]
      )
      const supplierId = supplierRows[0].id
      validSupplierIds.push(supplierId)

      await client.query(
        `INSERT INTO supplier_locations (supplier_id, address, state, city, pincode, latitude, longitude, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (supplier_id) WHERE is_primary = true DO UPDATE SET
           address = $2, state = $3, city = $4, pincode = $5, latitude = $6, longitude = $7`,
        [supplierId, shop.address, shop.state, shop.city, pincodeFrom(shop.address), lat, lng]
      )

      for (const product of CATEGORY_PRODUCTS[shop.category]) {
        const materialId = materialIdByName.get(product.name)
        const { rows: smRows } = await client.query(
          `INSERT INTO supplier_materials (supplier_id, material_id, brand, product_name, grade, unit, minimum_order_quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (supplier_id, material_id) DO UPDATE SET product_name = $4, updated_at = now()
           RETURNING id`,
          [supplierId, materialId, product.brand, product.name, product.grade, product.unit, minOrderFor(product.unit)]
        )
        const supplierMaterialId = smRows[0].id
        const stockKey = `${supplierId}-${materialId}`
        const stockStatus = stockStatusFor(stockKey)
        const quantity = quantityFor(stockStatus)

        const { rows: existingInv } = await client.query(
          'SELECT quantity, stock_status FROM inventory WHERE supplier_material_id = $1',
          [supplierMaterialId]
        )
        if (!existingInv.length) {
          await client.query(
            `INSERT INTO inventory (supplier_material_id, quantity, stock_status, source, verified)
             VALUES ($1, $2, $3, 'seed_dataset', false)`,
            [supplierMaterialId, quantity, stockStatus]
          )
        } else if (Number(existingInv[0].quantity) !== quantity || existingInv[0].stock_status !== stockStatus) {
          await client.query(
            `UPDATE inventory SET quantity = $2, stock_status = $3, last_updated_at = now()
             WHERE supplier_material_id = $1`,
            [supplierMaterialId, quantity, stockStatus]
          )
        }

        const { rows: currentPrice } = await client.query(
          'SELECT id, price FROM material_prices WHERE supplier_material_id = $1 AND valid_until IS NULL',
          [supplierMaterialId]
        )
        if (!currentPrice.length) {
          await client.query(
            `INSERT INTO material_prices (supplier_material_id, price, unit, minimum_quantity, source, verified)
             VALUES ($1, $2, $3, $4, 'seed_dataset', false)`,
            [supplierMaterialId, product.price, product.unit, minOrderFor(product.unit)]
          )
        } else if (Number(currentPrice[0].price) !== product.price) {
          await client.query('UPDATE material_prices SET valid_until = now() WHERE id = $1', [currentPrice[0].id])
          await client.query(
            `INSERT INTO material_prices (supplier_material_id, price, unit, minimum_quantity, source, verified)
             VALUES ($1, $2, $3, $4, 'seed_dataset', false)`,
            [supplierMaterialId, product.price, product.unit, minOrderFor(product.unit)]
          )
        }
      }
    }

    // Remove seed suppliers no longer in SHOPS (id scheme change etc.) —
    // never touches suppliers with source != 'seed_dataset' (real registrations).
    await client.query(
      `DELETE FROM suppliers WHERE source = 'seed_dataset' AND NOT (id = ANY($1::uuid[]))`,
      [validSupplierIds]
    )
  })

  console.log(`Seeded ${SHOPS.length} demo suppliers across ${new Set(SHOPS.map((s) => s.city)).size} cities (source=seed_dataset, verification_status=pending)`)
}

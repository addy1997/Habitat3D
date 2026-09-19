import { StagingVariantPlan } from '../types';

export const EIGHT_STYLES: StagingVariantPlan[] = [
  {
    demographic: 'Executive & Remote Founder',
    variant_title: 'Executive Home Office',
    lighting_style: 'Warm Architectural Task (2700K - 3200K) + Diffused Daylight',
    prompt_instruction: 'Stage a commanding executive workspace with a minimalist walnut desk, ergonomic seating, antique rug, vintage globes, and warm ambient brass lighting.',
    color_palette: ['#1C1917', '#78350F', '#D97706', '#E7E5E4'],
    vibe_keywords: ['Bespoke', 'Focus-Driven', 'Antique Accents', 'Natural Walnut'],
    furniture_list: [
      {
        item_name: 'Walnut Executive Desk',
        relative_bounding_box: [0.32, 0.35, 0.68, 0.58],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.8, depth_m: 0.85, height_m: 0.75, clearance_m: 1.1 },
        category: 'desk',
      },
      {
        item_name: 'Ergonomic Leather Task Chair',
        relative_bounding_box: [0.42, 0.22, 0.58, 0.35],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.68, depth_m: 0.68, height_m: 1.15, clearance_m: 0.95 },
        category: 'seating',
      },
      {
        item_name: 'Antique Persian Area Rug',
        relative_bounding_box: [0.2, 0.1, 0.8, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.8, depth_m: 2.2, height_m: 0.02, clearance_m: 0 },
        category: 'decor',
      },
      {
        item_name: 'Vintage Brass Floor Lamp',
        relative_bounding_box: [0.15, 0.65, 0.25, 0.75],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.4, depth_m: 0.4, height_m: 1.7, clearance_m: 0.5 },
        category: 'lighting',
      },
      {
        item_name: 'Classic Bookshelf Credenza',
        relative_bounding_box: [0.12, 0.15, 0.28, 0.72],
        orientation_degrees: 90,
        dimensions_metric: { width_m: 2.2, depth_m: 0.45, height_m: 1.4, clearance_m: 0.85 },
        category: 'storage',
      }
    ]
  },
  {
    demographic: 'Minimalist Enthusiast',
    variant_title: 'Scandinavian Living',
    lighting_style: 'Bright, airy, natural daylight with warm 3000K accents',
    prompt_instruction: 'Clean, minimalist, functional, and cozy (hygge) living room with neutral colors, pale oak wood, and chunky wool textiles.',
    color_palette: ['#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB'],
    vibe_keywords: ['Hygge', 'Clean Lines', 'Airy', 'Light Oak'],
    furniture_list: [
      {
        item_name: 'Sleek Light Grey Sofa',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.2, depth_m: 0.9, height_m: 0.8, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Light Ash Wood Coffee Table',
        relative_bounding_box: [0.4, 0.55, 0.6, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.2, depth_m: 0.7, height_m: 0.4, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Neutral Wool Area Rug',
        relative_bounding_box: [0.2, 0.25, 0.8, 0.75],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 3.0, depth_m: 2.5, height_m: 0.02, clearance_m: 0 },
        category: 'decor',
      },
      {
        item_name: 'Potted Monstera Plant',
        relative_bounding_box: [0.8, 0.6, 0.9, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.5, depth_m: 0.5, height_m: 1.2, clearance_m: 0.6 },
        category: 'decor',
      }
    ]
  },
  {
    demographic: 'Rustic Romantic',
    variant_title: 'French Country Lounge',
    lighting_style: 'Soft ambient and warm crystal chandelier glow',
    prompt_instruction: 'Elegant, rustic, romantic, and time-worn living room with distressed painted wood, pastel sage, ornate details, and toile fabric.',
    color_palette: ['#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280'],
    vibe_keywords: ['Romantic', 'Vintage', 'Rustic', 'Ornate'],
    furniture_list: [
      {
        item_name: 'Rolled-Arm Beige Sofa',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.3, depth_m: 0.95, height_m: 0.85, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Antique Cabriole Coffee Table',
        relative_bounding_box: [0.4, 0.55, 0.6, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.1, depth_m: 0.7, height_m: 0.45, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Tufted Armchair',
        relative_bounding_box: [0.75, 0.45, 0.9, 0.65],
        orientation_degrees: -30,
        dimensions_metric: { width_m: 0.85, depth_m: 0.85, height_m: 0.9, clearance_m: 0.8 },
        category: 'seating',
      },
      {
        item_name: 'Crystal Floor Chandelier',
        relative_bounding_box: [0.1, 0.6, 0.2, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.6, depth_m: 0.6, height_m: 1.8, clearance_m: 0.6 },
        category: 'lighting',
      }
    ]
  },
  {
    demographic: 'Urban Loft Dweller',
    variant_title: 'Industrial Chic Lounge',
    lighting_style: 'Edison bulb warmth with high-contrast shadows',
    prompt_instruction: 'Raw, edgy, urban living room with exposed elements, dark leather, reclaimed wood, and metal accents.',
    color_palette: ['#1F2937', '#374151', '#4B5563', '#6B7280'],
    vibe_keywords: ['Raw', 'Edgy', 'Utilitarian', 'Leather'],
    furniture_list: [
      {
        item_name: 'Distressed Leather Chesterfield Sofa',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.4, depth_m: 1.0, height_m: 0.8, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Metal & Wood Factory Coffee Table',
        relative_bounding_box: [0.4, 0.55, 0.6, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.3, depth_m: 0.75, height_m: 0.42, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Cage Lamp',
        relative_bounding_box: [0.1, 0.6, 0.2, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.4, depth_m: 0.4, height_m: 1.8, clearance_m: 0.5 },
        category: 'lighting',
      },
      {
        item_name: 'Steel Media Console',
        relative_bounding_box: [0.3, 0.8, 0.7, 0.95],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.0, depth_m: 0.45, height_m: 0.6, clearance_m: 0.8 },
        category: 'storage',
      }
    ]
  },
  {
    demographic: 'Zen Seeker',
    variant_title: 'Japandi Harmony',
    lighting_style: 'Soft diffused paper lantern glow, tranquil shadows',
    prompt_instruction: 'Hybrid Japanese minimalism and Scandinavian warmth; low-profile furniture, natural bamboo, muted earthy tones.',
    color_palette: ['#FDFBF7', '#E7E5E4', '#D6D3D1', '#78716C'],
    vibe_keywords: ['Zen', 'Grounded', 'Craftsmanship', 'Tranquil'],
    furniture_list: [
      {
        item_name: 'Low-Slung Platform Sofa',
        relative_bounding_box: [0.3, 0.35, 0.7, 0.55],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.1, depth_m: 0.9, height_m: 0.65, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Minimalist Slatted Wood Table',
        relative_bounding_box: [0.42, 0.6, 0.58, 0.72],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.0, depth_m: 0.6, height_m: 0.35, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Paper Lantern Floor Lamp',
        relative_bounding_box: [0.15, 0.6, 0.25, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.5, depth_m: 0.5, height_m: 1.5, clearance_m: 0.6 },
        category: 'lighting',
      },
      {
        item_name: 'Low-Pile Neutral Rug',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.75],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.8, depth_m: 2.2, height_m: 0.01, clearance_m: 0 },
        category: 'decor',
      }
    ]
  },
  {
    demographic: 'Retro Enthusiast',
    variant_title: 'Mid-Century Modern',
    lighting_style: 'Warm 2700K ambient with distinct architectural light pools',
    prompt_instruction: 'Retro 1960s functional design with tapered dowel legs, rich walnut wood, and pops of burnt orange.',
    color_palette: ['#B45309', '#92400E', '#78350F', '#FDE68A'],
    vibe_keywords: ['Retro', 'Geometric', 'Teak & Walnut', 'Organic Curves'],
    furniture_list: [
      {
        item_name: 'Tufted Sofa on Pegged Legs',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.2, depth_m: 0.85, height_m: 0.75, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Eames-Style Lounge Chair',
        relative_bounding_box: [0.75, 0.55, 0.9, 0.75],
        orientation_degrees: -45,
        dimensions_metric: { width_m: 0.85, depth_m: 0.9, height_m: 0.85, clearance_m: 0.9 },
        category: 'seating',
      },
      {
        item_name: 'Kidney-Shaped Wood Coffee Table',
        relative_bounding_box: [0.4, 0.55, 0.6, 0.65],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.2, depth_m: 0.6, height_m: 0.4, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Walnut Credenza',
        relative_bounding_box: [0.25, 0.8, 0.75, 0.95],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.0, depth_m: 0.45, height_m: 0.7, clearance_m: 0.8 },
        category: 'storage',
      }
    ]
  },
  {
    demographic: 'Eclectic Artist',
    variant_title: 'Bohemian Oasis',
    lighting_style: 'Dappled sunlight and warm low-level lamp glow',
    prompt_instruction: 'Eclectic, relaxed boho lounge with layered patterns, macramé, rattan, terracotta hues, and abundant indoor plants.',
    color_palette: ['#991B1B', '#B45309', '#D97706', '#FDE68A'],
    vibe_keywords: ['Eclectic', 'Macramé', 'Terracotta', 'Lush'],
    furniture_list: [
      {
        item_name: 'Plush Patterned Sofa',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.3, depth_m: 0.95, height_m: 0.8, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Woven Pouf Set',
        relative_bounding_box: [0.45, 0.55, 0.55, 0.65],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.6, depth_m: 0.6, height_m: 0.35, clearance_m: 0.5 },
        category: 'seating',
      },
      {
        item_name: 'Moroccan Area Rug',
        relative_bounding_box: [0.2, 0.25, 0.8, 0.75],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 3.0, depth_m: 2.5, height_m: 0.02, clearance_m: 0 },
        category: 'decor',
      },
      {
        item_name: 'Large Trailing House Plant',
        relative_bounding_box: [0.1, 0.6, 0.2, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 0.6, depth_m: 0.6, height_m: 1.5, clearance_m: 0.6 },
        category: 'decor',
      },
      {
        item_name: 'Rattan Accent Chair',
        relative_bounding_box: [0.75, 0.45, 0.9, 0.65],
        orientation_degrees: -30,
        dimensions_metric: { width_m: 0.8, depth_m: 0.8, height_m: 0.9, clearance_m: 0.8 },
        category: 'seating',
      }
    ]
  },
  {
    demographic: 'Seaside Retreat',
    variant_title: 'Coastal Hampton',
    lighting_style: 'Bright, crisp, and airy daylight, lots of indirect bounce',
    prompt_instruction: 'Airy, light Hampton-style living room with white slipcovers, sea blue accents, driftwood, and jute textures.',
    color_palette: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD'],
    vibe_keywords: ['Airy', 'Crisp', 'Jute', 'Sea Blue'],
    furniture_list: [
      {
        item_name: 'White Slipcovered Deep Sofa',
        relative_bounding_box: [0.25, 0.3, 0.75, 0.5],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 2.4, depth_m: 1.0, height_m: 0.85, clearance_m: 1.0 },
        category: 'seating',
      },
      {
        item_name: 'Driftwood Glass Coffee Table',
        relative_bounding_box: [0.4, 0.55, 0.6, 0.7],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 1.2, depth_m: 0.75, height_m: 0.45, clearance_m: 0.8 },
        category: 'table',
      },
      {
        item_name: 'Jute Area Rug',
        relative_bounding_box: [0.2, 0.25, 0.8, 0.75],
        orientation_degrees: 0,
        dimensions_metric: { width_m: 3.2, depth_m: 2.6, height_m: 0.02, clearance_m: 0 },
        category: 'decor',
      },
      {
        item_name: 'Navy Striped Accent Chair',
        relative_bounding_box: [0.75, 0.45, 0.9, 0.65],
        orientation_degrees: -30,
        dimensions_metric: { width_m: 0.85, depth_m: 0.85, height_m: 0.9, clearance_m: 0.8 },
        category: 'seating',
      }
    ]
  }
];

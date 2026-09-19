import { RoomSpatialAnalysis } from '../types';
import emptySpaceImg from '../assets/images/empty_space_render_1789817909936.jpg';
import stagedOfficeImg from '../assets/images/staged_office_render_1789817925176.jpg';
import stagedBedImg from '../assets/images/staged_bed_render_1789817942359.jpg';
import stagedNurseryImg from '../assets/images/staged_nursery_render_1789817955660.jpg';

export interface SampleRoom {
  id: string;
  name: string;
  subtitle: string;
  type: string;
  thumbnail: string;
  empty_image_url?: string;
  room_images?: { id: string; name: string; dataUrl: string; angleLabel?: string }[];
  dimensionsText: string;
  initialAnalysis: RoomSpatialAnalysis;
}

export const SAMPLE_ROOMS: SampleRoom[] = [
  {
    id: 'urban-loft',
    name: 'Minimalist Open Loft',
    subtitle: 'High ceilings, light oak wood floor & floor-to-ceiling natural light',
    type: 'Empty Loft Space',
    thumbnail: emptySpaceImg,
    empty_image_url: emptySpaceImg,
    dimensionsText: '18.4 ft × 14.2 ft (261 sq ft) · 10.5 ft Ceiling',
    initialAnalysis: {
      detected_room_type: 'Open Living & Flex Space',
      estimated_square_footage: 261,
      ceiling_height_meters: 3.2,
      empty_render_url: emptySpaceImg,
      usable_floor_polygon: [
        [0.08, 0.12],
        [0.92, 0.12],
        [0.92, 0.88],
        [0.08, 0.88]
      ],
      architectural_features: {
        windows_count: 2,
        doors_count: 1,
        primary_light_source: 'East-facing double mullion windows (ambient 5400K)',
        flooring_type: 'Natural oak plank hardwood'
      },
      variants: [
        {
          demographic: 'Executive & Remote Founder',
          variant_title: 'Executive Home Office',
          lighting_style: 'Warm Architectural Task (2700K - 3200K) + Diffused Daylight',
          prompt_instruction: 'Stage a commanding executive workspace with a minimalist walnut desk, ergonomic leather seating, floating shelving, and warm ambient backlighting.',
          color_palette: ['#1C1917', '#78350F', '#D97706', '#E7E5E4'],
          vibe_keywords: ['Bespoke', 'Focus-Driven', 'Acoustic Control', 'Natural Walnut'],
          realistic_image_url: stagedOfficeImg,
          furniture_list: [
            {
              item_name: 'Walnut Executive Desk',
              relative_bounding_box: [0.32, 0.35, 0.68, 0.58],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.8, depth_m: 0.85, height_m: 0.75, clearance_m: 1.1 },
              category: 'desk'
            },
            {
              item_name: 'Ergonomic Leather Task Chair',
              relative_bounding_box: [0.42, 0.22, 0.58, 0.35],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 0.68, depth_m: 0.68, height_m: 1.15, clearance_m: 0.95 },
              category: 'seating'
            },
            {
              item_name: 'Minimalist Bookshelf Credenza',
              relative_bounding_box: [0.12, 0.15, 0.28, 0.72],
              orientation_degrees: 90,
              dimensions_metric: { width_m: 2.2, depth_m: 0.45, height_m: 1.4, clearance_m: 0.85 },
              category: 'storage'
            },
            {
              item_name: 'Bouclé Lounge Guest Armchair',
              relative_bounding_box: [0.72, 0.55, 0.88, 0.75],
              orientation_degrees: -45,
              dimensions_metric: { width_m: 0.82, depth_m: 0.85, height_m: 0.82, clearance_m: 0.9 },
              category: 'seating'
            },
            {
              item_name: 'Arched Brass Floor Lamp',
              relative_bounding_box: [0.78, 0.22, 0.88, 0.32],
              orientation_degrees: 135,
              dimensions_metric: { width_m: 0.45, depth_m: 0.45, height_m: 1.95, clearance_m: 0.6 },
              category: 'lighting'
            }
          ]
        },
        {
          demographic: 'Young Growing Family',
          variant_title: 'Nursery / Kids Room',
          lighting_style: 'Soft Dimmable Ambient (2400K) + Indirect Glow',
          prompt_instruction: 'Stage a serene, non-toxic Scandinavian nursery with certified natural oak convertible crib, boucle rocker glider, and rounded edge Montessori storage.',
          color_palette: ['#F5EBE0', '#D6CCC2', '#9CAF88', '#E3D5CA'],
          vibe_keywords: ['Montessori Safe', 'Organic Cotton', 'Noise Dampened', 'Gentle Illumination'],
          realistic_image_url: stagedNurseryImg,
          furniture_list: [
            {
              item_name: 'Natural Oak Convertible Crib',
              relative_bounding_box: [0.15, 0.28, 0.45, 0.52],
              orientation_degrees: 90,
              dimensions_metric: { width_m: 1.4, depth_m: 0.78, height_m: 0.92, clearance_m: 1.2 },
              category: 'crib'
            },
            {
              item_name: 'Plush Swivel Glider & Ottoman',
              relative_bounding_box: [0.65, 0.32, 0.85, 0.58],
              orientation_degrees: -30,
              dimensions_metric: { width_m: 0.88, depth_m: 0.92, height_m: 1.02, clearance_m: 1.0 },
              category: 'seating'
            },
            {
              item_name: 'Low Montessori Toy Cubby',
              relative_bounding_box: [0.32, 0.72, 0.72, 0.86],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.5, depth_m: 0.38, height_m: 0.65, clearance_m: 1.3 },
              category: 'storage'
            },
            {
              item_name: 'Organic Wool Cloud Playmat',
              relative_bounding_box: [0.35, 0.42, 0.62, 0.68],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.6, depth_m: 1.6, height_m: 0.05, clearance_m: 1.5 },
              category: 'decor'
            }
          ]
        },
        {
          demographic: 'Hosting & Hospitality',
          variant_title: 'Guest Bedroom Suite',
          lighting_style: 'Boutique Hotel Layered Light with Bedside Sconces',
          prompt_instruction: 'Stage a high-end boutique guest suite with a floating queen platform bed, linen textured duvet, dual marble nightstands, and luggage console bench.',
          color_palette: ['#0F172A', '#334155', '#94A3B8', '#F8FAFC'],
          vibe_keywords: ['Hotel Luxury', 'Crisp Linens', 'Luggage Friendly', 'Symmetrical'],
          realistic_image_url: stagedBedImg,
          furniture_list: [
            {
              item_name: 'Platform Queen Bed Frame & Mattress',
              relative_bounding_box: [0.32, 0.22, 0.68, 0.68],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.62, depth_m: 2.15, height_m: 0.98, clearance_m: 0.92 },
              category: 'bed'
            },
            {
              item_name: 'Fluted Oak Left Nightstand',
              relative_bounding_box: [0.18, 0.25, 0.30, 0.38],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 0.52, depth_m: 0.42, height_m: 0.58, clearance_m: 0.8 },
              category: 'storage'
            },
            {
              item_name: 'Fluted Oak Right Nightstand',
              relative_bounding_box: [0.70, 0.25, 0.82, 0.38],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 0.52, depth_m: 0.42, height_m: 0.58, clearance_m: 0.8 },
              category: 'storage'
            },
            {
              item_name: 'End-of-Bed Luggage Bench',
              relative_bounding_box: [0.35, 0.70, 0.65, 0.80],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.35, depth_m: 0.45, height_m: 0.46, clearance_m: 1.05 },
              category: 'seating'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'suburban-suite',
    name: 'Sunlit Master Bedroom Suite',
    subtitle: 'South-facing bay windows, hardwood flooring, neutral drywall',
    type: 'Empty Master Bedroom',
    thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    dimensionsText: '16.0 ft × 13.5 ft (216 sq ft) · 9.0 ft Ceiling',
    initialAnalysis: {
      detected_room_type: 'Bedroom / Private Suite',
      estimated_square_footage: 216,
      ceiling_height_meters: 2.74,
      usable_floor_polygon: [
        [0.1, 0.1],
        [0.9, 0.1],
        [0.9, 0.9],
        [0.1, 0.9]
      ],
      architectural_features: {
        windows_count: 3,
        doors_count: 2,
        primary_light_source: 'South triple bay windows',
        flooring_type: 'White oak hardwood'
      },
      variants: [
        {
          demographic: 'Executive & Remote Founder',
          variant_title: 'Executive Home Office',
          lighting_style: 'Direct Task + Architectural Cove Light',
          prompt_instruction: 'Convert bedroom suite into a high-powered home office studio.',
          color_palette: ['#18181B', '#3F3F46', '#A1A1AA', '#FAFAFA'],
          vibe_keywords: ['Ergonomic', 'Minimalist', 'Productive'],
          furniture_list: [
            {
              item_name: 'Standing Motorized Desk',
              relative_bounding_box: [0.3, 0.35, 0.7, 0.55],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.7, depth_m: 0.8, height_m: 0.72, clearance_m: 1.1 },
              category: 'desk'
            },
            {
              item_name: 'Mesh High-Back Task Chair',
              relative_bounding_box: [0.42, 0.22, 0.58, 0.34],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 0.65, depth_m: 0.65, height_m: 1.1, clearance_m: 0.9 },
              category: 'seating'
            }
          ]
        },
        {
          demographic: 'Young Growing Family',
          variant_title: 'Nursery / Kids Room',
          lighting_style: 'Soft diffused circadian lighting',
          prompt_instruction: 'Tranquil nursery layout with nursing chair near bay windows.',
          color_palette: ['#FAF0CA', '#0D3B66', '#F4D35E', '#EE964B'],
          vibe_keywords: ['Cozy', 'Secure', 'Montessori'],
          furniture_list: [
            {
              item_name: 'Convertible Wooden Crib',
              relative_bounding_box: [0.2, 0.25, 0.48, 0.52],
              orientation_degrees: 90,
              dimensions_metric: { width_m: 1.4, depth_m: 0.75, height_m: 0.9, clearance_m: 1.2 },
              category: 'crib'
            }
          ]
        },
        {
          demographic: 'Hosting & Hospitality',
          variant_title: 'Guest Bedroom Suite',
          lighting_style: 'Warm luxury hotel hospitality lighting',
          prompt_instruction: 'Serene guest bedroom with plush queen bed.',
          color_palette: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'],
          vibe_keywords: ['Luxury', 'Peaceful', 'Inviting'],
          furniture_list: [
            {
              item_name: 'Tufted King Bed',
              relative_bounding_box: [0.3, 0.2, 0.7, 0.7],
              orientation_degrees: 0,
              dimensions_metric: { width_m: 1.9, depth_m: 2.1, height_m: 1.1, clearance_m: 0.9 },
              category: 'bed'
            }
          ]
        }
      ]
    }
  }
];

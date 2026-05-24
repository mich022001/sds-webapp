export const SDS_LOGO = "/sds-logo-clean.png";

export const PRODUCTS = [
  {
    id: "PRD-001",
    name: "Balatinao Rice Coffee",
    code: "PRD-001",
    price: 350,
    srp: 600,
    image_url:
      "https://media.base44.com/images/public/6a0a949c6b8b2bff0a2af227/dfd476e18_JsQNcp7u.jpg",
    landing_title: "13-in-1 Superfood Coffee",
    description:
      "A caffeine-free rice coffee blend with wellness-focused ingredients for daily support.",
    highlights: ["Caffeine Free", "13-in-1 Formula", "Rice Coffee"],
    featured: true,
    active: true,
    display_order: 1,
  },
  {
    id: "PRD-002",
    name: "Prommix Plus",
    code: "PRD-002",
    price: 400,
    srp: 600,
    image_url:
      "https://media.base44.com/images/public/6a0a949c6b8b2bff0a2af227/27a22de17_Ia1h4L6w.jpg",
    landing_title: "Antioxidant with Probiotics",
    description:
      "A liquid dietary supplement designed to support wellness and daily vitality.",
    highlights: ["Antioxidant", "With Probiotics", "Daily Wellness"],
    featured: true,
    active: true,
    display_order: 2,
  },
  {
    id: "PRD-003",
    name: "Compact C",
    code: "PRD-003",
    price: 950,
    srp: 1500,
    image_url:
      "https://media.base44.com/images/public/6a0a949c6b8b2bff0a2af227/9b1a353a0_u_rF6CUl.jpg",
    landing_title: "Non-Acidic Vitamin C",
    description:
      "A non-acidic Vitamin C supplement with added immune-supporting nutrients.",
    highlights: ["Non-Acidic", "Vitamin C", "Immune Support"],
    featured: true,
    active: true,
    display_order: 3,
  },
  {
    id: "PRD-004",
    name: "Vigomaxx",
    code: "PRD-004",
    price: 1100,
    srp: 1800,
    image_url:
      "https://media.base44.com/images/public/6a0a949c6b8b2bff0a2af227/40cfe2ccf_Apt8kqZq.jpg",
    landing_title: "Men's Vitality Supplement",
    description:
      "A men’s dietary supplement formulated for vitality, strength, and wellness support.",
    highlights: ["Vitality", "Men's Wellness", "Daily Support"],
    featured: true,
    active: true,
    display_order: 4,
  },
];

export const PACKAGES = [
  {
    id: "PKG-001",
    name: "Package 1",
    price: 3100,
    srp: 3600,
    description: "Entry-level package for new SDS members.",
    included_products: ["Balatinao Rice Coffee", "Prommix Plus"],
    benefits: ["Member pricing", "Referral eligibility", "Member portal access"],
    recommended: false,
    active: true,
  },
  {
    id: "PKG-002",
    name: "Package 2",
    price: 3100,
    srp: 3600,
    description: "Wellness package focused on immune and antioxidant support.",
    included_products: ["Compact C", "Prommix Plus"],
    benefits: ["Member pricing", "Bonus eligibility", "Member portal access"],
    recommended: false,
    active: true,
  },
  {
    id: "PKG-003",
    name: "Package 3",
    price: 3100,
    srp: 3600,
    description: "Popular package for wellness and business starters.",
    included_products: ["Vigomaxx", "Balatinao Rice Coffee"],
    benefits: ["Referral eligibility", "Bonus tracking", "Priority onboarding"],
    recommended: true,
    active: true,
  },
  {
    id: "PKG-004",
    name: "Package 4",
    price: 3100,
    srp: 3600,
    description: "Complete package for members who want the full SDS product set.",
    included_products: ["Balatinao Rice Coffee", "Prommix Plus", "Compact C", "Vigomaxx"],
    benefits: ["All products included", "Full package value", "Business starter option"],
    recommended: false,
    active: true,
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Michael Valenzuela",
    role: "Distributor",
    message:
      "SDS helped me understand wellness products and build a direct sales opportunity.",
    photo_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 2,
    name: "Edna Cha",
    role: "Area Manager",
    message:
      "The system makes it easier to track members, packages, and earnings clearly.",
    photo_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 3,
    name: "Leo Nuelan",
    role: "Distributor",
    message:
      "The products are easy to share because people already care about wellness.",
    photo_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
  },
];

export const BONUS_TYPES = [
  {
    name: "Direct Commission",
    amount: "₱600",
    description: "Earn from direct member registrations.",
    icon: "👥",
  },
  {
    name: "Indirect Bonus",
    amount: "Product",
    description: "Product bonus from downline activity.",
    icon: "🔗",
  },
  {
    name: "Developer Bonus",
    amount: "₱200",
    description: "Bonus from eligible lower-level registrations.",
    icon: "📈",
  },
  {
    name: "AM Rebate",
    amount: "Variable",
    description: "Area Manager earnings from product movement.",
    icon: "💰",
  },
];

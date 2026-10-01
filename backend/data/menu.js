// Mock menu data — seeds the database on first run only (see backend/db.js).
// Every image URL below was verified against a real Unsplash photo before
// being added here. Still, these are stock photos standing in for the real
// thing — use the Menu Manager (/admin, Menu tab) to swap each one for an
// actual photo of your own dish (upload to Cloudinary/S3 first).

export const menu = [
  {
    id: "starters",
    name: "Starters",
    dishes: [
      {
        id: "d-sambusa",
        name: "Sambusa (3 pcs)",
        description: "Crispy pastry parcels filled with spiced minced beef. Served with chili sauce.",
        price: 2000,
        prepMinutes: 10,
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
        ingredients: [
          { id: "i-onion", name: "Onion", removable: true },
          { id: "i-chili", name: "Chili sauce", removable: true },
          { id: "i-pastry", name: "Pastry shell", removable: false }
        ]
      },
      {
        id: "d-avocado-salad",
        name: "Avocado & Tomato Salad",
        description: "Fresh Rwandan avocado, tomato, onion and a lime dressing.",
        price: 2000,
        prepMinutes: 8,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        ingredients: [
          { id: "i-onion2", name: "Red onion", removable: true },
          { id: "i-lime", name: "Lime dressing", removable: true },
          { id: "i-avocado", name: "Avocado", removable: false }
        ]
      },
      {
        id: "d-spring-rolls",
        name: "Vegetable Spring Rolls",
        description: "Crispy fried rolls packed with shredded cabbage, carrot and glass noodles.",
        price: 1800,
        prepMinutes: 9,
        image: "https://images.unsplash.com/photo-1515022376298-7333f33e704b?w=800&q=80",
        ingredients: [{ id: "i-sweetchili", name: "Sweet chili dip", removable: true }]
      },
      {
        id: "d-grilled-corn",
        name: "Grilled Corn on the Cob",
        description: "Charcoal-roasted maize brushed with butter and a pinch of chili salt.",
        price: 1200,
        prepMinutes: 12,
        image: "https://images.unsplash.com/photo-1653886764193-db9e5a93d215?w=800&q=80",
        ingredients: [
          { id: "i-butter", name: "Butter", removable: true },
          { id: "i-chilisalt", name: "Chili salt", removable: true }
        ]
      },
      {
        id: "d-sweet-potato-fries",
        name: "Sweet Potato Fries",
        description: "Crispy fried sweet potato wedges served with a house dipping sauce.",
        price: 1800,
        prepMinutes: 10,
        image: "https://images.unsplash.com/photo-1745792714512-77cffdb16020?w=800&q=80",
        ingredients: [{ id: "i-dip", name: "Dipping sauce", removable: true }]
      },
      {
        id: "d-piripiri-wings",
        name: "Piri-Piri Chicken Wings",
        description: "Grilled chicken wings tossed in a fiery piri-piri glaze.",
        price: 2500,
        prepMinutes: 14,
        image: "https://images.unsplash.com/photo-1736952332338-44dc07283462?w=800&q=80",
        ingredients: [
          { id: "i-piripiri", name: "Piri-piri glaze", removable: true },
          { id: "i-cabbage", name: "Shredded cabbage", removable: true }
        ]
      },
      {
        id: "d-beef-liver-skewers",
        name: "Beef Liver Skewers",
        description: "Marinated beef liver, grilled over open flame — a Rwandan favorite.",
        price: 2200,
        prepMinutes: 12,
        image: "https://images.unsplash.com/photo-1767974968707-db3d448d4ef3?w=800&q=80",
        ingredients: [
          { id: "i-onion6", name: "Grilled onions", removable: true },
          { id: "i-pilipili2", name: "Pili-pili sauce", removable: true }
        ]
      },
      {
        id: "d-bruschetta",
        name: "Tomato Bruschetta",
        description: "Toasted bread topped with fresh tomato, basil and garlic.",
        price: 1800,
        prepMinutes: 8,
        image: "https://images.unsplash.com/photo-1594978583693-8dfdfc93f052?w=800&q=80",
        ingredients: [
          { id: "i-garlic2", name: "Garlic", removable: true },
          { id: "i-basil", name: "Basil", removable: true }
        ]
      },
      {
        id: "d-groundnut-soup",
        name: "Groundnut Soup",
        description: "Creamy West-African-style peanut soup, gently spiced.",
        price: 1500,
        prepMinutes: 10,
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
        ingredients: [{ id: "i-chili3", name: "Extra chili", removable: true }]
      },
      {
        id: "d-plantain-chips",
        name: "Fried Plantain Chips",
        description: "Thin-sliced plantain, fried until golden and lightly salted.",
        price: 1200,
        prepMinutes: 8,
        image: "https://images.unsplash.com/photo-1563336522-c3bd728d3b45?w=800&q=80",
        ingredients: [{ id: "i-salt2", name: "Extra salt", removable: true }]
      }
    ]
  },
  {
    id: "grills",
    name: "Grills",
    dishes: [
      {
        id: "d-brochette",
        name: "Beef Brochettes",
        description: "Marinated beef skewers chargrilled over open flame.",
        price: 6500,
        prepMinutes: 18,
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80",
        ingredients: [
          { id: "i-garlic", name: "Garlic marinade", removable: true },
          { id: "i-pilipili", name: "Pili-pili sauce", removable: true },
          { id: "i-onion3", name: "Grilled onions", removable: true },
          { id: "i-beef", name: "Beef skewers", removable: false }
        ]
      },
      {
        id: "d-tilapia",
        name: "Grilled Tilapia",
        description: "Whole tilapia, charcoal-grilled with lime and house spice.",
        price: 9000,
        prepMinutes: 20,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
        ingredients: [
          { id: "i-onion4", name: "Onion", removable: true },
          { id: "i-chili2", name: "Chili sauce", removable: true },
          { id: "i-coriander", name: "Coriander", removable: true },
          { id: "i-plantain", name: "Plantain side", removable: true }
        ]
      },
      {
        id: "d-chicken-skewers",
        name: "Chicken Skewers",
        description: "Grilled chicken skewers, marinated in house spice — choose your heat.",
        price: 5500,
        prepMinutes: 15,
        image: "https://images.unsplash.com/photo-1602030638412-bb8be0b0e4b3?w=800&q=80",
        ingredients: [
          { id: "i-spice", name: "Extra spicy rub", removable: true },
          { id: "i-lemon2", name: "Lemon wedge", removable: true },
          { id: "i-chicken", name: "Chicken skewers", removable: false }
        ]
      },
      {
        id: "d-goat-skewers",
        name: "Goat Meat Skewers",
        description: "Slow-marinated goat skewers, grilled and served with fries.",
        price: 6000,
        prepMinutes: 20,
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&q=80",
        ingredients: [
          { id: "i-goatspice", name: "House spice rub", removable: true },
          { id: "i-fries2", name: "Fries", removable: false }
        ]
      },
      {
        id: "d-grilled-chicken",
        name: "Grilled Chicken (Piri-Piri)",
        description: "Half chicken, flame-grilled and basted in piri-piri sauce.",
        price: 7000,
        prepMinutes: 22,
        image: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=800&q=80",
        ingredients: [
          { id: "i-piripiri2", name: "Piri-piri basting", removable: true },
          { id: "i-lemon3", name: "Lemon wedge", removable: true }
        ]
      }
    ]
  },
  {
    id: "mains",
    name: "Main Courses",
    dishes: [
      {
        id: "d-isombe",
        name: "Isombe with Rice",
        description: "Traditional cassava leaves slow-cooked with peanuts. Served with steamed rice.",
        price: 5500,
        prepMinutes: 12,
        image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
        ingredients: [
          { id: "i-peanut", name: "Peanut sauce", removable: true },
          { id: "i-eggplant", name: "Eggplant", removable: true },
          { id: "i-rice2", name: "Rice", removable: false }
        ]
      },
      {
        id: "d-matoke",
        name: "Matoke Platter",
        description: "Steamed plantains, beans, beef stew, and greens. A hearty classic.",
        price: 6000,
        prepMinutes: 16,
        soldOut: true,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
        ingredients: [
          { id: "i-beans", name: "Beans", removable: true },
          { id: "i-greens", name: "Greens", removable: true }
        ]
      },
      {
        id: "d-beef-stew",
        name: "Beef Stew with Rice",
        description: "Slow-braised beef in a rich tomato gravy with carrots, served over rice.",
        price: 6500,
        prepMinutes: 25,
        image: "https://images.unsplash.com/photo-1689860892307-7db54ab276ba?w=800&q=80",
        ingredients: [
          { id: "i-carrot", name: "Carrots", removable: true },
          { id: "i-rice3", name: "Rice", removable: false }
        ]
      },
      {
        id: "d-chicken-curry",
        name: "Chicken Curry with Rice",
        description: "Bone-in chicken simmered in a mild coconut curry sauce, served with rice.",
        price: 6000,
        prepMinutes: 20,
        image: "https://images.unsplash.com/photo-1708782344490-9026aaa5eec7?w=800&q=80",
        ingredients: [
          { id: "i-coconut", name: "Coconut sauce", removable: true },
          { id: "i-chilicurry", name: "Extra chili", removable: true }
        ]
      }
    ]
  },
  {
    id: "sides",
    name: "Sides",
    dishes: [
      {
        id: "d-ugali",
        name: "Ugali",
        description: "Steamed maize meal, the classic side for any grill.",
        price: 1000,
        prepMinutes: 6,
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80",
        ingredients: []
      },
      {
        id: "d-rice",
        name: "Rice",
        description: "Steamed white rice.",
        price: 1000,
        prepMinutes: 6,
        image: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80",
        ingredients: []
      },
      {
        id: "d-kachumbari",
        name: "Kachumbari",
        description: "Fresh tomato, onion and chili relish.",
        price: 800,
        prepMinutes: 5,
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
        ingredients: [{ id: "i-onion5", name: "Onion", removable: true }]
      },
      {
        id: "d-fried-plantains",
        name: "Fried Plantains",
        description: "Sweet ripe plantains, pan-fried until caramelized.",
        price: 1200,
        prepMinutes: 8,
        image: "https://images.unsplash.com/photo-1683531731340-ff35378582a4?w=800&q=80",
        ingredients: []
      },
      {
        id: "d-sauteed-greens",
        name: "Sautéed Greens",
        description: "Local leafy greens sautéed with onion and garlic.",
        price: 1000,
        prepMinutes: 8,
        image: "https://images.unsplash.com/photo-1585029780574-65af8aa61abd?w=800&q=80",
        ingredients: [{ id: "i-garlic3", name: "Garlic", removable: true }]
      }
    ]
  },
  {
    id: "drinks",
    name: "Drinks",
    dishes: [
      {
        id: "d-juice",
        name: "Fresh Passion Fruit Juice",
        description: "Locally sourced passion fruit, blended fresh, no added sugar.",
        price: 1500,
        prepMinutes: 4,
        image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80",
        ingredients: [{ id: "i-sugar", name: "Sugar", removable: true }]
      },
      {
        id: "d-coffee",
        name: "Rwandan Coffee",
        description: "Single-origin coffee, freshly brewed.",
        price: 1200,
        prepMinutes: 5,
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
        ingredients: [
          { id: "i-milk", name: "Milk", removable: true },
          { id: "i-sugar2", name: "Sugar", removable: true }
        ]
      },
      {
        id: "d-mango-juice",
        name: "Fresh Mango Juice",
        description: "Ripe mango, blended fresh to order.",
        price: 1500,
        prepMinutes: 4,
        image: "https://images.unsplash.com/photo-1716956755600-4d32af2b8f87?w=800&q=80",
        ingredients: [{ id: "i-sugar3", name: "Sugar", removable: true }]
      },
      {
        id: "d-ginger-tea",
        name: "Ginger Tea",
        description: "Hot spiced tea with fresh ginger and a slice of lemon.",
        price: 1000,
        prepMinutes: 5,
        image: "https://images.unsplash.com/photo-1682530016867-6fcc63df0cfb?w=800&q=80",
        ingredients: [
          { id: "i-honey2", name: "Honey", removable: true },
          { id: "i-lemon4", name: "Lemon", removable: true }
        ]
      }
    ]
  },
  {
    id: "desserts",
    name: "Desserts",
    dishes: [
      {
        id: "d-mandazi",
        name: "Mandazi with Honey",
        description: "Warm, lightly sweet fried dough drizzled with local honey.",
        price: 1800,
        prepMinutes: 6,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
        ingredients: [{ id: "i-honey", name: "Honey drizzle", removable: true }]
      },
      {
        id: "d-banana-fritters",
        name: "Banana Fritters",
        description: "Sliced banana fried golden and sprinkled with brown sugar.",
        price: 1500,
        prepMinutes: 7,
        image: "https://images.unsplash.com/photo-1762941904142-9d91ca413e66?w=800&q=80",
        ingredients: [{ id: "i-cinnamon", name: "Cinnamon dusting", removable: true }]
      },
      {
        id: "d-fruit-platter",
        name: "Fresh Fruit Platter",
        description: "A colorful selection of seasonal fresh fruit.",
        price: 2000,
        prepMinutes: 6,
        image: "https://images.unsplash.com/photo-1664993090321-b2caff794431?w=800&q=80",
        ingredients: []
      }
    ]
  }
];

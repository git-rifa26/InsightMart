/**
 * Deterministic synthetic dataset backing the mock API.
 *
 * A seeded generator is used instead of Math.random so that figures stay
 * stable across reloads - charts should not jitter on every refresh.
 */

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const rand = seeded(20240917)
const pick = (list) => list[Math.floor(rand() * list.length)]
const between = (min, max) => min + rand() * (max - min)
const intBetween = (min, max) => Math.round(between(min, max))

/* ------------------------------------------------------------------ *
 * Reference dimensions
 * ------------------------------------------------------------------ */

export const CATEGORIES = ['Electronics', 'Apparel', 'Home & Kitchen', 'Grocery', 'Beauty', 'Sports']

export const REGIONS = ['North', 'South', 'East', 'West', 'Central']

export const BRANCHES = [
  { branch: 'Mumbai', region: 'West' },
  { branch: 'Delhi NCR', region: 'North' },
  { branch: 'Bengaluru', region: 'South' },
  { branch: 'Hyderabad', region: 'South' },
  { branch: 'Kolkata', region: 'East' },
  { branch: 'Pune', region: 'West' },
  { branch: 'Ahmedabad', region: 'Central' },
  { branch: 'Chennai', region: 'South' },
]

const PRODUCTS = [
  { name: 'Aurora Wireless Earbuds', category: 'Electronics', price: 4299, cost: 2650 },
  { name: 'Nimbus Laptop Stand', category: 'Electronics', price: 2199, cost: 1180 },
  { name: 'Vertex 4K Monitor', category: 'Electronics', price: 21999, cost: 15400 },
  { name: 'Corepress Cotton Tee', category: 'Apparel', price: 899, cost: 420 },
  { name: 'Trailform Running Shoes', category: 'Sports', price: 5499, cost: 3100 },
  { name: 'Harvest Ceramic Cookware', category: 'Home & Kitchen', price: 6799, cost: 4180 },
  { name: 'Lumen Desk Lamp', category: 'Home & Kitchen', price: 3299, cost: 1740 },
  { name: 'Everyday Grocery Bundle', category: 'Grocery', price: 1499, cost: 1120 },
  { name: 'Silk Route Face Serum', category: 'Beauty', price: 2499, cost: 980 },
  { name: 'Meridian Yoga Mat', category: 'Sports', price: 1899, cost: 940 },
  { name: 'Northwind Puffer Jacket', category: 'Apparel', price: 7499, cost: 4300 },
  { name: 'Pulse Fitness Band', category: 'Electronics', price: 3799, cost: 2210 },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* ------------------------------------------------------------------ *
 * Raw sales records - the shape a parsed CSV would produce
 * ------------------------------------------------------------------ */

function buildSalesRecords(count = 260) {
  const records = []
  const customers = Array.from({ length: 96 }, (_, i) => `CUST-${1000 + i}`)

  for (let i = 0; i < count; i += 1) {
    const product = pick(PRODUCTS)
    const location = pick(BRANCHES)
    const monthIndex = Math.floor(between(0, 12))
    const quantity = intBetween(1, 9)
    // Later months trend upward so the line chart has a believable slope.
    const seasonal = 0.78 + (monthIndex / 11) * 0.5
    const unitPrice = Math.round(product.price * between(0.93, 1.07))
    const revenue = Math.round(unitPrice * quantity * seasonal)
    const cost = Math.round(product.cost * quantity * seasonal * between(0.97, 1.05))

    records.push({
      orderId: `ORD-${24000 + i}`,
      date: new Date(2024, monthIndex, intBetween(1, 28)).toISOString(),
      month: MONTHS[monthIndex],
      monthIndex,
      quarter: `Q${Math.floor(monthIndex / 3) + 1}`,
      customerId: pick(customers),
      product: product.name,
      category: product.category,
      branch: location.branch,
      region: location.region,
      quantity,
      unitPrice,
      revenue,
      cost,
      profit: revenue - cost,
    })
  }

  return records.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export const SALES_RECORDS = buildSalesRecords()

/* ------------------------------------------------------------------ *
 * Aggregation helpers
 * ------------------------------------------------------------------ */

const sum = (list, key) => list.reduce((total, row) => total + row[key], 0)

function groupSum(records, groupKey, valueKeys = ['revenue']) {
  const map = new Map()
  for (const row of records) {
    const key = row[groupKey]
    if (!map.has(key)) {
      map.set(key, valueKeys.reduce((acc, k) => ({ ...acc, [k]: 0 }), { name: key, orders: 0 }))
    }
    const entry = map.get(key)
    for (const k of valueKeys) entry[k] += row[k]
    entry.orders += 1
  }
  return [...map.values()]
}

/** Revenue and orders per month, in calendar order. */
export function monthlyTrend(records = SALES_RECORDS) {
  return MONTHS.map((label, index) => {
    const rows = records.filter((r) => r.monthIndex === index)
    return {
      name: label,
      revenue: sum(rows, 'revenue'),
      profit: sum(rows, 'profit'),
      orders: rows.length,
    }
  })
}

export function quarterlyTrend(records = SALES_RECORDS) {
  return ['Q1', 'Q2', 'Q3', 'Q4'].map((label) => {
    const rows = records.filter((r) => r.quarter === label)
    return {
      name: label,
      revenue: sum(rows, 'revenue'),
      profit: sum(rows, 'profit'),
      orders: rows.length,
    }
  })
}

export function yearlyTrend(records = SALES_RECORDS) {
  const total = sum(records, 'revenue')
  // Two synthetic prior years give the yearly view something to compare against.
  return [
    {
      name: '2022',
      revenue: Math.round(total * 0.62),
      profit: Math.round(total * 0.17),
      orders: Math.round(records.length * 0.66),
    },
    {
      name: '2023',
      revenue: Math.round(total * 0.81),
      profit: Math.round(total * 0.23),
      orders: Math.round(records.length * 0.84),
    },
    { name: '2024', revenue: total, profit: sum(records, 'profit'), orders: records.length },
  ]
}

/** Distribution of individual order values, bucketed for the histogram. */
export function orderValueHistogram(records = SALES_RECORDS) {
  const buckets = [
    { name: '0-2K', min: 0, max: 2000 },
    { name: '2-5K', min: 2000, max: 5000 },
    { name: '5-10K', min: 5000, max: 10000 },
    { name: '10-20K', min: 10000, max: 20000 },
    { name: '20-40K', min: 20000, max: 40000 },
    { name: '40K+', min: 40000, max: Infinity },
  ]
  return buckets.map((bucket) => ({
    name: bucket.name,
    count: records.filter((r) => r.revenue >= bucket.min && r.revenue < bucket.max).length,
  }))
}

/** New vs returning customers month over month. */
export function retentionTrend(records = SALES_RECORDS) {
  const seen = new Set()
  return MONTHS.map((label, index) => {
    const rows = records.filter((r) => r.monthIndex === index)
    let fresh = 0
    let returning = 0
    for (const row of rows) {
      if (seen.has(row.customerId)) returning += 1
      else {
        fresh += 1
        seen.add(row.customerId)
      }
    }
    return { name: label, newCustomers: fresh, returning }
  })
}

export function branchProfitability(records = SALES_RECORDS) {
  return groupSum(records, 'branch', ['revenue', 'cost', 'profit'])
    .map((row) => ({
      ...row,
      margin: row.revenue ? (row.profit / row.revenue) * 100 : 0,
      region: BRANCHES.find((b) => b.branch === row.name)?.region ?? '-',
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function topProducts(records = SALES_RECORDS, limit = 6) {
  return groupSum(records, 'product', ['revenue', 'quantity', 'profit'])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function categoryShare(records = SALES_RECORDS) {
  return groupSum(records, 'category', ['revenue']).sort((a, b) => b.revenue - a.revenue)
}

export function regionShare(records = SALES_RECORDS) {
  return groupSum(records, 'region', ['revenue', 'profit']).sort((a, b) => b.revenue - a.revenue)
}

/** The headline figures shown on the KPI cards. */
export function computeKpis(records = SALES_RECORDS) {
  const revenue = sum(records, 'revenue')
  const profit = sum(records, 'profit')
  const orders = records.length
  const uniqueCustomers = new Set(records.map((r) => r.customerId)).size
  const counts = records.reduce(
    (acc, r) => acc.set(r.customerId, (acc.get(r.customerId) ?? 0) + 1),
    new Map(),
  )
  const repeat = [...counts.values()].filter((n) => n > 1).length

  return {
    revenue,
    profit,
    orders,
    customers: uniqueCustomers,
    aov: orders ? revenue / orders : 0,
    margin: revenue ? (profit / revenue) * 100 : 0,
    repeatRate: uniqueCustomers ? (repeat / uniqueCustomers) * 100 : 0,
    deltas: { revenue: 18.4, orders: 9.2, aov: 6.7, customers: 12.1, margin: 3.4, repeatRate: 4.8 },
  }
}

/* ------------------------------------------------------------------ *
 * Accounts, organisations and uploads
 * ------------------------------------------------------------------ */

export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS = [
  {
    id: 'usr_ind_01',
    name: 'Ananya Rao',
    email: 'individual@insightmart.dev',
    role: 'individual',
    plan: 'free',
    organisationId: null,
    joinedAt: '2024-02-14T09:20:00.000Z',
    uploadsThisMonth: 6,
    uploadLimit: 30,
  },
  {
    id: 'usr_ent_01',
    name: 'Vikram Shah',
    email: 'enterprise@insightmart.dev',
    role: 'enterprise',
    plan: 'enterprise',
    organisationId: 'org_01',
    joinedAt: '2023-11-02T11:05:00.000Z',
    uploadsThisMonth: 42,
    uploadLimit: 300,
  },
  {
    id: 'usr_adm_01',
    name: 'Priya Menon',
    email: 'admin@insightmart.dev',
    role: 'admin',
    plan: 'enterprise',
    organisationId: null,
    joinedAt: '2023-06-18T08:00:00.000Z',
    uploadsThisMonth: 12,
    uploadLimit: 999,
  },
]

export const ORGANISATION = {
  id: 'org_01',
  name: 'Northwind Retail Group',
  industry: 'Multi-brand retail',
  createdAt: '2023-11-02T11:05:00.000Z',
  seatsUsed: 7,
  seatLimit: 25,
  ownerId: 'usr_ent_01',
  members: [
    {
      id: 'mem_01',
      name: 'Vikram Shah',
      email: 'enterprise@insightmart.dev',
      role: 'Owner',
      status: 'active',
      lastActive: '2024-09-16T14:20:00.000Z',
      uploads: 42,
    },
    {
      id: 'mem_02',
      name: 'Kabir Nair',
      email: 'kabir.nair@northwind.co',
      role: 'Analyst',
      status: 'active',
      lastActive: '2024-09-16T09:12:00.000Z',
      uploads: 28,
    },
    {
      id: 'mem_03',
      name: 'Sara Iqbal',
      email: 'sara.iqbal@northwind.co',
      role: 'Analyst',
      status: 'active',
      lastActive: '2024-09-15T17:45:00.000Z',
      uploads: 19,
    },
    {
      id: 'mem_04',
      name: 'Dev Bhatia',
      email: 'dev.bhatia@northwind.co',
      role: 'Viewer',
      status: 'active',
      lastActive: '2024-09-14T10:30:00.000Z',
      uploads: 4,
    },
    {
      id: 'mem_05',
      name: 'Ritu Verma',
      email: 'ritu.verma@northwind.co',
      role: 'Analyst',
      status: 'invited',
      lastActive: null,
      uploads: 0,
    },
    {
      id: 'mem_06',
      name: 'Arjun Pillai',
      email: 'arjun.pillai@northwind.co',
      role: 'Viewer',
      status: 'active',
      lastActive: '2024-09-11T13:05:00.000Z',
      uploads: 2,
    },
    {
      id: 'mem_07',
      name: 'Neha Kulkarni',
      email: 'neha.k@northwind.co',
      role: 'Viewer',
      status: 'suspended',
      lastActive: '2024-08-29T16:40:00.000Z',
      uploads: 1,
    },
  ],
}

export const UPLOADS = [
  {
    id: 'up_09',
    filename: 'q3-national-sales.csv',
    rows: 4820,
    size: 486000,
    status: 'processed',
    uploadedBy: 'Vikram Shah',
    uploadedAt: '2024-09-16T13:40:00.000Z',
  },
  {
    id: 'up_08',
    filename: 'west-region-august.csv',
    rows: 1960,
    size: 214400,
    status: 'processed',
    uploadedBy: 'Kabir Nair',
    uploadedAt: '2024-09-14T10:02:00.000Z',
  },
  {
    id: 'up_07',
    filename: 'beauty-category-h1.csv',
    rows: 1204,
    size: 132800,
    status: 'processed',
    uploadedBy: 'Sara Iqbal',
    uploadedAt: '2024-09-11T16:25:00.000Z',
  },
  {
    id: 'up_06',
    filename: 'store-level-margins.csv',
    rows: 3310,
    size: 351200,
    status: 'failed',
    uploadedBy: 'Kabir Nair',
    uploadedAt: '2024-09-08T09:15:00.000Z',
    error: 'Missing required column: revenue',
  },
  {
    id: 'up_05',
    filename: 'festive-preorders.csv',
    rows: 890,
    size: 96100,
    status: 'processed',
    uploadedBy: 'Ananya Rao',
    uploadedAt: '2024-09-04T18:30:00.000Z',
  },
  {
    id: 'up_04',
    filename: 'july-online-orders.csv',
    rows: 2740,
    size: 288600,
    status: 'processed',
    uploadedBy: 'Dev Bhatia',
    uploadedAt: '2024-08-30T11:48:00.000Z',
  },
]

export const PLATFORM_USERS = [
  ...DEMO_ACCOUNTS.map((u) => ({ ...u, status: 'active' })),
  {
    id: 'usr_04',
    name: 'Kabir Nair',
    email: 'kabir.nair@northwind.co',
    role: 'member',
    plan: 'enterprise',
    status: 'active',
    joinedAt: '2023-12-01T10:00:00.000Z',
    uploadsThisMonth: 28,
  },
  {
    id: 'usr_05',
    name: 'Sara Iqbal',
    email: 'sara.iqbal@northwind.co',
    role: 'member',
    plan: 'enterprise',
    status: 'active',
    joinedAt: '2024-01-19T10:00:00.000Z',
    uploadsThisMonth: 19,
  },
  {
    id: 'usr_06',
    name: 'Rohan Desai',
    email: 'rohan.desai@gmail.com',
    role: 'individual',
    plan: 'pro',
    status: 'active',
    joinedAt: '2024-03-22T10:00:00.000Z',
    uploadsThisMonth: 31,
  },
  {
    id: 'usr_07',
    name: 'Meera Joshi',
    email: 'meera.joshi@gmail.com',
    role: 'individual',
    plan: 'free',
    status: 'active',
    joinedAt: '2024-05-08T10:00:00.000Z',
    uploadsThisMonth: 3,
  },
  {
    id: 'usr_08',
    name: 'Dev Bhatia',
    email: 'dev.bhatia@northwind.co',
    role: 'member',
    plan: 'enterprise',
    status: 'active',
    joinedAt: '2024-02-11T10:00:00.000Z',
    uploadsThisMonth: 4,
  },
  {
    id: 'usr_09',
    name: 'Farhan Ali',
    email: 'farhan.ali@outlook.com',
    role: 'individual',
    plan: 'free',
    status: 'suspended',
    joinedAt: '2024-06-30T10:00:00.000Z',
    uploadsThisMonth: 0,
  },
  {
    id: 'usr_10',
    name: 'Ishita Sen',
    email: 'ishita.sen@brightmart.in',
    role: 'enterprise',
    plan: 'enterprise',
    status: 'active',
    joinedAt: '2024-04-15T10:00:00.000Z',
    uploadsThisMonth: 22,
  },
  {
    id: 'usr_11',
    name: 'Aditya Rane',
    email: 'aditya.rane@gmail.com',
    role: 'individual',
    plan: 'pro',
    status: 'active',
    joinedAt: '2024-07-27T10:00:00.000Z',
    uploadsThisMonth: 14,
  },
]

export const PLATFORM_ORGS = [
  {
    id: 'org_01',
    name: 'Northwind Retail Group',
    owner: 'Vikram Shah',
    members: 7,
    plan: 'enterprise',
    uploads: 96,
    createdAt: '2023-11-02T11:05:00.000Z',
  },
  {
    id: 'org_02',
    name: 'Brightmart Stores',
    owner: 'Ishita Sen',
    members: 4,
    plan: 'enterprise',
    uploads: 41,
    createdAt: '2024-04-15T10:00:00.000Z',
  },
  {
    id: 'org_03',
    name: 'Coastline Traders',
    owner: 'Manav Kapoor',
    members: 3,
    plan: 'enterprise',
    uploads: 17,
    createdAt: '2024-06-21T10:00:00.000Z',
  },
]

export const CHAT_SEED = [
  {
    id: 'msg_1',
    author: 'agent',
    text: 'Welcome to InsightMart support. Ask me about uploading a CSV, reading a chart, or exporting your report.',
    at: '2024-09-16T09:00:00.000Z',
  },
]

export const CHAT_REPLIES = [
  'Your CSV needs at least a date, product and revenue column. A cost column unlocks the profitability analysis.',
  'Head to CSV Analysis, drop the file in, and the parser will show you a preview before anything is saved.',
  'PDF export is available on Pro and Enterprise. You will find it in the top right of the analysis results.',
  'Repeat purchase rate counts customers with more than one order in the uploaded period.',
  'Branch profitability compares revenue against cost per branch, so you can see where margin is strongest.',
]

// Domain model for the admin app.

export type ID = string

export type LineItem = {
  id: ID
  name: string
  description?: string
  qty: number
  unitPrice: number
}

export type Role = {
  id: ID
  name: string
  description: string
  permissions: string[] // list of permission keys, or ['*'] for everything
  system?: boolean // system roles (Developer) can't be deleted or edited
}

export type Employee = {
  id: ID
  name: string
  roleId: ID
  email: string
  phone: string
  hourlyRate: number
  travelRate: number // €/h paid for travel time (0 = travel unpaid)
  color: string
  active: boolean
  ga1Access?: boolean // per-person override granting GA1 Inspections access
}

export type ClientStatus = 'Lead' | 'Active' | 'Archived'
export type Client = {
  id: ID
  name: string
  company?: string
  email: string
  phone: string
  address: string
  status: ClientStatus
  createdAt: string
}

export type RequestStatus = 'New' | 'Assessment complete' | 'Converted' | 'Archived'
export type Request = {
  id: ID
  clientId: ID
  title: string
  service: string
  requestedOn: string
  status: RequestStatus
  message?: string // free-text enquiry, e.g. from a website contact form
}

export type QuoteStatus = 'Draft' | 'Awaiting response' | 'Approved' | 'Converted' | 'Archived'
export type Quote = {
  id: ID
  number: string
  clientId: ID
  title: string
  items: LineItem[]
  status: QuoteStatus
  createdAt: string
}

export type JobStatus = 'Unscheduled' | 'Scheduled' | 'Active' | 'Complete' | 'Requires invoicing'
export type Job = {
  id: ID
  number: string
  clientId: ID
  title: string
  items: LineItem[]
  assignedTo: ID[]
  status: JobStatus
  startDate: string
  endDate: string
}

export type InvoiceStatus = 'Draft' | 'Awaiting payment' | 'Paid' | 'Past due'
export type Invoice = {
  id: ID
  number: string
  clientId: ID
  jobId?: ID
  items: LineItem[]
  status: InvoiceStatus
  issuedOn: string
  dueOn: string
}

// ---- Shop -----------------------------------------------------------------
export type ProductSpec = { label: string; value: string }
export type Product = {
  id: ID
  name: string
  sku: string
  description?: string
  price: number
  stock: number
  active: boolean
  createdAt: string
  // Shop-catalogue fields (used to render the website shop).
  slug?: string // web-address id, e.g. "spring-hitch-6t-45mmpins"
  category?: string
  subcategory?: string
  short?: string // one-line summary shown on the shop grid
  tag?: string // badge, e.g. "New in"
  images?: string[] // photo paths/URLs
  specs?: ProductSpec[]
}

export type OrderStatus = 'New' | 'Processing' | 'Fulfilled' | 'Cancelled'
export type OrderItem = { id: ID; productId?: ID; name: string; qty: number; unitPrice: number }
export type Order = {
  id: ID
  number: string
  clientId: ID
  items: OrderItem[]
  status: OrderStatus
  source: 'admin' | 'website'
  note?: string
  invoiceId?: ID // the invoice generated from this order
  createdAt: string
}

export type TimeEntryKind = 'work' | 'travel'
export type TimeEntry = {
  id: ID
  employeeId: ID
  jobId?: ID
  date: string // ISO yyyy-mm-dd
  hours: number
  kind: TimeEntryKind // 'work' = normal working hours, 'travel' = travel time
  note?: string
  approved: boolean
}

export type VisitCategory = 'Job' | 'Travel' | 'Shop trip' | 'Other'
export type Visit = {
  id: ID
  jobId?: ID // set for job visits; empty for travel / shop trips / other blocks
  employeeId: ID
  date: string // ISO yyyy-mm-dd
  start: string // "09:00"
  end: string // "11:00"
  title?: string // label when there's no job (e.g. "Collect steel")
  category?: VisitCategory
}

export type Note = {
  id: ID
  entityType: 'client' | 'job'
  entityId: ID
  body: string
  authorId: ID
  createdAt: string // ISO timestamp
}

export type Attachment = {
  id: ID
  entityType: 'client' | 'job' | 'ga1'
  entityId: ID
  fileName: string
  path: string // storage object path within the 'attachments' bucket
  size: number
  uploadedBy: ID
  createdAt: string
}

export type GA1Result = 'safe' | 'repair_required' | 'unsafe'
export type GA1Inspection = {
  id: ID
  reportNumber: string
  clientId: ID
  examinerId: ID // an employee (competent person)
  examinerCert: string
  equipmentType: string
  manufacturer: string
  model: string
  serialNumber: string
  swl: string
  yearOfManufacture: string
  equipmentDescription: string
  examinationDate: string
  previousExaminationDate: string
  nextExaminationDate: string
  examinationLocation: string
  safeToUse: boolean
  defectsFound: boolean
  overallResult: GA1Result
  defectsDescription: string
  reinspectionDate: string
  additionalNotes: string
  signature: string
  purposeOfExamination: string
  particularsOfTests: string
  createdAt: string
}

export type State = {
  roles: Role[]
  currentUserId: ID
  employees: Employee[]
  clients: Client[]
  requests: Request[]
  quotes: Quote[]
  jobs: Job[]
  invoices: Invoice[]
  timeEntries: TimeEntry[]
  visits: Visit[]
  notes: Note[]
  ga1: GA1Inspection[]
  attachments: Attachment[]
  products: Product[]
  orders: Order[]
}

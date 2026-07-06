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
  color: string
  active: boolean
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

export type TimeEntry = {
  id: ID
  employeeId: ID
  jobId?: ID
  date: string // ISO yyyy-mm-dd
  hours: number
  note?: string
  approved: boolean
}

export type Visit = {
  id: ID
  jobId: ID
  employeeId: ID
  date: string // ISO yyyy-mm-dd
  start: string // "09:00"
  end: string // "11:00"
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
}

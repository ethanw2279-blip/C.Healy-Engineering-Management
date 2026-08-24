import type { State } from './types'
import { defaultRoles } from './permissions'

// Realistic sample data for "Ethan Whitney Detailing" so every admin screen has
// something to show on first load.
export const seed: State = {
  roles: defaultRoles,
  currentUserId: 'e1', // Ethan — Developer, so first load has full access
  employees: [
    { id: 'e1', name: 'Ethan Whitney', roleId: 'role_dev', email: 'ethan@ewdetailing.ie', phone: '087 123 4567', hourlyRate: 0, travelRate: 0, color: '#1F8A4C', active: true },
    { id: 'e2', name: 'Marcus Reilly', roleId: 'role_employee', email: 'marcus@ewdetailing.ie', phone: '086 234 5678', hourlyRate: 22, travelRate: 15, color: '#2F86EB', active: true, ga1Access: true },
    { id: 'e3', name: 'Sofia Nolan', roleId: 'role_employee', email: 'sofia@ewdetailing.ie', phone: '085 345 6789', hourlyRate: 22, travelRate: 15, color: '#C7791C', active: true },
    { id: 'e4', name: 'Liam Byrne', roleId: 'role_employee', email: 'liam@ewdetailing.ie', phone: '083 456 7890', hourlyRate: 20, travelRate: 14, color: '#7A2B3A', active: true },
    { id: 'e5', name: 'Aoife Kelly', roleId: 'role_admin', email: 'aoife@ewdetailing.ie', phone: '089 567 8901', hourlyRate: 24, travelRate: 0, color: '#5B4FB5', active: true },
  ],
  clients: [
    { id: 'c1', name: 'Ethan Whitney', email: 'ethan.w@gmail.com', phone: '087 111 2222', address: '2426 E Riverside Dr, Dublin', status: 'Lead', createdAt: '2026-07-06' },
    { id: 'c2', name: 'Marcus Reilly', company: 'Reilly Motors', email: 'info@reillymotors.ie', phone: '01 555 0143', address: '18 Fairview Ave, Dublin', status: 'Active', createdAt: '2026-06-21' },
    { id: 'c3', name: 'Dublin Fleet Co.', company: 'Dublin Fleet Co.', email: 'ops@dublinfleet.ie', phone: '01 555 0199', address: 'Point Village Depot, Dublin', status: 'Active', createdAt: '2026-05-30' },
    { id: 'c4', name: 'Grainne O’Shea', email: 'grainne@osheahomes.ie', phone: '086 777 3311', address: '5 Temple Bar, Dublin', status: 'Active', createdAt: '2026-06-11' },
    { id: 'c5', name: 'East Wall Logistics', company: 'East Wall Logistics', email: 'yard@eastwall.ie', phone: '01 555 0170', address: '9 East Wall Rd, Dublin', status: 'Active', createdAt: '2026-04-18' },
    { id: 'c6', name: 'Cian Murphy', email: 'cian.murphy@gmail.com', phone: '085 909 1212', address: '44 Marino Cres, Dublin', status: 'Lead', createdAt: '2026-07-02' },
  ],
  requests: [
    { id: 'r1', clientId: 'c1', title: 'Full exterior detail enquiry', service: 'Exterior detail', requestedOn: '2026-07-06', status: 'New' },
    { id: 'r2', clientId: 'c6', title: 'Ceramic coating quote', service: 'Ceramic coating', requestedOn: '2026-07-02', status: 'Assessment complete' },
    { id: 'r3', clientId: 'c4', title: 'Interior valet for SUV', service: 'Interior valet', requestedOn: '2026-06-28', status: 'Converted' },
  ],
  quotes: [
    { id: 'q1', number: 'Q-1042', clientId: 'c1', title: 'Full exterior detail', status: 'Awaiting response', createdAt: '2026-07-06', items: [ { id: 'qi1', name: 'Exterior wash & decontamination', qty: 1, unitPrice: 90 }, { id: 'qi2', name: 'Machine polish', qty: 1, unitPrice: 160 } ] },
    { id: 'q2', number: 'Q-1041', clientId: 'c6', title: 'Ceramic coating package', status: 'Draft', createdAt: '2026-07-02', items: [ { id: 'qi3', name: 'Paint correction', qty: 1, unitPrice: 240 }, { id: 'qi4', name: '5yr ceramic coating', qty: 1, unitPrice: 550 } ] },
    { id: 'q3', number: 'Q-1039', clientId: 'c3', title: 'Fleet wash — monthly', status: 'Approved', createdAt: '2026-06-24', items: [ { id: 'qi5', name: 'Fleet exterior wash', qty: 12, unitPrice: 35 } ] },
    { id: 'q4', number: 'Q-1038', clientId: 'c4', title: 'Interior valet', status: 'Converted', createdAt: '2026-06-20', items: [ { id: 'qi6', name: 'Interior deep clean', qty: 1, unitPrice: 130 } ] },
  ],
  jobs: [
    { id: 'j1', number: 'J-2087', clientId: 'c2', title: 'Interior deep clean', status: 'Active', assignedTo: ['e2'], startDate: '2026-07-07', endDate: '2026-07-07', items: [ { id: 'ji1', name: 'Interior deep clean', qty: 1, unitPrice: 130 } ] },
    { id: 'j2', number: 'J-2086', clientId: 'c3', title: 'Fleet wash — 4 vehicles', status: 'Scheduled', assignedTo: ['e3', 'e4'], startDate: '2026-07-09', endDate: '2026-07-09', items: [ { id: 'ji2', name: 'Fleet exterior wash', qty: 4, unitPrice: 35 } ] },
    { id: 'j3', number: 'J-2084', clientId: 'c4', title: 'Interior valet — SUV', status: 'Requires invoicing', assignedTo: ['e2'], startDate: '2026-07-01', endDate: '2026-07-01', items: [ { id: 'ji3', name: 'Interior valet', qty: 1, unitPrice: 130 } ] },
    { id: 'j4', number: 'J-2081', clientId: 'c5', title: 'Van fleet monthly wash', status: 'Complete', assignedTo: ['e3', 'e4'], startDate: '2026-06-27', endDate: '2026-06-27', items: [ { id: 'ji4', name: 'Van wash', qty: 6, unitPrice: 30 } ] },
    { id: 'j5', number: 'J-2088', clientId: 'c6', title: 'Ceramic coating', status: 'Unscheduled', assignedTo: [], startDate: '', endDate: '', items: [ { id: 'ji5', name: '5yr ceramic coating', qty: 1, unitPrice: 550 } ] },
  ],
  invoices: [
    { id: 'i1', number: 'INV-508', clientId: 'c4', jobId: 'j3', status: 'Awaiting payment', issuedOn: '2026-07-02', dueOn: '2026-07-16', items: [ { id: 'ii1', name: 'Interior valet', qty: 1, unitPrice: 130 } ] },
    { id: 'i2', number: 'INV-505', clientId: 'c5', jobId: 'j4', status: 'Paid', issuedOn: '2026-06-28', dueOn: '2026-07-12', items: [ { id: 'ii2', name: 'Van wash', qty: 6, unitPrice: 30 } ] },
    { id: 'i3', number: 'INV-499', clientId: 'c3', status: 'Past due', issuedOn: '2026-06-05', dueOn: '2026-06-19', items: [ { id: 'ii3', name: 'Fleet exterior wash', qty: 12, unitPrice: 35 } ] },
  ],
  timeEntries: [
    // Week of Jul 5 - 11
    { id: 't1', employeeId: 'e2', jobId: 'j3', date: '2026-07-01', hours: 2, kind: 'work', approved: true, note: 'Interior valet' },
    { id: 't2', employeeId: 'e2', jobId: 'j1', date: '2026-07-07', hours: 3.5, kind: 'work', approved: false, note: 'Deep clean' },
    { id: 't2b', employeeId: 'e2', jobId: 'j1', date: '2026-07-07', hours: 1, kind: 'travel', approved: false, note: 'Drive to site' },
    { id: 't3', employeeId: 'e3', jobId: 'j2', date: '2026-07-09', hours: 3, kind: 'work', approved: false, note: 'Fleet wash' },
    { id: 't4', employeeId: 'e4', jobId: 'j2', date: '2026-07-09', hours: 3, kind: 'work', approved: false, note: 'Fleet wash' },
    { id: 't5', employeeId: 'e3', jobId: 'j4', date: '2026-06-27', hours: 4, kind: 'work', approved: true, note: 'Van fleet' },
    { id: 't5b', employeeId: 'e3', jobId: 'j4', date: '2026-06-27', hours: 1.5, kind: 'travel', approved: true, note: 'Travel to depot' },
    { id: 't6', employeeId: 'e4', jobId: 'j4', date: '2026-06-27', hours: 4, kind: 'work', approved: true, note: 'Van fleet' },
    { id: 't7', employeeId: 'e5', date: '2026-07-06', hours: 6, kind: 'work', approved: true, note: 'Dispatch & scheduling' },
    { id: 't8', employeeId: 'e2', jobId: 'j1', date: '2026-07-08', hours: 4, kind: 'work', approved: false, note: 'Finish deep clean' },
    { id: 't9', employeeId: 'e5', date: '2026-07-07', hours: 6.5, kind: 'work', approved: false, note: 'Dispatch' },
    { id: 't10', employeeId: 'e3', date: '2026-07-10', hours: 5, kind: 'work', approved: false, note: 'Detailing prep' },
  ],
  visits: [
    { id: 'v5', jobId: 'j3', employeeId: 'e2', date: '2026-07-01', start: '10:00', end: '12:00' },
    { id: 'v1', jobId: 'j1', employeeId: 'e2', date: '2026-07-07', start: '09:00', end: '11:00' },
    { id: 'v2', jobId: 'j1', employeeId: 'e2', date: '2026-07-07', start: '13:30', end: '15:00' },
    { id: 'v6', jobId: 'j1', employeeId: 'e2', date: '2026-07-08', start: '09:30', end: '12:30' },
    { id: 'v3', jobId: 'j2', employeeId: 'e3', date: '2026-07-09', start: '11:00', end: '14:00' },
    { id: 'v4', jobId: 'j2', employeeId: 'e4', date: '2026-07-09', start: '11:00', end: '14:00' },
    { id: 'v7', jobId: 'j5', employeeId: 'e3', date: '2026-07-13', start: '09:00', end: '13:00' },
    { id: 'v8', jobId: 'j2', employeeId: 'e4', date: '2026-07-15', start: '08:30', end: '10:30' },
    { id: 'v9', jobId: 'j1', employeeId: 'e5', date: '2026-07-20', start: '14:00', end: '16:00' },
    { id: 'v10', jobId: 'j3', employeeId: 'e3', date: '2026-07-22', start: '11:00', end: '12:30' },
    { id: 'v11', jobId: 'j2', employeeId: 'e2', date: '2026-07-27', start: '09:00', end: '11:00' },
  ],
  notes: [
    { id: 'n1', entityType: 'client', entityId: 'c3', body: 'Fleet manager prefers early-morning visits before 9am.', authorId: 'e5', createdAt: '2026-07-05T09:12:00Z' },
    { id: 'n2', entityType: 'job', entityId: 'j1', body: 'Customer mentioned coffee stain on rear seat — bring extractor.', authorId: 'e2', createdAt: '2026-07-06T16:40:00Z' },
  ],
  ga1: [
    {
      id: 'g1', reportNumber: 'GA1-1042', clientId: 'c3', examinerId: 'e1', examinerCert: 'CP-4821',
      equipmentType: 'Telehandlers / Teleporters', manufacturer: 'JCB', model: '540-170', serialNumber: 'JCB540170X8842',
      swl: '4,000 kg', yearOfManufacture: '2021', equipmentDescription: 'Telehandler with pallet forks',
      examinationDate: '2026-07-02', previousExaminationDate: '2026-01-02', nextExaminationDate: '2027-07-02',
      examinationLocation: 'Point Village Depot, Dublin', safeToUse: true, defectsFound: false, overallResult: 'safe',
      defectsDescription: '', reinspectionDate: '', additionalNotes: 'Hydraulics and forks within tolerance.',
      signature: 'Ethan Whitney', purposeOfExamination: '12 Monthly Testing', particularsOfTests: 'Visual + functional load test at SWL.',
      createdAt: '2026-07-02T11:00:00Z',
    },
    {
      id: 'g2', reportNumber: 'GA1-1041', clientId: 'c5', examinerId: 'e1', examinerCert: 'CP-4821',
      equipmentType: 'Excavators', manufacturer: 'Caterpillar', model: '320', serialNumber: 'CAT0320ELMH00219',
      swl: '3,200 kg', yearOfManufacture: '2019', equipmentDescription: '20t excavator with lifting eye',
      examinationDate: '2026-06-20', previousExaminationDate: '2025-12-20', nextExaminationDate: '2026-12-20',
      examinationLocation: '9 East Wall Rd, Dublin', safeToUse: false, defectsFound: true, overallResult: 'repair_required',
      defectsDescription: 'Lifting eye shows minor deformation — replace before further lifting operations.',
      reinspectionDate: '2026-07-20', additionalNotes: '', signature: 'Ethan Whitney',
      purposeOfExamination: '12 Monthly Testing', particularsOfTests: 'Visual + NDT on lifting points.',
      createdAt: '2026-06-20T14:30:00Z',
    },
  ],
  attachments: [],
  products: [
    { id: 'p1', name: 'Steel Lifting Hook — 2t', sku: 'HK-2T', description: 'Grade 80 clevis hook, 2 tonne SWL', price: 45, stock: 24, active: true, createdAt: '2026-06-01' },
    { id: 'p2', name: 'Ratchet Load Strap 5m', sku: 'STRAP-5M', description: '5m ratchet lashing strap, 2000kg', price: 18, stock: 60, active: true, createdAt: '2026-06-01' },
    { id: 'p3', name: 'Shackle — 3.25t Bow', sku: 'SHK-325', description: 'Galvanised bow shackle, 3.25t', price: 12, stock: 8, active: true, createdAt: '2026-06-01' },
    { id: 'p4', name: 'Chain Sling 1-leg 3m', sku: 'CHN-1L-3M', description: 'Grade 80 single-leg chain sling', price: 120, stock: 5, active: true, createdAt: '2026-06-01' },
  ],
  orders: [
    {
      id: 'o1', number: 'ORD-1001', clientId: 'c5', status: 'Fulfilled', source: 'website',
      note: 'Website order', invoiceId: undefined, createdAt: '2026-07-05T10:15:00Z',
      items: [
        { id: 'oi1', productId: 'p2', name: 'Ratchet Load Strap 5m', qty: 4, unitPrice: 18 },
        { id: 'oi2', productId: 'p3', name: 'Shackle — 3.25t Bow', qty: 2, unitPrice: 12 },
      ],
    },
  ],
}

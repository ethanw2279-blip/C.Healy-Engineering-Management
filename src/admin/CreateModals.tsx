import ClientModal from './ClientModal'
import RequestModal from './RequestModal'
import QuoteModal from './QuoteModal'
import JobModal from './JobModal'
import InvoiceModal from './InvoiceModal'

export type CreateKind = 'client' | 'request' | 'quote' | 'job' | 'invoice'

export default function CreateModals({ kind, onClose }: { kind: CreateKind; onClose: () => void }) {
  switch (kind) {
    case 'client': return <ClientModal onClose={onClose} />
    case 'request': return <RequestModal onClose={onClose} />
    case 'quote': return <QuoteModal onClose={onClose} />
    case 'job': return <JobModal onClose={onClose} />
    case 'invoice': return <InvoiceModal onClose={onClose} />
  }
}

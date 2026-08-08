import { getEmployeeDocuments } from "@/actions/hr-documents"
import { getEmployeesForSelect } from "@/actions/employees"
import { DocumentsBoard } from "@/components/hr/documents-board"

export default async function HrDocumentsPage() {
  const [documents, employees] = await Promise.all([getEmployeeDocuments(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employee Documents</h1>
        <p className="text-sm text-muted-foreground">{documents.length} document{documents.length === 1 ? "" : "s"} on file.</p>
      </div>
      <DocumentsBoard documents={documents} employees={employees} />
    </div>
  )
}

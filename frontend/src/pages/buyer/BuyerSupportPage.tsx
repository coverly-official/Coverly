import React from "react";
import { MessageSquareText, Clock3, ArrowRight } from "lucide-react";

const supportTickets = [
  { id: "CS-1842", subject: "RFQ approval delay", status: "In review", updated: "2 hours ago" },
  { id: "CS-1809", subject: "Need warehouse MOQ clarification", status: "Resolved", updated: "Yesterday" },
];

export const BuyerSupportPage: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Support Requests</h1>
        <p className="text-xs text-stone-500 mt-1">Track help requests to your COVERLY support desk.</p>
      </div>
      <button className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white">New ticket</button>
    </div>

    <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-stone-200 p-4 text-[11px] font-semibold uppercase tracking-wider text-stone-700">
        <span>Ticket</span>
        <span>Subject</span>
        <span>Latest update</span>
      </div>
      {supportTickets.map((ticket) => (
        <div key={ticket.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b border-stone-100 last:border-b-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <MessageSquareText className="h-4 w-4 text-stone-500" />
            {ticket.id}
          </div>
          <div>
            <div className="text-sm font-medium text-stone-700">{ticket.subject}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">{ticket.status}</div>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-stone-600">
            <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-stone-400" />{ticket.updated}</span>
            <ArrowRight className="h-4 w-4 text-stone-400" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

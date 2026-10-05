import { HelpRequest } from "./models.js";
import { nextSequence } from "./db.js";

function toHelpRequestJSON(r) {
  return {
    id: String(r.requestNumber),
    orderType: r.orderType,
    tableNumber: r.tableNumber ?? null,
    status: r.status,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt ?? null
  };
}

export async function createHelpRequest({ orderType, tableNumber }) {
  const created = await HelpRequest.create({
    requestNumber: await nextSequence("helpRequestNumber"),
    orderType,
    tableNumber: tableNumber || null,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  return toHelpRequestJSON(created);
}

export async function listPendingHelpRequests() {
  const rows = await HelpRequest.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
  return rows.map(toHelpRequestJSON);
}

export async function resolveHelpRequest(id) {
  const row = await HelpRequest.findOneAndUpdate(
    { requestNumber: Number(id) },
    { status: "resolved", resolvedAt: new Date().toISOString() },
    { returnDocument: "after" }
  );
  return row ? toHelpRequestJSON(row) : null;
}

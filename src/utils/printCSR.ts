import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

type CsrQuoteItem = {
  item: string;
  description?: string;
  qty: number;
  total: number;
};

export const printCSR = async (jobId: string) => {
  try {
    const { data: jobOrder, error } = await supabase
      .from("job_orders")
      .select("*, customers(*)")
      .eq("job_order_no", jobId)
      .single();

    if (error) throw error;
    if (!jobOrder) {
      alert("Job order not found.");
      return;
    }

    const customer = Array.isArray(jobOrder.customers)
      ? jobOrder.customers[0]
      : jobOrder.customers;
    const completedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const normalizedStatus = String(jobOrder.status || "").toLowerCase();
    const resolutionText = String(
      jobOrder.resolution_notes || "",
    ).toLowerCase();
    const hasSpareParts =
      Array.isArray(jobOrder.quotation_items) &&
      jobOrder.quotation_items.length > 0;
    const isCleaning = /clean|cleaning/.test(resolutionText);
    const isCompleted = [
      "ready",
      "ready for pickup",
      "released",
      "completed",
      "complete",
    ].includes(normalizedStatus);
    const isForRepair =
      !!jobOrder.complaint_notes ||
      !!jobOrder.resolution_notes ||
      !!jobOrder.brand;
    const isOther =
      !isForRepair && !hasSpareParts && !isCleaning && !isCompleted;

    const renderCheckItem = (checked: boolean, label: string) => `
      <span class="check-item">
        <span class="check-box">${checked ? "&#10003;" : ""}</span>
        <span>${label}</span>
      </span>
    `;

    // Parse quotation items if they exist
    let itemsHtml = "";
    if (
      jobOrder.quotation_items &&
      Array.isArray(jobOrder.quotation_items) &&
      jobOrder.quotation_items.length > 0
    ) {
      itemsHtml = `
            <div class="section-title">Replaced Parts & Services</div>
            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobOrder.quotation_items
                      .map(
                        (item: CsrQuoteItem) => `
                        <tr>
                            <td><strong>${item.item}</strong><br><span style="font-size:10px; color:#555;">${item.description || ""}</span></td>
                            <td style="text-align: center;">${item.qty}</td>
                            <td style="text-align: right;">₱${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        `;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the CSR.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Customer Service Report - #${jobOrder.job_order_no}</title>
        <style>
          @page {
            size: letter;
            margin: 14mm;
          }

          * {
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }

          body {
            margin: 0;
            padding: 0;
            background: #eef2f7;
            color: #0f172a;
            display: flex;
            justify-content: center;
          }

          .page-container {
            width: 8.5in;
            min-height: 11in;
            background: #ffffff;
            padding: 16mm;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
          }

          @media print {
            body {
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page-container {
              box-shadow: none;
              width: 100%;
              min-height: auto;
              padding: 0;
            }
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            border-bottom: 2px solid #00afef;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }

          .company-logo {
            width: 280px;
            max-width: 100%;
            height: auto;
            display: block;
          }

          .doc-meta {
            text-align: right;
          }

          .doc-type {
            margin: 0;
            font-size: 19px;
            font-weight: 900;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #0f172a;
          }

          .doc-sub {
            margin-top: 5px;
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            line-height: 1.4;
          }

          .meta-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
          }

          .meta-chip {
            border: 1px solid #dbe6f3;
            border-radius: 8px;
            background: #f8fbff;
            padding: 8px 10px;
          }

          .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: #64748b;
            font-weight: 800;
            margin-bottom: 2px;
          }

          .meta-value {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }

          .section {
            margin-top: 12px;
          }

          .section-title {
            background: #00afef;
            color: #fff;
            padding: 6px 10px;
            border-radius: 6px 6px 0 0;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.9px;
          }

          .box {
            border: 1px solid #dbe6f3;
            border-top: none;
            border-radius: 0 0 8px 8px;
            background: #fff;
            padding: 10px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .info-row {
            display: flex;
            gap: 6px;
            font-size: 12px;
            margin-bottom: 5px;
          }

          .info-label {
            min-width: 84px;
            color: #64748b;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }

          .info-value {
            color: #0f172a;
            font-weight: 700;
          }

          .text-box {
            border: 1px solid #dbe6f3;
            border-radius: 8px;
            background: #fff;
            padding: 11px;
            min-height: 72px;
            font-size: 12px;
            line-height: 1.5;
            color: #1e293b;
            white-space: pre-wrap;
          }

          .evaluation-wrap {
            margin-top: 10px;
            border: 1px solid #dbe6f3;
            border-radius: 8px;
            background: #f8fbff;
            padding: 10px;
          }

          .evaluation-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            color: #64748b;
            font-weight: 800;
            margin-bottom: 8px;
          }

          .evaluation-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 8px;
          }

          .check-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
          }

          .check-box {
            width: 14px;
            height: 14px;
            border: 1.5px solid #334155;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
          }

          .resolution {
            border-left: 4px solid #10b981;
            background: #f0fdf4;
          }

          @media (max-width: 820px) {
            .evaluation-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0;
          }

          th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #475569;
            background: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 9px 10px;
          }

          td {
            font-size: 12px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding: 9px 10px;
            vertical-align: top;
          }

          .amount-cell {
            text-align: right;
            font-weight: 800;
            white-space: nowrap;
          }

          .signature-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-top: 22px;
          }

          .signature-card {
            border: 1px solid #dbe6f3;
            border-radius: 10px;
            background: #fff;
            padding: 12px;
            text-align: center;
          }

          .signature-space {
            height: 42px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 8px;
          }

          .signature-name {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
          }

          .signature-role {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-top: 3px;
          }

          .footer {
            margin-top: 18px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 10px;
            color: #64748b;
            line-height: 1.45;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="header">
            <img src="${logo}" alt="Central Juan Logo" class="company-logo" />
            <div class="doc-meta">
              <h1 class="doc-type">Customer Service Report</h1>
              <div class="doc-sub">
                Ticket No: <strong>#${jobOrder.job_order_no}</strong><br />
                Date Issued: <strong>${completedDate}</strong>
              </div>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-chip">
              <div class="meta-label">Service Technician</div>
              <div class="meta-value">${jobOrder.assigned_tech || "Unassigned"}</div>
            </div>
            <div class="meta-chip">
              <div class="meta-label">Device Status</div>
              <div class="meta-value">${jobOrder.status || "N/A"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer and Device Information</div>
            <div class="box">
              <div class="info-grid">
                <div>
                  <div class="info-row"><span class="info-label">Name</span><span class="info-value">${customer?.full_name || "N/A"}</span></div>
                  <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${customer?.phone_number || "N/A"}</span></div>
                  <div class="info-row"><span class="info-label">Email</span><span class="info-value">${customer?.email || "N/A"}</span></div>
                </div>
                <div>
                  <div class="info-row"><span class="info-label">Device Type</span><span class="info-value">${jobOrder.device_type || "N/A"}</span></div>
                  <div class="info-row"><span class="info-label">Model</span><span class="info-value">${jobOrder.brand} ${jobOrder.model}</span></div>
                  <div class="info-row"><span class="info-label">Serial No</span><span class="info-value">${jobOrder.serial_number || "N/A"}</span></div>
                </div>
              </div>

              <div class="evaluation-wrap">
                <div class="evaluation-label">Evaluation</div>
                <div class="evaluation-grid">
                  ${renderCheckItem(isForRepair, "For Repair")}
                  ${renderCheckItem(hasSpareParts, "Spareparts Needed")}
                  ${renderCheckItem(isCleaning, "For Cleaning")}
                  ${renderCheckItem(isCompleted, "Completed")}
                  ${renderCheckItem(isOther, "Other")}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Reported Issue</div>
            <div class="text-box">${jobOrder.complaint_notes || "No notes provided."}</div>
          </div>

          <div class="section">
            <div class="section-title">Resolution and Action Taken</div>
            <div class="text-box">${jobOrder.resolution_notes ? jobOrder.resolution_notes.replace(/\\n/g, "<br>") : "No resolution notes documented by technician."}</div>
          </div>

          ${itemsHtml}

          <div class="signature-wrap">
            <div class="signature-card">
              <div class="signature-space"></div>
              <div class="signature-name">${jobOrder.assigned_tech || "Technician"}</div>
              <div class="signature-role">Authorized Technician</div>
            </div>
            <div class="signature-card">
              <div class="signature-space"></div>
              <div class="signature-name">${customer?.full_name || "Customer Name"}</div>
              <div class="signature-role">Customer Acceptance Signature</div>
            </div>
          </div>

          <div class="footer">
            This report certifies that the service detailed above has been completed and reviewed.<br />
            All hardware products are covered by the manufacturer's warranty period. Software services carry no warranty.<br />
            © ${new Date().getFullYear()} Central Juan I.T. Solutions. All Rights Reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } catch (error) {
    console.error("Error generating CSR:", error);
    alert("Failed to generate Customer Service Report.");
  }
};

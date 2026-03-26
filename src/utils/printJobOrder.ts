import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

export const printJobOrder = async (jobId: string) => {
  try {
    // 1. Fetch the complete job order and customer details from Supabase
    const { data, error } = await supabase
      .from("job_orders")
      .select("*, customers(*)")
      .eq("job_order_no", parseInt(jobId))
      .single();

    if (error || !data) throw error;

    // Format the date
    const dateStr = new Date(data.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // 2. Open a temporary print window
    const printWindow = window.open("", "_blank", "width=800,height=800");
    if (!printWindow) {
      alert("Please allow popups to print job orders.");
      return;
    }

    // 3. Inject the HTML with the real data
    // NOTE: CSS is updated to 'letter' (Short Bond Paper / 8.5 x 11 inches)
    const html = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Job Order #${data.job_order_no}</title>
          <style>
            /* Base Page Setup for SHORT BOND PAPER (Letter Size) */
            @page {
              size: letter; 
              margin: 15mm;
            }

            * {
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }

            body {
              margin: 0;
              padding: 0;
              background-color: #f0f0f0;
              display: flex;
              justify-content: center;
            }

            /* Container designed to look like Short Bond paper on screen */
            .page-container {
              width: 8.5in;
              min-height: 11in;
              background: white;
              padding: 20mm;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }

            /* Print optimizations */
            @media print {
              body { background-color: white; }
              .page-container {
                box-shadow: none;
                width: 100%;
                min-height: auto;
                padding: 0;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }

            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .logo-section { width: 350px; }
            .logo-image { width: 100%; max-width: 350px; height: auto; display: block; }
            .job-number { color: #d35400; font-size: 12px; font-weight: bold; letter-spacing: 0.5px; margin: 0; font-family: "Courier New", Courier, monospace; text-align: right;}
            .contact-info { display: flex; flex-direction: column; justify-content: center; font-size: 11px; line-height: 1.5; color: #222; }
            .contact-row { display: flex; align-items: flex-start; margin-bottom: 3px; }
            .contact-icon { width: 14px; height: 14px; margin-right: 6px; fill: #444; flex-shrink: 0; margin-top: 1px; }
            
            .section-header { background-color: #00afef; color: white; text-align: center; font-weight: bold; padding: 6px; font-size: 16px; letter-spacing: 1px; }
            .form-box { border: 2px solid #222; margin-bottom: 15px; }
            .form-row { display: flex; border-bottom: 1px solid #222; }
            .form-row:last-child { border-bottom: none; }
            .form-field { padding: 6px 8px; border-right: 1px solid #222; font-size: 13px; font-weight: bold; min-height: 30px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
            .form-field:last-child { border-right: none; }
            .field-value { font-weight: normal; margin-left: 5px; color: #333; }
            
            .blank-line { height: 32px; border-bottom: 1px solid #222; padding: 6px 8px; font-size: 12px; }
            .blank-line:last-child { border-bottom: none; }
            
            .signatures { display: flex; border: 2px solid #222; margin-bottom: 15px; }
            .sig-col { flex: 1; border-right: 1px solid #222; display: flex; flex-direction: column; }
            .sig-col:last-child { border-right: none; }
            .sig-header { background-color: #00afef; color: white; text-align: center; padding: 5px; font-size: 13px; font-weight: bold; }
            .sig-space { height: 50px; }
            .sig-label { border-top: 1px solid #222; text-align: center; padding: 6px; font-size: 13px; font-weight: bold; }
            
            .terms { display: flex; font-size: 10px; line-height: 1.4; margin-top: 10px; }
            .terms-col { flex: 1; padding-right: 20px; }
            .terms h4 { margin: 0 0 5px 0; font-size: 10px; }
            .terms ul { margin: 0; padding-left: 20px; }
            .terms li { margin-bottom: 3px; }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header">
              <div class="logo-section">
                <img src="${logo}" alt="Central Juan Logo" class="logo-image" />
              </div>

              <div class="contact-info">
                <div class="job-number">JO# ${data.job_order_no}</div>
                <div style="text-align: right; font-size: 12px; font-weight: bold; margin-bottom: 15px;">
                  TRACKING ID: <span style="color: #d35400;">${data.tracking_id || "N/A"}</span>
                </div>
                <div class="contact-row">
                  <svg class="contact-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  <div>190 C.M. Recto Avenue<br />Highway Barangay Lapasan<br />Ground Floor, Unit 2, Celinda Bldg., CDO<br />Misamis Oriental, 9000</div>
                </div>
                <div class="contact-row">
                  <svg class="contact-icon" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  <div>centraljuan.net@gmail.com</div>
                </div>
                <div class="contact-row">
                  <svg class="contact-icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  <div>0956-179-3754</div>
                </div>
              </div>
            </div>

            <div class="form-box">
              <div class="section-header">JOB ORDER</div>
              <div class="form-row">
                <div class="form-field" style="flex: 7">JOB ORDER NO.: <span class="field-value">${data.job_order_no}</span></div>
                <div class="form-field" style="flex: 3">DATE: <span class="field-value">${dateStr}</span></div>
              </div>
              <div class="form-row">
                <div class="form-field" style="flex: 5">CUSTOMER NAME: <span class="field-value">${data.customers.full_name}</span></div>
                <div class="form-field" style="flex: 2">TEL.: <span class="field-value">${data.customers.phone_number}</span></div>
                <div class="form-field" style="flex: 3">EMAIL : <span class="field-value">${data.customers.email || "N/A"}</span></div>
              </div>
              <div class="form-row">
                <div class="form-field" style="flex: 1">ADDRESS: <span class="field-value">${data.customers.address}</span></div>
              </div>
            </div>

            <div class="form-box">
              <div class="section-header">EQUIPMENT DETAILS</div>
              <div class="form-row">
                <div class="form-field" style="flex: 3">BRAND: <span class="field-value">${data.brand}</span></div>
                <div class="form-field" style="flex: 3">MODEL: <span class="field-value">${data.model}</span></div>
                <div class="form-field" style="flex: 4">SERIAL NO.: <span class="field-value">${data.serial_number}</span></div>
              </div>
              <div class="form-field" style="border-right: none; border-bottom: 1px solid #222">
                VISUAL CHECKS <span style="font-weight: normal; font-size: 11px">(PLEASE INDICATE NOTABLE MARKS/DEFECTS, ETC.)</span>
              </div>
              <div class="blank-line">${data.visual_checks || ""}</div>
              <div class="blank-line"></div>
              <div class="blank-line"></div>
            </div>

            <div class="form-box">
              <div class="form-field" style="border-right: none; border-bottom: 1px solid #222">
                NATURE OF COMPLAINT
              </div>
              <div class="blank-line">${data.complaint_notes || ""}</div>
              <div class="blank-line"></div>
              <div class="blank-line"></div>
            </div>

            <div class="signatures">
              <div class="sig-col">
                <div class="sig-header">RECEIVED BY</div>
                <div class="sig-space"></div>
                <div class="sig-label">NAME / SIGNATURE</div>
              </div>
              <div class="sig-col">
                <div class="sig-header">ASSIGNED TECHNICIAN</div>
                <div class="sig-space" style="display:flex; justify-content:center; align-items:center; font-size: 14px;">
                  ${data.assigned_tech && data.assigned_tech !== "Unassigned" ? data.assigned_tech : ""}
                </div>
                <div class="sig-label">NAME / SIGNATURE</div>
              </div>
              <div class="sig-col">
                <div class="sig-header">CUSTOMER'S DETAILS</div>
                <div class="sig-space"></div>
                <div class="sig-label">NAME / SIGNATURE</div>
              </div>
            </div>

            <div class="terms">
              <div class="terms-col">
                <h4>TERMS AND CONDITIONS:</h4>
                <ul>
                  <li>A minimum fee of 150.00 Pesos for the inspection and diagnostic checks.</li>
                  <li>Customer is responsible for data backup before repair.</li>
                  <li>Central Juan is not responsible for the data loss for any reason.</li>
                </ul>
              </div>
              <div class="terms-col" style="padding-top: 15px">
                <ul>
                  <li>All parts replaced are subject to 3 months warranty.</li>
                  <li>There will be a 30 days warranty of labor in relation to the original complaint.</li>
                  <li>Unable to claim the item within 90days after advised to claim regardless of the state of the repair, Central Juan has the right to dispose the unit.</li>
                </ul>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Give the browser a split second to render the HTML before calling print
    setTimeout(() => {
      printWindow.print();
      // Optional: Close the window automatically after printing
      // printWindow.close();
    }, 300);
  } catch (error) {
    console.error("Error generating print file:", error);
    alert("Failed to generate the printable job order.");
  }
};

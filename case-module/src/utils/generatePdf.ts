import puppeteer from "puppeteer";
import handlebars from "handlebars";

function formatSummary(summary: string): string {
  if (!summary) return "";

  let html = summary;

  // Convert **bold**
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  const lines = html.split("\n");

  let result = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("* ") || trimmed.startsWith("+ ")) {
      if (!inList) {
        result += "<ul>";
        inList = true;
      }

      result += `<li>${trimmed.substring(2)}</li>`;
    } else {
      if (inList) {
        result += "</ul>";
        inList = false;
      }

      if (trimmed) {
        result += `<p>${trimmed}</p>`;
      }
    }
  }

  if (inList) result += "</ul>";

  return result;
}

export async function generatePdfBuffer(data: any): Promise<Record<string, string>[]> {

const template = `
    <html>
    <head>

    <style>

    body{
      font-family: Arial, Helvetica, sans-serif;
      margin:0;
      padding:0;
      color:#222;
      line-height:1.6;
    }

    /* HEADER BAR */

    .header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:20px 40px;
      border-bottom:3px solid #2aa7a1;
    }

    .logo{
      width:170px;
    }

    .header-right{
      text-align:right;
    }

    .title{
      font-size:36px;
      font-weight:bold;
      margin-bottom:8px;
    }

    .project-info{
      font-size:16px;
    }

    /* BODY */

    .container{
      padding:40px;
    }

    /* SECTION */

    .section{
      margin-top:40px;
    }

    .section h2{
      font-size:28px;
      margin-bottom:15px;
      border-left:6px solid #2aa7a1;
      padding-left:10px;
    }

    /* LIST */

    ul{
      margin-left:20px;
    }

    li{
      margin-bottom:8px;
    }

    /* PAGE FOOTER */

    .footer{
      position:fixed;
      bottom:10px;
      left:0;
      right:0;
      text-align:center;
      font-size:12px;
      color:#777;
    }

    </style>

    </head>

    <body>

    <div class="header">

      <img class="logo" src="{{logoUrl}}" />

      <div class="header-right">
        <div class="title">Project Summary</div>

        <div class="project-info">
          <div><b>Project Code:</b> {{project_code}}</div>
          <div><b>Project Name:</b> {{project_name}}</div>
        </div>
      </div>

    </div>


    <div class="container">

    {{#each sections}}

    <div class="section">
      <h2>{{title}}</h2>
      {{{summary}}}
    </div>

    {{/each}}

    </div>


    <div class="footer">
      Generated Technical Report
    </div>

    </body>
    </html>
  `;

  const compiled = handlebars.compile(template);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const results: Record<string, string>[] = [];

  for (const item of data) {

    let sections: any[] = [];

    try {
      const parsed = JSON.parse(item.technical_summary);

      sections = parsed.map((section: any) => ({
        ...section,
        summary: formatSummary(section.summary)
      }));

    } catch (err) {
      console.error("Invalid JSON in technical_summary:", err);
      continue;
    }

    const html = compiled({
    logoUrl: process.env.LOGO_URL,
    project_code: item.project_code,
    project_name: item.project_name,
    sections
  });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px",
        bottom: "40px",
        left: "40px",
        right: "40px"
      }
    });

    const base64Pdf = Buffer.from(pdfBuffer).toString("base64");

    results.push({
      projectCode : item.project_code,
      base64 : base64Pdf
    });

    await page.close();
  }

  await browser.close();

  return results;
}
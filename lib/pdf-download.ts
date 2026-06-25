// Client-side PDF generation — no print dialog, no new window.
// Renders report markdown into a hidden off-screen DOM node, captures it with
// html2canvas, then exports multi-page A4 PDF via jsPDF and auto-downloads it.

function escHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function markdownToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => {
      const t = line.trim()
      if (!t)          return '<div style="height:10px"></div>'
      if (t === '---') return '<hr style="border:0;border-top:1px solid #e2e8f0;margin:18px 0">'
      if (t.startsWith('### ')) return `<h3 style="font-size:15px;font-weight:700;color:#0f172a;margin:18px 0 6px 0;padding:0">${escHtml(t.slice(4))}</h3>`
      if (t.startsWith('## '))  return `<h2 style="font-size:17px;font-weight:800;color:#0f172a;margin:22px 0 8px 0;padding:0">${escHtml(t.slice(3))}</h2>`
      if (t.startsWith('# '))   return `<h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:26px 0 10px 0;padding:0">${escHtml(t.slice(2))}</h1>`
      return `<p style="font-size:13.5px;line-height:1.75;color:#334155;margin:3px 0;padding:0">${escHtml(t)}</p>`
    })
    .join('')
}

export async function downloadReportAsPDF(
  reportTitle: string,
  reportText:  string,
) {
  // Lazy-import so the heavy libs don't bloat the initial bundle
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  // Build an off-screen container styled like the printed report
  const container = document.createElement('div')
  Object.assign(container.style, {
    position:   'fixed',
    left:       '-9999px',
    top:        '0',
    zIndex:     '-1',
    width:      '794px',       // A4 at 96 dpi
    padding:    '64px 56px',
    background: '#ffffff',
    color:      '#334155',
    fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    direction:  'rtl',
    textAlign:  'right',
    boxSizing:  'border-box',
  } as CSSStyleDeclaration)

  container.innerHTML = `
    <div style="text-align:center;border-bottom:1px solid #e2e8f0;padding-bottom:24px;margin-bottom:32px">
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 8px 0;padding:0">
        דוח גרפולוגי
      </h1>
      <p style="font-size:12px;color:#94a3b8;margin:0;padding:0">${escHtml(reportTitle)}</p>
      <p style="font-size:11px;color:#94a3b8;margin:6px 0 0 0;padding:0">
        הדוח הינו בגדר המלצה בלבד. התוצאות מדויקות יותר עבור כותבים ביד ימין.
      </p>
    </div>
    ${markdownToHtml(reportText)}
  `

  document.body.appendChild(container)

  const canvas = await html2canvas(container, {
    scale:           2,
    useCORS:         true,
    backgroundColor: '#ffffff',
    logging:         false,
  })

  document.body.removeChild(container)

  const imgData    = canvas.toDataURL('image/png')
  const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW      = pdf.internal.pageSize.getWidth()
  const pageH      = pdf.internal.pageSize.getHeight()
  const imgH       = (canvas.height * pageW) / canvas.width

  let remaining = imgH
  let yOffset   = 0

  while (remaining > 0) {
    pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH)
    remaining -= pageH
    if (remaining > 0) {
      yOffset += pageH
      pdf.addPage()
    }
  }

  // Sanitise filename
  const filename = reportTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80) || 'report'
  pdf.save(`${filename}.pdf`)
}

import ExcelJS from 'exceljs'
import type { Activity } from '@/types/activity'
import {
  activityTotals,
  humanResourceLineTotal,
  materialLineTotal,
} from '@/utils/calculations'
import {
  formatBudgetTitleRange,
  formatDateCL,
  parseISODate,
} from '@/utils/date'
import {
  FOOTER_COLEGIO_BAUTISTA_BASE64,
  LOGO_COLEGIO_BAUTISTA_BASE64,
} from '@/assets/brandAssets'

const CLP_FORMAT = '"$"#,##0'
const DATE_FORMAT = 'dd-mm-yyyy'
const INTEGER_FORMAT = '0'
const FONT_NAME = 'Calibri'

// Column widths matching the official Colegio Bautista template
// Col 1 = A (margin), 2 = B (CANTIDAD), 3 = C (MATERIALES/RRHH), 4 = D (CARACTERISTICAS/FUNCION),
// 5 = E (VALOR UNITARIO), 6 = F (VALOR TOTAL/INICIO), 7 = G (TERMINO), 8 = H (HORA INI), 9 = I (HORA TER)
const COLUMN_WIDTHS = [3, 9.5, 20, 22, 11, 24, 11, 9, 9]

const ARGB = {
  white: 'FFFFFFFF',
  black: 'FF000000',
  titleBlue: 'FF1F497D',   // Official dark navy blue from PDF title
  headerBlue: 'FFBDD7EE',  // Official soft blue from PDF Table 1 header
  headerGray: 'FFA6A6A6',  // Official gray from PDF Table 2 header
  border: 'FF000000',      // Thin black borders from PDF tables
  slate900: 'FF0F172A',
  slate700: 'FF334155',
  slate500: 'FF64748B',
  slate50: 'FFF8FAFC',
  brand900: 'FF1E3A8A',
  brand700: 'FF1D4ED8',
  brand100: 'FFDBEAFE',
  brand50: 'FFEFF6FF',
  emerald50: 'FFECFDF5',
  emerald700: 'FF047857',
  amber50: 'FFFFFBEB',
  amber700: 'FFB45309',
} as const

interface CellOptions {
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  italic?: boolean
  underline?: boolean
  wrap?: boolean
  numFmt?: string
  color?: string
  size?: number
  fill?: string
  border?: Partial<ExcelJS.Borders>
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge: Partial<ExcelJS.Border> = {
    style: 'thin',
    color: { argb: ARGB.border },
  }

  return { top: edge, left: edge, bottom: edge, right: edge }
}

function setFill(cell: ExcelJS.Cell, argb: string): void {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  }
}

function applyBorder(
  ws: ExcelJS.Worksheet,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  border: Partial<ExcelJS.Borders>,
): void {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      ws.getCell(row, col).border = border
    }
  }
}

function setDataCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: ExcelJS.CellValue,
  options: CellOptions = {},
): ExcelJS.Cell {
  const cell = ws.getCell(row, col)
  cell.value = value
  cell.font = {
    name: FONT_NAME,
    size: options.size ?? 10,
    bold: options.bold,
    italic: options.italic,
    underline: options.underline,
    color: { argb: options.color ?? ARGB.black },
  }
  cell.alignment = {
    horizontal: options.align ?? 'left',
    vertical: 'middle',
    wrapText: options.wrap ?? false,
  }
  if (options.numFmt) cell.numFmt = options.numFmt
  if (options.fill) setFill(cell, options.fill)
  if (options.border) cell.border = options.border
  return cell
}

function setFormulaCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  formula: string,
  result: number,
  options: CellOptions = {},
): ExcelJS.Cell {
  const cell = setDataCell(ws, row, col, null, options)
  cell.value = { formula, result }
  return cell
}

function setDateCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: string,
  options: CellOptions = {},
): ExcelJS.Cell {
  const date = parseISODate(value)
  return setDataCell(ws, row, col, date ?? (value || ''), {
    ...options,
    numFmt: date ? DATE_FORMAT : undefined,
  })
}

function estimateHeight(
  text: string,
  charsPerLine: number,
  min: number,
  max: number,
): number {
  const lines = Math.max(1, Math.ceil((text.length || 1) / charsPerLine))
  return Math.min(max, Math.max(min, lines * 14))
}

function sanitizeSheetName(input: string): string {
  const cleaned = input
    .replace(/[\\/:*?[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return (cleaned || 'Actividad').slice(0, 31)
}

function uniqueSheetName(workbook: ExcelJS.Workbook, desired: string): string {
  const base = sanitizeSheetName(desired)
  let name = base
  let counter = 2

  while (workbook.getWorksheet(name)) {
    const suffix = ` (${counter})`
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`
    counter += 1
  }

  return name
}

export function buildDocumentTitle(activity: Activity): string {
  const rawTitle = (activity.titulo || activity.taller || 'FESTIVAL ACLE 2025').trim()
  const upper = rawTitle.toUpperCase()
  const titlePart = upper.startsWith('PRESUPUESTO') ? upper : `PRESUPUESTO ${upper}`
  const range = formatBudgetTitleRange(activity.fechaInicio, activity.fechaTermino)
  if (range) {
    return `${titlePart} .- ${range}`
  }
  return titlePart
}

export function createWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Colegio Bautista Temuco'
  workbook.lastModifiedBy = 'ACLE Gestión'
  workbook.created = new Date()
  workbook.modified = new Date()
  return workbook
}

export function buildActivitySheet(
  workbook: ExcelJS.Workbook,
  activity: Activity,
  options: { sheetName?: string } = {},
): ExcelJS.Worksheet {
  const sheetName = uniqueSheetName(
    workbook,
    options.sheetName ?? 'PRESUPUESTO ACLE',
  )

  const ws = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 16 },
    views: [{ showGridLines: false, zoomScale: 85 }],
    pageSetup: {
      paperSize: 5, // Legal / US Letter compatible in ExcelJS
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      horizontalCentered: true,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.2,
        footer: 0.2,
      },
    },
  })

  ws.columns = COLUMN_WIDTHS.map((width) => ({ width }))

  // Row 1: Top spacing
  ws.getRow(1).height = 10

  // Rows 2-4: Header (Logo on left, Title on right)
  ws.getRow(2).height = 10
  ws.getRow(3).height = 26
  ws.getRow(4).height = 10

  // 1. Add official logo if available
  if (LOGO_COLEGIO_BAUTISTA_BASE64) {
    try {
      const logoId = workbook.addImage({
        base64: LOGO_COLEGIO_BAUTISTA_BASE64,
        extension: 'png',
      })
      ws.addImage(logoId, {
        tl: { col: 1.05, row: 1.1 },
        ext: { width: 155, height: 38 },
      })
    } catch {
      // Graceful fallback if image decoding is unsupported in environment
    }
  }

  // 2. Document Title (Row 3, Col E to I)
  ws.mergeCells(3, 4, 3, 9)
  const titleCell = ws.getCell(3, 4)
  titleCell.value = buildDocumentTitle(activity)
  titleCell.font = {
    name: FONT_NAME,
    size: 11,
    bold: true,
    italic: true,
    underline: true,
    color: { argb: ARGB.titleBlue },
  }
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  }

  // Row 5: Gap
  ws.getRow(5).height = 8

  // -------------------------------------------------------------
  // TABLA 1: INFORMACIÓN GENERAL
  // -------------------------------------------------------------
  const t1HeaderRow = 6
  ws.getRow(t1HeaderRow).height = 26
  ws.mergeCells(t1HeaderRow, 2, t1HeaderRow, 3)
  ws.mergeCells(t1HeaderRow, 4, t1HeaderRow, 5)

  setDataCell(ws, t1HeaderRow, 2, 'NOMBRE COMPLETO', {
    bold: true,
    size: 9.5,
    align: 'center',
    fill: ARGB.headerBlue,
  })
  setDataCell(ws, t1HeaderRow, 4, 'TALLER O DISCIPLINA', {
    bold: true,
    size: 9.5,
    align: 'center',
    fill: ARGB.headerBlue,
  })
  setDataCell(ws, t1HeaderRow, 6, 'FECHA DE INICIO', {
    bold: true,
    size: 9.5,
    align: 'center',
    fill: ARGB.headerBlue,
  })
  setDataCell(ws, t1HeaderRow, 7, 'FECHA DE\nTÉRMINO', {
    bold: true,
    size: 9.5,
    align: 'center',
    wrap: true,
    fill: ARGB.headerBlue,
  })
  setDataCell(ws, t1HeaderRow, 8, 'HORA INI', {
    bold: true,
    size: 9.5,
    align: 'center',
    fill: ARGB.headerBlue,
  })
  setDataCell(ws, t1HeaderRow, 9, 'HORA TER.', {
    bold: true,
    size: 9.5,
    align: 'center',
    fill: ARGB.headerBlue,
  })
  applyBorder(ws, t1HeaderRow, 2, t1HeaderRow, 9, thinBorder())

  // Data row 1
  const t1DataRow1 = 7
  ws.getRow(t1DataRow1).height = 20
  ws.mergeCells(t1DataRow1, 2, t1DataRow1, 3)
  ws.mergeCells(t1DataRow1, 4, t1DataRow1, 5)
  setDataCell(ws, t1DataRow1, 2, activity.responsable || '', { align: 'left', wrap: true, size: 9.5 })
  setDataCell(ws, t1DataRow1, 4, activity.taller || '', { align: 'left', wrap: true, size: 9.5 })
  setDateCell(ws, t1DataRow1, 6, activity.fechaInicio, { align: 'center', size: 9.5 })
  setDateCell(ws, t1DataRow1, 7, activity.fechaTermino, { align: 'center', size: 9.5 })
  setDataCell(ws, t1DataRow1, 8, activity.horaInicio || '', { align: 'center', size: 9.5 })
  setDataCell(ws, t1DataRow1, 9, activity.horaTermino || '', { align: 'center', size: 9.5 })
  applyBorder(ws, t1DataRow1, 2, t1DataRow1, 9, thinBorder())

  // Data row 2 (standard official second row)
  const t1DataRow2 = 8
  ws.getRow(t1DataRow2).height = 18
  ws.mergeCells(t1DataRow2, 2, t1DataRow2, 3)
  ws.mergeCells(t1DataRow2, 4, t1DataRow2, 5)
  applyBorder(ws, t1DataRow2, 2, t1DataRow2, 9, thinBorder())

  // Row 9: Gap
  ws.getRow(9).height = 8

  // -------------------------------------------------------------
  // TABLA 2: DESCRIPCIÓN DE LA PROPUESTA
  // -------------------------------------------------------------
  const t2HeaderRow = 10
  ws.getRow(t2HeaderRow).height = 18
  ws.mergeCells(t2HeaderRow, 2, t2HeaderRow, 9)
  const descTitleCell = ws.getCell(t2HeaderRow, 2)
  descTitleCell.value = 'DESCRIPCIÓN DE LA PROPUESTA'
  descTitleCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: ARGB.black } }
  descTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  setFill(descTitleCell, ARGB.headerGray)
  applyBorder(ws, t2HeaderRow, 2, t2HeaderRow, 9, thinBorder())

  const t2ContentStart = 11
  const t2ContentEnd = 16
  ws.mergeCells(t2ContentStart, 2, t2ContentEnd, 9)
  const descCell = ws.getCell(t2ContentStart, 2)
  descCell.value = activity.descripcion || ''
  descCell.font = { name: FONT_NAME, size: 9.5, color: { argb: ARGB.black } }
  descCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
  applyBorder(ws, t2ContentStart, 2, t2ContentEnd, 9, thinBorder())
  for (let r = t2ContentStart; r <= t2ContentEnd; r += 1) {
    ws.getRow(r).height = 16
  }

  // Row 17: Gap
  ws.getRow(17).height = 8

  // -------------------------------------------------------------
  // TABLA 3: PRESUPUESTO MATERIALES
  // -------------------------------------------------------------
  let currentRow = 18
  ws.getRow(currentRow).height = 20
  ws.mergeCells(currentRow, 2, currentRow, 9)
  setDataCell(ws, currentRow, 2, 'PRESUPUESTO MATERIALES', {
    bold: true,
    size: 10,
    align: 'center',
  })
  applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
  currentRow += 1

  // Material headers
  ws.getRow(currentRow).height = 26
  ws.mergeCells(currentRow, 7, currentRow, 9)
  setDataCell(ws, currentRow, 2, 'CANTIDAD', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 3, 'MATERIALES', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 4, 'CARACTERISTICAS TECNICA', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 5, 'VALOR\nUNITARIO', { bold: true, size: 9, align: 'center', wrap: true })
  setDataCell(ws, currentRow, 6, 'VALOR TOTAL', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 7, 'FECHA DEL REQUERIMIENTO.', { bold: true, size: 9, align: 'center' })
  applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
  currentRow += 1

  // Material rows
  const materialItemCount = activity.materiales.length
  const materialDisplayRows = Math.max(3, materialItemCount)

  for (let i = 0; i < materialDisplayRows; i += 1) {
    const item = activity.materiales[i]
    ws.mergeCells(currentRow, 7, currentRow, 9)

    if (item) {
      setDataCell(ws, currentRow, 2, item.cantidad, {
        align: 'center',
        numFmt: INTEGER_FORMAT,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 3, item.materiales || '', {
        align: 'left',
        wrap: true,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 4, item.caracteristicas || '', {
        align: 'left',
        wrap: true,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 5, item.valorUnitario, {
        align: 'right',
        numFmt: CLP_FORMAT,
        size: 9.5,
      })
      setFormulaCell(
        ws,
        currentRow,
        6,
        `B${currentRow}*E${currentRow}`,
        materialLineTotal(item),
        { align: 'right', numFmt: CLP_FORMAT, size: 9.5 },
      )
      setDateCell(ws, currentRow, 7, item.fechaRequerimiento, {
        align: 'center',
        size: 9.5,
      })
      ws.getRow(currentRow).height = Math.max(
        22,
        estimateHeight(item.materiales, 24, 22, 54),
        estimateHeight(item.caracteristicas, 26, 22, 54),
      )
    } else {
      // Empty row to match official form grid
      applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
      ws.getRow(currentRow).height = 20
    }

    applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
    currentRow += 1
  }

  // Gap
  ws.getRow(currentRow).height = 8
  currentRow += 1

  // -------------------------------------------------------------
  // TABLA 4: PRESUPUESTO RECURSO HUMANO
  // -------------------------------------------------------------
  ws.getRow(currentRow).height = 20
  ws.mergeCells(currentRow, 2, currentRow, 9)
  setDataCell(ws, currentRow, 2, 'PRESUPUESTO RECURSO HUMANO', {
    bold: true,
    size: 10,
    align: 'center',
  })
  applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
  currentRow += 1

  // RRHH headers
  ws.getRow(currentRow).height = 24
  ws.mergeCells(currentRow, 4, currentRow, 5)
  ws.mergeCells(currentRow, 7, currentRow, 9)
  setDataCell(ws, currentRow, 2, 'CANTIDAD', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 3, 'RECURSO HUMANO', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 4, 'FUNCIÓN', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 6, 'VALOR POR EL EVENTO', { bold: true, size: 9, align: 'center' })
  setDataCell(ws, currentRow, 7, 'FECHA DEL REQUERIMIENTO', { bold: true, size: 9, align: 'center' })
  applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
  currentRow += 1

  // RRHH rows
  const humanItemCount = activity.recursosHumanos.length
  const humanDisplayRows = Math.max(3, humanItemCount)

  for (let i = 0; i < humanDisplayRows; i += 1) {
    const item = activity.recursosHumanos[i]
    ws.mergeCells(currentRow, 4, currentRow, 5)
    ws.mergeCells(currentRow, 7, currentRow, 9)

    if (item) {
      setDataCell(ws, currentRow, 2, item.cantidad, {
        align: 'center',
        numFmt: INTEGER_FORMAT,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 3, item.recursoHumano || '', {
        align: 'left',
        wrap: true,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 4, item.funcion || '', {
        align: 'left',
        wrap: true,
        size: 9.5,
      })
      setDataCell(ws, currentRow, 6, humanResourceLineTotal(item), {
        align: 'right',
        numFmt: CLP_FORMAT,
        size: 9.5,
      })
      setDateCell(ws, currentRow, 7, item.fechaRequerimiento, {
        align: 'center',
        size: 9.5,
      })
      ws.getRow(currentRow).height = Math.max(
        22,
        estimateHeight(item.recursoHumano, 24, 22, 54),
        estimateHeight(item.funcion, 34, 22, 54),
      )
    } else {
      // Empty row to match official form grid
      applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
      ws.getRow(currentRow).height = 20
    }

    applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
    currentRow += 1
  }

  // Gap
  ws.getRow(currentRow).height = 6
  currentRow += 1

  // -------------------------------------------------------------
  // SOLICITUDES (3 rows)
  // -------------------------------------------------------------
  const requests = [
    { label: 'solicitudes operaciones:', value: activity.solicitudOperaciones || '' },
    { label: 'solicitud a audio', value: activity.solicitudAudio || '' },
    { label: 'solicitud a asistentes', value: activity.solicitudAsistentes || '' },
  ]

  requests.forEach(({ label, value }) => {
    ws.getRow(currentRow).height = 18
    ws.mergeCells(currentRow, 2, currentRow, 3)
    ws.mergeCells(currentRow, 4, currentRow, 9)

    setDataCell(ws, currentRow, 2, label, {
      align: 'left',
      size: 9,
      color: ARGB.black,
    })
    setDataCell(ws, currentRow, 4, value, {
      align: 'left',
      size: 9,
      wrap: true,
      color: ARGB.black,
    })

    applyBorder(ws, currentRow, 2, currentRow, 9, thinBorder())
    currentRow += 1
  })

  // Gap before signatures
  ws.getRow(currentRow).height = 16
  currentRow += 1

  // -------------------------------------------------------------
  // FIRMAS
  // -------------------------------------------------------------
  // Signature line row
  const sigLineRow = currentRow
  ws.getRow(sigLineRow).height = 8
  ws.mergeCells(sigLineRow, 3, sigLineRow, 5)
  ws.mergeCells(sigLineRow, 7, sigLineRow, 9)
  const leftLineBorder: Partial<ExcelJS.Borders> = {
    bottom: { style: 'thin', color: { argb: ARGB.black } },
  }
  const rightLineBorder: Partial<ExcelJS.Borders> = {
    bottom: { style: 'thin', color: { argb: ARGB.black } },
  }
  applyBorder(ws, sigLineRow, 3, sigLineRow, 5, leftLineBorder)
  applyBorder(ws, sigLineRow, 7, sigLineRow, 9, rightLineBorder)
  currentRow += 1

  // Signature labels row
  const sigLabelRow = currentRow
  ws.getRow(sigLabelRow).height = 16
  ws.mergeCells(sigLabelRow, 2, sigLabelRow, 5)
  ws.mergeCells(sigLabelRow, 6, sigLabelRow, 9)
  setDataCell(ws, sigLabelRow, 2, 'NOMBRE Y FIRMA DEL PROFESOR', {
    align: 'center',
    size: 8.5,
    bold: true,
  })
  setDataCell(ws, sigLabelRow, 6, 'COORDINADOR FIRMA DEL PROFESOR', {
    align: 'center',
    size: 8.5,
    bold: true,
  })
  currentRow += 1

  // Signature names row
  const sigNamesRow = currentRow
  ws.getRow(sigNamesRow).height = 16
  ws.mergeCells(sigNamesRow, 2, sigNamesRow, 5)
  ws.mergeCells(sigNamesRow, 6, sigNamesRow, 9)
  setDataCell(ws, sigNamesRow, 2, activity.profesorResponsable || '', {
    align: 'center',
    size: 8.5,
    italic: true,
  })
  setDataCell(ws, sigNamesRow, 6, activity.coordinador || '', {
    align: 'center',
    size: 8.5,
    italic: true,
  })
  currentRow += 1

  // Gap before footer
  ws.getRow(currentRow).height = 10
  currentRow += 1

  // -------------------------------------------------------------
  // FOOTER BANNER
  // -------------------------------------------------------------
  const footerRow = currentRow
  ws.getRow(footerRow).height = 30
  ws.mergeCells(footerRow, 2, footerRow, 9)

  if (FOOTER_COLEGIO_BAUTISTA_BASE64) {
    try {
      const footerId = workbook.addImage({
        base64: FOOTER_COLEGIO_BAUTISTA_BASE64,
        extension: 'png',
      })
      ws.addImage(footerId, {
        tl: { col: 1.0, row: footerRow - 1 },
        ext: { width: 735, height: 35 },
      })
    } catch {
      // Graceful fallback
    }
  }

  ws.pageSetup.printArea = `A1:I${footerRow + 1}`

  return ws
}

export function buildSummarySheet(
  workbook: ExcelJS.Workbook,
  activities: Activity[],
): ExcelJS.Worksheet {
  const ws = workbook.addWorksheet('Resumen', {
    properties: { defaultRowHeight: 18 },
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 5, // Legal / US Letter compatible in ExcelJS
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.3,
        footer: 0.3,
      },
    },
  })

  ws.columns = [
    { width: 6 },
    { width: 34 },
    { width: 24 },
    { width: 18 },
    { width: 24 },
    { width: 15 },
    { width: 17 },
    { width: 15 },
    { width: 12 },
  ]

  let row = 1
  ws.mergeCells(row, 1, row, 9)
  const titleCell = ws.getCell(row, 1)
  titleCell.value = 'RESUMEN DE ACTIVIDADES ACLE'
  titleCell.font = {
    name: FONT_NAME,
    size: 16,
    bold: true,
    color: { argb: ARGB.white },
  }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  setFill(titleCell, ARGB.brand900)
  ws.getRow(row).height = 32
  row += 1

  ws.mergeCells(row, 1, row, 9)
  const subtitleCell = ws.getCell(row, 1)
  subtitleCell.value = `Documento generado el ${new Date().toLocaleDateString(
    'es-CL',
  )} · ${activities.length} actividad(es)`
  subtitleCell.font = {
    name: FONT_NAME,
    size: 10,
    italic: true,
    color: { argb: ARGB.slate500 },
  }
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(row).height = 18
  row += 2

  const headers = [
    'N°',
    'Título',
    'Responsable',
    'Taller',
    'Fechas',
    'Materiales',
    'Recursos humanos',
    'Total',
    'Estado',
  ]

  headers.forEach((header, index) => {
    const cell = ws.getCell(row, index + 1)
    cell.value = header
    cell.font = {
      name: FONT_NAME,
      size: 9,
      bold: true,
      color: { argb: ARGB.black },
    }
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    }
    setFill(cell, ARGB.headerBlue)
    cell.border = thinBorder()
  })
  ws.getRow(row).height = 30
  row += 1

  const firstActivityRow = row

  activities.forEach((activity, index) => {
    const totals = activityTotals(activity)
    const cells = Array.from({ length: 9 }, (_, columnIndex) =>
      ws.getCell(row, columnIndex + 1),
    )

    cells[0].value = index + 1
    cells[1].value = activity.titulo
    cells[2].value = activity.responsable
    cells[3].value = activity.taller
    cells[4].value = `${formatDateCL(activity.fechaInicio)} — ${formatDateCL(
      activity.fechaTermino,
    )}`
    cells[5].value = totals.materiales
    cells[6].value = totals.recursosHumanos
    cells[7].value = totals.total
    cells[8].value =
      activity.estado === 'borrador' ? 'Borrador' : 'Finalizada'

    cells.forEach((cell, columnIndex) => {
      cell.font = {
        name: FONT_NAME,
        size: 9,
        color: { argb: ARGB.black },
      }
      cell.alignment = {
        vertical: 'middle',
        wrapText: columnIndex >= 1 && columnIndex <= 4,
      }
      cell.border = thinBorder()
      if (index % 2 === 1) setFill(cell, ARGB.slate50)
    })

    cells[0].alignment = { horizontal: 'center', vertical: 'middle' }
    cells[0].numFmt = INTEGER_FORMAT
    cells[4].alignment = { horizontal: 'center', vertical: 'middle' }
    cells[5].alignment = { horizontal: 'right', vertical: 'middle' }
    cells[5].numFmt = CLP_FORMAT
    cells[6].alignment = { horizontal: 'right', vertical: 'middle' }
    cells[6].numFmt = CLP_FORMAT
    cells[7].alignment = { horizontal: 'right', vertical: 'middle' }
    cells[7].numFmt = CLP_FORMAT
    cells[8].alignment = { horizontal: 'center', vertical: 'middle' }
    cells[8].font = {
      name: FONT_NAME,
      size: 9,
      bold: true,
      color: {
        argb:
          activity.estado === 'borrador' ? ARGB.amber700 : ARGB.emerald700,
      },
    }
    setFill(
      cells[8],
      activity.estado === 'borrador' ? ARGB.amber50 : ARGB.emerald50,
    )

    ws.getRow(row).height = 22
    row += 1
  })

  const lastActivityRow = row - 1
  ws.mergeCells(row, 1, row, 5)
  const totalLabel = ws.getCell(row, 1)
  totalLabel.value = 'TOTAL GENERAL'
  totalLabel.font = {
    name: FONT_NAME,
    size: 10,
    bold: true,
    color: { argb: ARGB.brand900 },
  }
  totalLabel.alignment = { horizontal: 'right', vertical: 'middle' }
  setFill(totalLabel, ARGB.brand50)

  const totals = activities.reduce(
    (acc, activity) => {
      const activityTotal = activityTotals(activity)
      return {
        materiales: acc.materiales + activityTotal.materiales,
        recursosHumanos: acc.recursosHumanos + activityTotal.recursosHumanos,
        total: acc.total + activityTotal.total,
      }
    },
    { materiales: 0, recursosHumanos: 0, total: 0 },
  )

  const totalCells = [
    { col: 6, result: totals.materiales },
    { col: 7, result: totals.recursosHumanos },
    { col: 8, result: totals.total },
  ]

  totalCells.forEach(({ col, result }) => {
    const cell = ws.getCell(row, col)
    const columnLetter = String.fromCharCode(64 + col)
    cell.value = {
      formula: `SUM(${columnLetter}${firstActivityRow}:${columnLetter}${lastActivityRow})`,
      result,
    }
    cell.font = {
      name: FONT_NAME,
      size: 10,
      bold: true,
      color: { argb: ARGB.brand900 },
    }
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    cell.numFmt = CLP_FORMAT
    setFill(cell, ARGB.brand50)
  })

  const statusCell = ws.getCell(row, 9)
  statusCell.value = ''
  setFill(statusCell, ARGB.brand50)

  applyBorder(ws, row, 1, row, 9, thinBorder())
  ws.getRow(row).height = 24

  ws.pageSetup.printArea = `A1:I${row}`
  ws.headerFooter = {
    oddFooter: `&LColegio Bautista Temuco · ACLE Gestión&RResumen · Página &P de &N`,
  }

  return ws
}

export function buildActivityWorkbook(activity: Activity): ExcelJS.Workbook {
  const workbook = createWorkbook()
  buildActivitySheet(workbook, activity, { sheetName: 'PRESUPUESTO ACLE' })
  return workbook
}

export function buildActivitiesWorkbook(activities: Activity[]): ExcelJS.Workbook {
  const workbook = createWorkbook()
  buildSummarySheet(workbook, activities)

  activities.forEach((activity, index) => {
    buildActivitySheet(workbook, activity, {
      sheetName: `${index + 1}. ${activity.titulo}`,
    })
  })

  return workbook
}

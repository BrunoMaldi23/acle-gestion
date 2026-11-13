import { saveAs } from 'file-saver'
import type { Workbook } from 'exceljs'
import type { Activity } from '@/types/activity'
import {
  buildExportFilename,
  buildMultiExportFilename,
} from '@/utils/filename'

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

async function downloadWorkbook(
  workbook: Workbook,
  filename: string,
): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: XLSX_MIME })
  saveAs(blob, filename)
}

export async function exportActivityToExcel(activity: Activity): Promise<void> {
  const { buildActivityWorkbook } = await import('./excelWorkbookBuilder')
  const workbook = buildActivityWorkbook(activity)
  await downloadWorkbook(workbook, buildExportFilename(activity.titulo))
}

export async function exportActivitiesToExcel(
  activities: Activity[],
): Promise<void> {
  if (activities.length === 0) {
    throw new Error('No hay actividades seleccionadas para exportar.')
  }

  const { buildActivitiesWorkbook } = await import('./excelWorkbookBuilder')
  const workbook = buildActivitiesWorkbook(activities)
  await downloadWorkbook(workbook, buildMultiExportFilename())
}

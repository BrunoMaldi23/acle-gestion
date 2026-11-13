import { describe, expect, it } from 'vitest'
import {
  buildExportFilename,
  buildMultiExportFilename,
  sanitizeFilename,
} from '@/utils/filename'

describe('sanitizeFilename', () => {
  it('elimina caracteres inválidos y reemplaza espacios', () => {
    expect(sanitizeFilename('Taller / Vóleibol: 2026')).toBe(
      'Taller_Voleibol_2026',
    )
  })

  it('elimina acentos y caracteres especiales', () => {
    expect(sanitizeFilename('Educación Física <ACLE>')).toBe(
      'Educacion_Fisica_ACLE',
    )
  })

  it('devuelve un valor por defecto si queda vacío', () => {
    expect(sanitizeFilename('   ///   ')).toBe('actividad')
  })

  it('limita el largo del nombre', () => {
    expect(sanitizeFilename('a'.repeat(200)).length).toBe(80)
  })
})

describe('nombres de archivo de exportación', () => {
  const fixedDate = new Date(2026, 10, 13)

  it('construye el nombre individual con título y fecha', () => {
    expect(buildExportFilename('Taller de Vóleibol', fixedDate)).toBe(
      'ACLE_Taller_de_Voleibol_2026-11-13.xlsx',
    )
  })

  it('construye el nombre del libro consolidado', () => {
    expect(buildMultiExportFilename(fixedDate)).toBe(
      'ACLE_Actividades_2026-11-13.xlsx',
    )
  })
})

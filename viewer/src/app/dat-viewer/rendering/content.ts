import { CHAR_WIDTH, LINE_HEIGHT, isHighContrast } from '../rendering.js'
import {
  type DatFile,
  type Header as DatHeader,
  type ColumnStats,
  getFieldReader,
} from 'pathofexile-dat/dat.js'
import type { Header as HeaderViewer } from '../headers.js'

// Dark theme syntax colors
const DARK_SYNTAX_COLORS = {
  number: '#4ade80', // green-400 for numbers/integers/decimals
  boolean: '#60a5fa', // blue-400 for booleans
  string: '#fbbf24', // amber-400 for strings
  null: '#f87171', // red-400 for null values
  key: '#a78bfa', // violet-400 for keys/references
  muted: '#64748b', // slate-500 for empty/muted values
  hex: '#94a3b8', // slate-400 for hex dumps
}

// High contrast theme syntax colors - maximum visibility
const HIGH_CONTRAST_SYNTAX_COLORS = {
  number: '#00ff00', // bright green for numbers
  boolean: '#00bfff', // bright cyan-blue for booleans
  string: '#ffff00', // bright yellow for strings
  null: '#ff4444', // bright red for null values
  key: '#ff00ff', // bright magenta for keys/references
  muted: '#888888', // gray for empty/muted values
  hex: '#ffffff', // white for hex dumps
}

// Get current syntax colors based on theme
function getSyntaxColors() {
  return isHighContrast() ? HIGH_CONTRAST_SYNTAX_COLORS : DARK_SYNTAX_COLORS
}

interface StringifyOut {
  text: string
  color: string
}

type SyntaxColors = ReturnType<typeof getSyntaxColors>

function integerToString(value: number, out: StringifyOut, colors: SyntaxColors) {
  out.text = String(value)
  out.color = colors.number
}
function decimalToString(value: number, out: StringifyOut, colors: SyntaxColors) {
  out.text = value.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 1 })
  out.color = colors.number
}
function integerArrayToString(value: number[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.join(', ')}]`
  out.color = colors.number
}
function decimalArrayToString(value: number[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.map((value) => value.toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 1 })).join(', ')}]`
  out.color = colors.number
}
function booleanToString(value: boolean, out: StringifyOut, colors: SyntaxColors) {
  out.text = String(value)
  out.color = colors.boolean
}
function booleanArrayToString(value: boolean[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.join(', ')}]`
  out.color = colors.boolean
}
function stringToString(value: string, out: StringifyOut, colors: SyntaxColors) {
  if (value === '') {
    out.text = 'empty'
    out.color = colors.muted
  } else {
    out.text = String(value)
    out.color = colors.string
  }
}
function stringArrayToString(value: string[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.map((str) => JSON.stringify(str)).join(', ')}]`
  out.color = colors.string
}
function keySelfToString(value: number | null, out: StringifyOut, colors: SyntaxColors) {
  if (value === null) {
    out.text = '<null, self>'
    out.color = colors.null
  } else {
    out.text = `<${value}, self>`
    out.color = colors.key
  }
}
function keySelfArrayToString(value: number[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.map((key) => `<${key}, self>`).join(', ')}]`
  out.color = colors.key
}
function keyForeignToString(value: number | null, out: StringifyOut, colors: SyntaxColors) {
  if (value === null) {
    out.text = '<null>'
    out.color = colors.null
  } else {
    out.text = `<${value}>`
    out.color = colors.key
  }
}
function keyForeignArrayToString(value: number[], out: StringifyOut, colors: SyntaxColors) {
  out.text = `[${value.map((key) => `<${key}>`).join(', ')}]`
  out.color = colors.key
}

export function renderCellContent(
  ctx: CanvasRenderingContext2D,
  header: DatHeader,
  datFile: DatFile,
  rows: number[],
  referenced?: { header: DatHeader; datFile: DatFile }
) {
  const colors = getSyntaxColors()
  const read = getFieldReader(header, datFile)

  if (referenced?.header.type.array) {
    throw new Error("Can't show array of arrays.")
  }
  type ReadReferencedReturn = (
    rowIdx: number
  ) => Exclude<ReturnType<ReturnType<typeof getFieldReader>>, unknown[]>
  const readReferenced =
    referenced && (getFieldReader(referenced.header, referenced.datFile) as ReadReferencedReturn)

  const draw: StringifyOut = { text: '', color: '' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stringify: (value: any, out: StringifyOut, colors: SyntaxColors) => void = (() => {
    const type = referenced != null ? referenced.header.type : header.type
    if (header.type.array) {
      if (type.boolean) return booleanArrayToString
      if (type.string) return stringArrayToString
      if (type.integer) return integerArrayToString
      if (type.decimal) return decimalArrayToString
      if (type.key?.foreign) return keyForeignArrayToString
      if (type.key) return keySelfArrayToString
    } else {
      if (type.boolean) return booleanToString
      if (type.string) return stringToString
      if (type.integer) return integerToString
      if (type.decimal) return decimalToString
      if (type.key?.foreign) return keyForeignToString
      if (type.key) return keySelfToString
    }
    throw new Error('never')
  })()

  let textY = 0
  let prevColor = ''
  for (const rid of rows) {
    let cellData = read(rid)
    if (referenced) {
      if (header.type.array) {
        cellData = (cellData as number[]).map((rRid) => readReferenced!(rRid))
        stringify(cellData, draw, colors)
      } else {
        if (cellData === null) {
          const stringifyNull = header.type.key!.foreign ? keyForeignToString : keySelfToString
          stringifyNull(cellData, draw, colors)
        } else {
          cellData = readReferenced!(cellData as number)
          stringify(cellData, draw, colors)
        }
      }
    } else {
      stringify(cellData, draw, colors)
    }

    if (prevColor !== draw.color) {
      ctx.fillStyle = draw.color
      prevColor = draw.color
    }
    ctx.fillText(draw.text, 0, textY)
    textY += LINE_HEIGHT
  }
}

export function drawByteView(
  ctx: CanvasRenderingContext2D,
  header: DatHeader,
  datFile: DatFile,
  rows: number[],
  begin: number,
  end: number
) {
  const colors = getSyntaxColors()
  ctx.fillStyle = colors.hex

  let textY = 0
  for (const rowIdx of rows) {
    const data = datFile.dataFixed.subarray(
      rowIdx * datFile.rowLength + header.offset + begin,
      rowIdx * datFile.rowLength + header.offset + end
    )
    const hexDump = Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join(' ')

    ctx.fillText(hexDump, begin * (CHAR_WIDTH * 3), textY)
    textY += LINE_HEIGHT
  }
}

export function drawArrayVarData(
  ctx: CanvasRenderingContext2D,
  header: HeaderViewer,
  datFile: DatFile,
  rows: number[],
  stats: ColumnStats
) {
  const colors = getSyntaxColors()
  ctx.fillStyle = colors.hex

  const stat = stats.refArray as Exclude<(typeof stats)['refArray'], false>
  const entryMaxLength = Math.max(
    ...[
      stat.keyForeign ? datFile.fieldSize.KEY_FOREIGN : 0,
      stat.keySelf ? datFile.fieldSize.KEY : 0,
      stat.string ? datFile.fieldSize.STRING : 0,
      // (stat.numeric64 ? datFile.fieldSize.LONGLONG : 0),
      stat.numeric32 ? datFile.fieldSize.LONG : 0,
      // (stat.numeric16 ? datFile.fieldSize.SHORT : 0),
      datFile.fieldSize.BYTE,
    ]
  )
  const maxReadBytes = Math.ceil(header.textLength! / 3)

  let textY = 0
  for (const rowIdx of rows) {
    const arrayLength = datFile.readerFixed.getUint32(
      rowIdx * datFile.rowLength + header.offset,
      true
    )
    if (arrayLength === 0) {
      ctx.fillText('[]', 0, textY)
    } else {
      const varOffset = datFile.readerFixed.getUint32(
        rowIdx * datFile.rowLength + header.offset + datFile.memsize,
        true
      )

      const data = datFile.dataVariable.subarray(
        varOffset,
        varOffset + Math.min(entryMaxLength * arrayLength, maxReadBytes)
      )
      const hexDump = Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join(' ')

      ctx.fillText(`${arrayLength} { ${hexDump} }`, 0, textY)
    }
    textY += LINE_HEIGHT
  }
}

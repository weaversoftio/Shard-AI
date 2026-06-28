import { spawn } from 'child_process'
import { join } from 'path'

export interface NormalizeResult {
  status: 'ok' | 'warning' | 'error'
  error_type?: string
  line_count?: number
  norm_dir?: string
  column_count?: number
  is_numeric?: boolean
  output_dir?: string
  message?: string
}

export function runNormalization(
  mode: 'lined' | 'blank',
  inputPath: string,
  outputDir: string,
): Promise<NormalizeResult> {
  return new Promise((resolve) => {
    const scriptPath = join(process.cwd(), 'scripts', 'normalize_pipeline.py')
    const pythonBin = process.env.PYTHON_BIN ?? 'python3'
    const proc = spawn(pythonBin, [
      scriptPath,
      '--mode', mode,
      '--input', inputPath,
      '--output-dir', outputDir,
    ], {
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
      process.stderr.write(d)
    })

    proc.on('close', (code) => {
      try {
        const lastLine = stdout.trim().split('\n').pop() ?? ''
        resolve(JSON.parse(lastLine) as NormalizeResult)
      } catch {
        resolve({
          status: 'error',
          error_type: 'PROCESSING_ERROR',
          message: stderr || `exit code ${code}`,
        })
      }
    })

    proc.on('error', (err) => {
      resolve({ status: 'error', error_type: 'SPAWN_ERROR', message: err.message })
    })
  })
}

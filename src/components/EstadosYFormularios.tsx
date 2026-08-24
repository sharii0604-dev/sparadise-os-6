import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import './shared.css'

// ---- Estados ----

export function EstadoVacio({ children }: { children: ReactNode }) {
  return <p className="estado-vacio">{children}</p>
}

export function EstadoCargando({ children = 'Cargando…' }: { children?: ReactNode }) {
  return (
    <p className="estado-cargando">
      <span className="spinner" aria-hidden="true" />
      {children}
    </p>
  )
}

export function EstadoError({ children, onReintentar }: { children: ReactNode; onReintentar?: () => void }) {
  return (
    <div className="form-error" role="alert">
      {children}
      {onReintentar && (
        <button type="button" className="btn-texto" style={{ padding: '0 0 0 10px' }} onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

// ---- Campos de formulario ----

interface CampoWrapperProps {
  label: string
  htmlFor: string
  error?: string
  requerido?: boolean
  children: ReactNode
}

export function CampoWrapper({ label, htmlFor, error, requerido, children }: CampoWrapperProps) {
  return (
    <div className="campo">
      <label htmlFor={htmlFor}>
        {label}
        {requerido && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p className="campo-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}
export function TextField({ label, error, id, required, ...rest }: TextFieldProps) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper label={label} htmlFor={inputId} error={error} requerido={required}>
      <input id={inputId} required={required} aria-invalid={!!error} {...rest} />
    </CampoWrapper>
  )
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}
export function TextAreaField({ label, error, id, required, ...rest }: TextAreaFieldProps) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper label={label} htmlFor={inputId} error={error} requerido={required}>
      <textarea id={inputId} rows={3} required={required} aria-invalid={!!error} {...rest} />
    </CampoWrapper>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  placeholder?: string
}
export function SelectField({ label, error, id, required, placeholder, children, ...rest }: SelectFieldProps) {
  const inputId = id ?? `campo-${label.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <CampoWrapper label={label} htmlFor={inputId} error={error} requerido={required}>
      <select id={inputId} required={required} aria-invalid={!!error} defaultValue="" {...rest}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    </CampoWrapper>
  )
}

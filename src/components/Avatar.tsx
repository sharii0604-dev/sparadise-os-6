import './components.css'

function iniciales(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/)
  const primera = partes[0]?.[0] ?? ''
  const segunda = partes.length > 1 ? partes[1]?.[0] ?? '' : ''
  return (primera + segunda).toUpperCase()
}

interface AvatarProps {
  nombre: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'nude' | 'durazno'
}

export function Avatar({ nombre, size = 'md', variant = 'nude' }: AvatarProps) {
  return (
    <div
      className={`avatar avatar--${size} ${variant === 'durazno' ? 'avatar--durazno' : ''}`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </div>
  )
}

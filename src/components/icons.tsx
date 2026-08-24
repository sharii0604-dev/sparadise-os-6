/**
 * Íconos de Sparadise OS.
 *
 * Cada `path` está copiado literalmente de 01_Panel_Bienvenida.html /
 * 02_Arquitectura_Navegacion.html / Sparadise_OS_Guia_Visual.html.
 * No se agregan formas nuevas: mismo trazo fino, esquinas redondeadas,
 * stroke-width 1.7–2.2 según el contexto, tal como especifica la Guía Visual §04.
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base: IconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconInicio(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  )
}

export function IconClientas(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.5-4 4-5.5 7-5.5s5.5 1.5 7 5.5" />
    </svg>
  )
}

export function IconAgenda(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <rect x="4" y="5" width="16" height="15" rx="4" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  )
}

export function IconPagos(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  )
}

export function IconTratamientos(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M12 3c1 3 3 4 6 5-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-2 6-5Z" />
    </svg>
  )
}

export function IconMarketing(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  )
}

export function IconDashboard(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M4 19V9M10 19V5M16 19v-7M4 19h16" />
    </svg>
  )
}

export function IconCentroInteligencia(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.7} {...props}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

export function IconBuscar(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function IconCorazon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.4-9.5 9-9.5 9Z" />
    </svg>
  )
}

export function IconNotificacion(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function IconMas(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconWhatsapp(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} {...props}>
      <path d="M21 11.5a8.5 8.5 0 1 1-4-7.2" />
      <path d="M21 3l-9.5 9.5" />
    </svg>
  )
}

export function IconMasOpciones(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.8} {...props}>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </svg>
  )
}

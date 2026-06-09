type Props = {
  className?: string
  muted?: boolean
  title?: string
}

/** Speaker icon — same size when muted, with a diagonal slash when sound is off. */
export default function SpeakerIcon({
  className = 'w-4.5 h-4.5',
  muted = false,
  title
}: Props): React.JSX.Element {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      viewBox="0 0 24 24"
      className={`fill-current ${className}`}
    >
      {title ? <title>{title}</title> : null}
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      {muted ? (
        <path
          d="M2 2l20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  )
}

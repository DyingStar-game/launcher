type Props = {
  className?: string
  title?: string
}

/** Discord logo SVG for login and navbar links. */
export default function DiscordIcon({
  className = 'w-4.5 h-4.5',
  title = 'Discord'
}: Props): React.JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-current ${className}`}>
      <title>{title}</title>
      <path d="M16.8 7.2c-1-.8-2.1-1.2-3.3-1.4l-.3.6c1.3.2 2.2.6 3 1.1-1.1-.6-2.4-1-4.2-1s-3.1.4-4.2 1c.8-.5 1.7-.9 3-1.1l-.3-.6c-1.2.2-2.3.6-3.3 1.4-2 3-2.6 5.9-2.3 8.7 1.3 1 2.7 1.6 4.1 2l.5-.8c-.9-.3-1.8-.7-2.6-1.2l.5-.4c1.6.8 3.2 1.1 4.6 1.1s3-.3 4.6-1.1l.5.4c-.8.5-1.7.9-2.6 1.2l.5.8c1.4-.4 2.8-1 4.1-2 .3-2.8-.3-5.7-2.3-8.7zM9.6 14.2c-.6 0-1.1-.6-1.1-1.3s.5-1.3 1.1-1.3 1.1.6 1.1 1.3-.5 1.3-1.1 1.3zm4.8 0c-.6 0-1.1-.6-1.1-1.3s.5-1.3 1.1-1.3 1.1.6 1.1 1.3-.5 1.3-1.1 1.3z" />
    </svg>
  )
}

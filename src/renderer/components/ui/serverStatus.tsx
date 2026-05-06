import { ServerStatus as Status } from '@store/game'

type Props = {
  status: Status
}

export default function ServerStatus({ status }: Props) {
  const color =
    status === 'online'
      ? 'bg-green-500'
      : status === 'offline'
      ? 'bg-red-500'
      : 'bg-orange-400'

  return (
    <span className={`w-2 h-2 rounded-full ${color}`} />
  )
}
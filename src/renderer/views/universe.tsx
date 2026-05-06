import { useNavigationStore } from '@store/navigation'
import AccountPanel from '@components/panel/accountPanel'
import GamePanel from '@components/panel/gamePanel'
import SocialPanel from '@components/panel/socialPanel'
import FilesPanel from '@components/panel/filesPanel'

export default function Universe(): React.JSX.Element {
  const { navigate } = useNavigationStore()

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">

      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--color-ds-text)] mb-2">
          Universe
        </h1>
        <p className="text-[var(--color-ds-muted)] text-sm">
          Environnement de production
        </p>
      </div>

      <AccountPanel />
      <GamePanel />
      <SocialPanel />
      <FilesPanel />

    </div>
  )
}
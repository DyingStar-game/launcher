import { useNavigationStore } from '@store/navigation'
import AccountPanel from '@components/panel/accountPanel'
import GamePanel from '@components/panel/gamePanel'
import SocialPanel from '@components/panel/socialPanel'
import FilesPanel from '@components/panel/filesPanel'

export default function Universe(): React.JSX.Element {
  useNavigationStore()

  return (
    <div className="h-full grid grid-cols-2 grid-rows-2 gap-4 p-4">
      <AccountPanel />
      <SocialPanel />
      <GamePanel />
      <FilesPanel />
    </div>
  )
}